
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import './App.css';

type DataPoint = {
  startTime: string;
  forecastPublishedAt: string;
  forecastMW: number;
  actualMW: number;
  errorMW: number;
};

type Analysis = {
  deliveryDate: string;
  forecastCutoffUTC: string;
  cutoffAssumption: string;
  metricUnits: string;
  actualRecordsRetrieved: number;
  forecastRecordsRetrieved: number;
  comparableIntervals: number;
  maeMW: number;
  rmseMW: number;
  biasMW: number;
  data: DataPoint[];
};

function App() {
  const [date, setDate] = useState('2026-01-15');
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAnalysis(selectedDate: string) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/analysis?delivery_date=${selectedDate}`)

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const result: Analysis = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load analysis'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalysis(date);
  }, []);

  const formatMW = (value: number) =>
    value.toLocaleString('en-GB', {
      maximumFractionDigits: 2,
    });

  const chartData =
    data?.data.map((point) => ({
      ...point,
      hour: new Date(point.startTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }),
    })) ?? [];

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">ENERGY ANALYTICS</p>
          <h1>Wind Power Forecast Monitor</h1>
          <p className="subtitle">
            Compare predicted wind generation against actual output.
          </p>
        </div>

        <label className="date-control">
          Delivery date
          <input
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={date}
            onChange={(event) => {
              const selectedDate = event.target.value;
              setDate(selectedDate);
              if (selectedDate) void loadAnalysis(selectedDate);
            }}
          />
        </label>
      </header>

      <section className="status-row">
        <span className="status-dot" />
        <span>Elexon generation data</span>
        <span className="status-divider">/</span>
        <span>{date}</span>
        <span className="status-spacer" />
        <button
          className="refresh-button"
          onClick={() => void loadAnalysis(date)}
          disabled={loading}
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </section>

      {loading && (
        <div className="message">Loading generation analysis…</div>
      )}

      {error && (
        <div className="error-message">
          <strong>Could not load the analysis.</strong>
          <p>{error}</p>
          <p>
            Check that your Python backend is running on port 8000 and that
            the API is accessible.
          </p>
          <button
            className="refresh-button"
            onClick={() => void loadAnalysis(date)}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="metric-grid">
            <MetricCard
              label="Mean absolute error"
              value={data.maeMW}
              description="Average absolute forecast error"
            />
            <MetricCard
              label="Root mean squared error"
              value={data.rmseMW}
              description="Penalises larger forecast errors"
            />
            <MetricCard
              label="Forecast bias"
              value={data.biasMW}
              description="Positive means forecasts exceed actuals"
            />
            <MetricCard
              label="Comparable intervals"
              value={data.comparableIntervals}
              description="Hourly intervals compared"
              decimals={0}
              unit=""
            />
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">DAILY REVIEW</p>
                <h2>Forecast accuracy summary</h2>
              </div>
              <span className="date-pill">{data.deliveryDate}</span>
            </div>

            <p className="summary">
              Across {data.comparableIntervals} comparable hourly intervals,
              the mean absolute error was {formatMW(data.maeMW)} MW, and the
              forecast bias was {formatMW(data.biasMW)} MW. A positive bias
              indicates that forecasts were higher than actual generation on
              average.
            </p>

            <div className="info-strip">
              <strong>Forecast publication cutoff</strong>
              <p>
                {data.cutoffAssumption}. Selected cutoff:{' '}
                {data.forecastCutoffUTC}.
              </p>
              <p>
                Retrieved {data.actualRecordsRetrieved} actual records and{' '}
                {data.forecastRecordsRetrieved} forecast records. Metrics use{' '}
                {data.comparableIntervals} matched hourly intervals.
              </p>
              <p>
                Confirm the cutoff assumption and time alignment against the
                assignment requirements before using these metrics for
                purchasing decisions.
              </p>
            </div>
          </section>

          <section className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">GENERATION PROFILE</p>
                <h2>Forecast vs actual generation</h2>
              </div>
              <span className="date-pill">MW · UTC</span>
            </div>

            <p className="chart-description">
              Compare forecast and actual wind generation throughout the
              selected day.
            </p>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8edf4"
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#7b8798', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#dfe5ee' }}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: '#7b8798', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                    tickFormatter={(value: number) =>
                      `${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString('en-GB')} MW`,
                    ]}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e3e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="forecastMW"
                    name="Forecast"
                    stroke="#6575e8"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualMW"
                    name="Actual"
                    stroke="#21a67a"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel data-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">HOURLY BREAKDOWN</p>
                <h2>Forecast and actual values</h2>
              </div>
              <span className="date-pill">{data.metricUnits}</span>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hour (UTC)</th>
                    <th>Forecast (MW)</th>
                    <th>Actual (MW)</th>
                    <th>Error (MW)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((point) => (
                    <tr key={point.startTime}>
                      <td>
                        {new Date(point.startTime).toLocaleTimeString(
                          'en-GB',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC',
                          }
                        )}
                      </td>
                      <td>{formatMW(point.forecastMW)}</td>
                      <td>{formatMW(point.actualMW)}</td>
                      <td>{formatMW(point.errorMW)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <footer>
        <span>Wind Power Analytics</span>
        <span>Data source: Elexon</span>
      </footer>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  decimals?: number;
  unit?: string;
};

function MetricCard({
  label,
  value,
  description,
  decimals = 2,
  unit = ' MW',
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">
        {value.toLocaleString('en-GB', {
          maximumFractionDigits: decimals,
        })}
        {unit && <span className="metric-unit">{unit}</span>}
      </p>
      <p className="metric-description">{description}</p>
    </article>
  );
}

export default App;
