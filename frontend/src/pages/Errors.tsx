import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTheme, Empty, ErrorBox, NoApp, PageHeader } from "../components/ui";
import { api } from "../lib/api";
import { useApps } from "../lib/appContext";
import { ago, num, timeLabel } from "../lib/format";
import type { ErrorDetail, ErrorGroup } from "../lib/types";

export default function Errors() {
  const { current } = useApps();
  const id = current?._id;
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["app", id, "errors", status, q],
    queryFn: () => api<ErrorGroup[]>(`/apps/${id}/errors?${new URLSearchParams({ ...(status && { status }), ...(q && { q }) })}`),
    enabled: !!id,
  });

  const detail = useQuery({
    queryKey: ["app", id, "errors", "detail", selected],
    queryFn: () => api<ErrorDetail>(`/apps/${id}/errors/${selected}`),
    enabled: !!id && !!selected,
  });

  const setGroupStatus = useMutation({
    mutationFn: (s: string) => api(`/apps/${id}/errors/${selected}`, { method: "PATCH", body: { status: s } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app", id, "errors"] }),
  });

  if (!current) return <NoApp />;
  if (list.error) return <ErrorBox error={list.error} />;

  const badge = (s: string) => (s === "open" ? "text-bad" : s === "resolved" ? "text-good" : "text-muted");

  return (
    <>
      <PageHeader title="Error Tracking" subtitle="Exceptions grouped by type and stack location" />
      <div className="mb-3 flex gap-2">
        <input className="input max-w-sm" placeholder="Search type, message, path…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          {!list.data?.length && <Empty>No errors captured. That's either great or the SDK isn't connected yet.</Empty>}
          {list.data?.map((g) => (
            <button
              key={g._id}
              onClick={() => setSelected(g.fingerprint)}
              className={`card block w-full text-left hover:border-accent/60 ${selected === g.fingerprint ? "border-accent" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-medium">{g.type}</span>
                <span className={`text-xs ${badge(g.status)}`}>{g.status}</span>
              </div>
              <div className="mt-1 truncate text-sm text-slate-300">{g.message}</div>
              <div className="mt-1 text-xs text-muted">
                {num(g.count)} events · {g.lastPath ?? "—"} · last seen {ago(g.lastSeen)}
              </div>
            </button>
          ))}
        </div>

        <div>
          {!selected && <Empty>Select an error to inspect it.</Empty>}
          {selected && detail.data && (
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono font-medium">{detail.data.group.type}</div>
                  <div className="text-sm text-slate-300">{detail.data.group.message}</div>
                  <div className="mt-1 text-xs text-muted">
                    First seen {timeLabel(detail.data.group.firstSeen, true)} · last seen {timeLabel(detail.data.group.lastSeen, true)} · {num(detail.data.group.count)} total
                  </div>
                </div>
                <select className="input w-32" value={detail.data.group.status} onChange={(e) => setGroupStatus.mutate(e.target.value)}>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="ignored">Ignored</option>
                </select>
              </div>

              <div>
                <div className="label">Occurrences, last 24h</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={detail.data.frequency.map((f) => ({ ...f, label: timeLabel(f.t) }))}>
                    <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={10} />
                    <YAxis stroke={chartTheme.axis} fontSize={10} width={30} allowDecimals={false} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Bar dataKey="count" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <div className="label">Latest stack trace</div>
                <pre className="max-h-64 overflow-auto rounded-md bg-bg p-3 font-mono text-xs text-slate-300">
                  {detail.data.recent[0]?.stack ?? "No stack trace"}
                </pre>
              </div>

              <div>
                <div className="label">Recent occurrences</div>
                <ul className="space-y-1 text-xs text-muted">
                  {detail.data.recent.slice(0, 8).map((e) => (
                    <li key={e._id} className="font-mono">
                      {timeLabel(e.timestamp, true)} · {e.method} {e.path} · {e.environment} · req {e.requestId?.slice(0, 8) ?? "—"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}