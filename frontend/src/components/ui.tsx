import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useApps } from "../lib/appContext";
import type { Range } from "../lib/types";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "";
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

const RANGES: Range[] = ["15m", "1h", "6h", "24h", "7d"];

export function RangePicker() {
  const { range, setRange } = useApps();
  return (
    <div className="flex overflow-hidden rounded-md border border-line">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`px-3 py-1.5 text-xs ${range === r ? "bg-accent text-black" : "bg-panel text-muted hover:text-white"}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function NoApp() {
  return (
    <div className="card mx-auto mt-16 max-w-md text-center">
      <h2 className="text-lg font-semibold">No application selected</h2>
      <p className="mt-1 text-sm text-muted">Create an application to start receiving telemetry.</p>
      <Link to="/app/applications" className="btn-primary mt-4 inline-block">Create application</Link>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card py-10 text-center text-sm text-muted">{children}</div>;
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div className="card border-bad/40 text-sm text-bad">{(error as Error).message}</div>;
}

export const chartTheme = {
  grid: "#232834",
  axis: "#8a93a6",
  tooltip: { background: "#181c25", border: "1px solid #232834", borderRadius: 6, fontSize: 12 },
};

