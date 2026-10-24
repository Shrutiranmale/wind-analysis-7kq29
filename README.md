# Wind Forecast Accuracy Dashboard

A full-stack web application that evaluates wind power forecast accuracy by comparing forecast data with actual wind generation data from the Elexon BMRS API for January 2026.

## Features

- Select a delivery date for analysis.
- Compare forecast wind generation against actual generation.
- Calculate Mean Absolute Error (MAE), Root Mean Square Error (RMSE), and forecast bias.
- Visualize forecast and actual generation using an interactive line chart.
- View hourly forecast values, actual generation, and forecast errors.
- Display retrieved records and comparable intervals.

## Technology Stack

**Frontend:** React, TypeScript, Vite, Recharts, Lucide React

**Backend:** Python, FastAPI, Requests

**Containerization:** Docker, Docker Compose

**Version Control:** Git, GitHub

**Data Source:** Elexon BMRS API

## Project Structure

```text
wind-power-dashboard/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.12 or a compatible version
- Node.js and npm
- Docker Desktop for containerized execution
- Git

## Running Locally

### 1. Start the Backend

Open a terminal at the project root and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The backend runs at `http://localhost:8000`.

API documentation is available at `http://localhost:8000/docs`.

### 2. Start the Frontend

Open a second terminal at the project root and run:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser.

## Running with Docker

From the project root, run:

```bash
docker compose up --build
```

Open `http://localhost:5173` to access the dashboard.

To stop the containers, run:

```bash
docker compose down
```

## Data Source and Methodology

The application retrieves actual wind generation data from the Elexon FUELHH dataset and wind forecast data from the WINDFOR dataset.

Actual half-hourly readings are aggregated into hourly values and compared with forecast values for matching intervals. Only intervals with both actual and forecast values are included in the error calculations.

### Performance Metrics

- **Mean Absolute Error (MAE):** The average absolute difference between forecast and actual generation.
- **Root Mean Square Error (RMSE):** The square root of the average squared forecast error.
- **Forecast Bias:** The average signed error, calculated as forecast minus actual generation. A positive bias indicates overforecasting, while a negative bias indicates underforecasting.

Generation and error values are expressed in megawatts (MW).

### Forecast Publication Cutoff

The prototype uses 12:00 UTC on the day before delivery as its forecast publication cutoff. This is an implementation assumption because the assignment does not specify an exact cutoff time.

The application filters forecast records according to this cutoff and documents the assumption in the dashboard. The selected delivery date, source data availability, and cutoff assumption can affect the reported metrics.

## API Endpoint

The backend analysis endpoint is:

`GET /api/analysis?delivery_date=2026-01-01`

Replace the date with the delivery date you want to analyse.

## External Data Source

Elexon BMRS API: https://data.elexon.co.uk/bmrs

The application depends on the availability and completeness of the external API data.

## AI Tools Used

AI assistance was used during development for coding guidance, debugging, understanding technical concepts, and preparing documentation. The application was tested locally during development.

## Deployment Links

- **Live Application:** To be added after deployment.
- **Backend API:** To be added after deployment.
- **GitHub Repository:** https://github.com/Shrutiranmale/wind-analysis-7kq29
- **Demo Video:** To be added after recording and uploading the unlisted YouTube video.

## Future Improvements

- Expand automated tests for API responses and metric calculations.
- Improve handling of missing or unavailable external data.
- Add historical comparisons and additional visualizations.
- Implement production deployment monitoring and logging.
