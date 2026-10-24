
import requests

BASE = "https://data.elexon.co.uk/bmrs/api/v1"

tests = [
    (
        "FUELHH using settlement-date filters",
        f"{BASE}/datasets/FUELHH/stream",
        {
            "settlementDateFrom": "2026-01-15",
            "settlementDateTo": "2026-01-15",
            "fuelType": "WIND",
        },
    ),
    (
        "WINDFOR using publication-time filters",
        f"{BASE}/datasets/WINDFOR/stream",
        {
            "publishTimeFrom": "2026-01-14T00:00:00Z",
            "publishTimeTo": "2026-01-15T00:00:00Z",
        },
    ),
    (
        "Dedicated historical wind forecast endpoint",
        f"{BASE}/forecast/generation/wind/latest/stream",
        {
            "from": "2026-01-15T00:00:00Z",
            "to": "2026-01-16T00:00:00Z",
        },
    ),
]

for name, url, params in tests:
    print(f"\n--- {name} ---")

    try:
        response = requests.get(url, params=params, timeout=60)
        print("Status:", response.status_code)
        response.raise_for_status()

        payload = response.json()
        records = (
            payload if isinstance(payload, list)
            else payload.get("data", [])
            if isinstance(payload, dict)
            else []
        )

        print("Records:", len(records))

        for record in records[:3]:
            print(record)

        if not records:
            print("No records returned.")

    except Exception as exc:
        print("Request failed:", repr(exc))
