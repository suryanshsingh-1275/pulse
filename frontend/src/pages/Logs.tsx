import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Empty, ErrorBox, NoApp, PageHeader } from "../components/ui";
import { api } from "../lib/api";
import { useApps } from "../lib/appContext";
import type { LogEntry } from "../lib/types";

const COLORS: Record<string, string> = { debug: "text-muted", info: "text-accent", warn: "text-warn", error: "text-bad" };

export default function Logs() {
  const { current } = useApps();
  const id = current?._id;
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: ["app", id, "logs", level, q],
    queryFn: () => api<{ logs: LogEntry[] }>(`/apps/${id}/logs?${new URLSearchParams({ ...(level && { level }), ...(q && { q }) })}`),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  if (!current) return <NoApp />;
  if (error) return <ErrorBox error={error} />;

  return (
    <>
      <PageHeader title="Logs" subtitle="Structured application logs (sensitive keys are redacted by the SDK)" />
      <div className="mb-3 flex gap-2">
        <input className="input max-w-sm" placeholder="Search messages…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-36" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          <option value="debug">debug</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
        </select>
      </div>

      {isLoading ? <div className="text-muted">Loading…</div> : !data?.logs.length ? (
        <Empty>No logs match.</Empty>
      ) : (
        <div className="card divide-y divide-line/60 p-0 font-mono text-xs">
          {data.logs.map((l) => (
            <div key={l._id} className="cursor-pointer px-3 py-2 hover:bg-panel2" onClick={() => setOpen(open === l._id ? null : l._id)}>
              <div className="flex gap-3">
                <span className="shrink-0 text-muted">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className={`w-12 shrink-0 uppercase ${COLORS[l.level]}`}>{l.level}</span>
                <span className="truncate">{l.message}</span>
              </div>
              {open === l._id && l.meta && (
                <pre className="mt-2 overflow-x-auto rounded bg-bg p-2 text-slate-300">{JSON.stringify(l.meta, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}