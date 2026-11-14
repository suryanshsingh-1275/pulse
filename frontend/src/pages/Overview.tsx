import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTheme, ErrorBox, NoApp, PageHeader, RangePicker, Stat } from "../components/ui";
import { api } from "../lib/api";
import { useApps } from "../lib/appContext";
import { ago, ms, num, timeLabel } from "../lib/format";
import type { AlertEvent, Overview as OverviewT, SeriesPoint } from "../lib/types";

export default function Overview() {
  const { current, range } = useApps();
  const id = current?._id;

  const overview = useQuery({
    queryKey: ["app", id, "overview", range],
    queryFn: () => api<OverviewT>(`/apps/${id}/metrics/overview?range=${range}`),
    enabled: !!id,
  });
  const series = useQuery({
    queryKey: ["app", id, "timeseries", range],
    queryFn: () => api<SeriesPoint[]>(`/apps/${id}/metrics/timeseries?range=${range}`),
    enabled: !!id,
  });
  const incidents = useQuery({
    queryKey: ["app", id, "alerts", "history"],
    queryFn: () => api<AlertEvent[]>(`/apps/${id}/alerts/history`),
    enabled: !!id,
  });

  if (!current) return <NoApp />;
  if (overview.error) return <ErrorBox error={overview.error} />;

  const o = overview.data;
  const long = range === "24h" || range === "7d";
  const data = (series.data ?? []).map((p) => ({ ...p, label: timeLabel(p.t, long) }));
  const healthTone = o?.health === "healthy" ? "good" : o?.health === "degraded" ? "warn" : o?.health === "critical" ? "bad" : undefined;

  return (
    <>
      <PageHeader title={current.name} subtitle={`${current.environment} · application health`} right={<RangePicker />} />

      {o?.health === "no-data" && (
        <div className="card mb-4 text-sm text-muted">
          No telemetry in this time range yet. Integrate the SDK from the Applications page and send some traffic.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Health" value={o?.health ?? "…"} tone={healthTone} />
        <Stat label="Total requests" value={o ? num(o.total) : "…"} />
        <Stat label="Requests / min" value={o?.rpm ?? "…"} />
        <Stat label="Error rate (5xx)" value={o ? `${o.errorRate}%` : "…"} tone={o && o.errorRate >= 5 ? "bad" : o && o.errorRate >= 1 ? "warn" : undefined} />
        <Stat label="Avg latency" value={o ? ms(o.avgLatency) : "…"} />
        <Stat label="P50" value={o ? ms(o.p50) : "…"} />
        <Stat label="P95" value={o ? ms(o.p95) : "…"} />
        <Stat label="P99" value={o ? ms(o.p99) : "…"} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-sm font-medium">Requests</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={11} />
              <YAxis stroke={chartTheme.axis} fontSize={11} width={40} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Area type="monotone" dataKey="requests" stroke="#4f9dff" fill="#4f9dff22" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-medium">Latency (avg / p95, ms)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={11} />
              <YAxis stroke={chartTheme.axis} fontSize={11} width={40} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Line type="monotone" dataKey="avg" stroke="#34d399" dot={false} />
              <Line type="monotone" dataKey="p95" stroke="#fbbf24" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-medium">Failed requests (5xx)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={11} />
              <YAxis stroke={chartTheme.axis} fontSize={11} width={40} allowDecimals={false} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Bar dataKey="errors" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-medium">Recent incidents</h3>
          {!incidents.data?.length && <div className="text-sm text-muted">No alert activity yet.</div>}
          <ul className="space-y-2">
            {incidents.data?.slice(0, 6).map((e) => (
              <li key={e._id} className="flex items-start gap-2 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.state === "firing" ? "bg-bad" : "bg-good"}`} />
                <div>
                  <div>{e.message}</div>
                  <div className="text-xs text-muted">{e.state} · {ago(e.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}