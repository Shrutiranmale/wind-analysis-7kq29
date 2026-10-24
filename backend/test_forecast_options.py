
import requests

BASE = "https://data.elexon.co.uk/bmrs/api/v1"
delivery_date = "2026-01-15"

tests = [
    (
        "WINDFOR publishTimeFrom/To",
        f"{BASE}/datasets/WINDFOR/stream",
        {
            "publishTimeFrom": "2026-01-14T00:00:00Z",
            "publishTimeTo": "2026-01-15T00:00:00Z",
        },
    ),
    (
        "WINDFOR publishDateTimeFrom/To",
        f"{BASE}/datasets/WINDFOR/stream",
        {
            "publishDateTimeFrom": "2026-01-14T00:00:00Z",
            "publishDateTimeTo": "2026-01-15T00:00:00Z",
        },
    ),
    (
        "Earliest historical wind forecast",
        f"{BASE}/forecast/generation/wind/earliest/stream",
        {
            "from": f"{delivery_date}T00:00:00Z",
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
        data = response.json()

        if isinstance(data, dict):
            data = data.get("data", [])

        print("Records:", len(data) if isinstance(data, list) else "unexpected format")

        if isinstance(data, list) and data:
            for item in data[:3]:
                print({
                    key: item.get(key)
                    for key in ("publishTime", "startTime", "settlementDate",
                                "settlementPeriod", "generation")
                    if key in item
                })
    except Exception as exc:
        print("ERROR:", exc)
