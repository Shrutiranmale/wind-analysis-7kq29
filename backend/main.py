from fastapi.middleware.cors import CORSMiddleware
from datetime import date, datetime, time, timedelta, timezone
from math import sqrt

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
UTC = timezone.utc

app = FastAPI(title="Wind Forecast Accuracy Dashboard")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wind-analysis-dashboard.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def fetch_records(dataset: str, params: dict) -> list[dict]:
    url = f"{BASE_URL}/{dataset}/stream"
    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()
    records = response.json()

    if not isinstance(records, list):
        raise ValueError(f"Unexpected response format from {dataset}")

    return records


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


@app.get("/")
def home():
    return {
        "message": "Wind Forecast Accuracy Dashboard API",
        "analysis": "/api/analysis?delivery_date=2026-01-15",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/analysis")
def analysis(
    delivery_date: date = Query(..., description="Delivery date in January 2026")
):
    if delivery_date.year != 2026 or delivery_date.month != 1:
        raise HTTPException(
            status_code=400,
            detail="Choose a delivery date in January 2026.",
        )

    delivery_start = datetime.combine(delivery_date, time.min, tzinfo=UTC)
    delivery_end = delivery_start + timedelta(days=1)

    # Prototype assumption: purchasing cutoff is noon UTC on the previous day.
    cutoff = delivery_start - timedelta(days=1) + timedelta(hours=12)

    try:
        actual_records = fetch_records(
            "FUELHH",
            {
                "settlementDateFrom": delivery_date.isoformat(),
                "settlementDateTo": delivery_date.isoformat(),
                "fuelType": "WIND",
            },
        )

        # Retrieve records published before the assumed cutoff.
        forecast_records = fetch_records(
            "WINDFOR",
            {
                "publishDateTimeFrom": (
                    delivery_start - timedelta(days=3)
                ).isoformat().replace("+00:00", "Z"),
                "publishDateTimeTo": cutoff.isoformat().replace("+00:00", "Z"),
            },
        )
    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve valid Elexon data: {exc}",
        ) from exc

    # Convert the actual half-hour readings to hourly average MW.
    actual_by_hour = {}

    for record in actual_records:
        if record.get("fuelType") != "WIND":
            continue

        start = parse_time(record["startTime"])
        if not delivery_start <= start < delivery_end:
            continue

        hour = start.replace(minute=0, second=0, microsecond=0)
        actual_by_hour.setdefault(hour, []).append(float(record["generation"]))

    hourly_actual = {
        hour: sum(values) / len(values)
        for hour, values in actual_by_hour.items()
        if values
    }

    # Keep the latest forecast published on or before the cutoff
    # for each hourly delivery timestamp.
    forecast_by_hour = {}

    for record in forecast_records:
        published = parse_time(record["publishTime"])
        start = parse_time(record["startTime"])

        if published > cutoff:
            continue
        if not delivery_start <= start < delivery_end:
            continue

        hour = start.replace(minute=0, second=0, microsecond=0)
        existing = forecast_by_hour.get(hour)

        if existing is None or published > existing["published"]:
            forecast_by_hour[hour] = {
                "published": published,
                "generation": float(record["generation"]),
            }

    common_hours = sorted(
        set(hourly_actual).intersection(forecast_by_hour)
    )

    rows = []
    errors = []

    for hour in common_hours:
        actual = hourly_actual[hour]
        forecast = forecast_by_hour[hour]["generation"]
        error = forecast - actual

        rows.append({
            "startTime": hour.isoformat(),
            "forecastPublishedAt": forecast_by_hour[hour]["published"].isoformat(),
            "forecastMW": round(forecast, 2),
            "actualMW": round(actual, 2),
            "errorMW": round(error, 2),
        })
        errors.append(error)

    if errors:
        mae = sum(abs(error) for error in errors) / len(errors)
        rmse = sqrt(sum(error ** 2 for error in errors) / len(errors))
        bias = sum(errors) / len(errors)
    else:
        mae = rmse = bias = None

    return {
        "deliveryDate": delivery_date.isoformat(),
        "forecastCutoffUTC": cutoff.isoformat(),
        "cutoffAssumption": "12:00 UTC on the previous day",
        "metricUnits": "MW",
        "actualRecordsRetrieved": len(actual_records),
        "forecastRecordsRetrieved": len(forecast_records),
        "comparableIntervals": len(rows),
        "maeMW": round(mae, 2) if mae is not None else None,
        "rmseMW": round(rmse, 2) if rmse is not None else None,
        "biasMW": round(bias, 2) if bias is not None else None,
        "data": rows,
    }
