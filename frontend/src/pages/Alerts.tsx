import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Empty, NoApp, PageHeader } from "../components/ui";
import { api } from "../lib/api";
import { useApps } from "../lib/appContext";
import { ago } from "../lib/format";
import type { AlertEvent, AlertRule } from "../lib/types";

const METRIC_LABEL = { errorRate: "Error rate (%)", avgLatency: "Avg latency (ms)", p95Latency: "P95 latency (ms)" };

export default function Alerts() {
  const { current } = useApps();
  const id = current?._id;
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["app", id, "alerts"] });

  const [form, setForm] = useState({ name: "", metric: "errorRate", threshold: 5, windowMinutes: 5, severity: "warning" });

  const rules = useQuery({ queryKey: ["app", id, "alerts", "rules"], queryFn: () => api<AlertRule[]>(`/apps/${id}/alerts/rules`), enabled: !!id });
  const history = useQuery({ queryKey: ["app", id, "alerts", "history"], queryFn: () => api<AlertEvent[]>(`/apps/${id}/alerts/history`), enabled: !!id });

  const create = useMutation({
    mutationFn: () => api(`/apps/${id}/alerts/rules`, { method: "POST", body: form }),
    onSuccess: () => { refresh(); setForm({ ...form, name: "" }); },
  });
  const toggle = useMutation({
    mutationFn: (r: AlertRule) => api(`/apps/${id}/alerts/rules/${r._id}`, { method: "PATCH", body: { enabled: !r.enabled } }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (r: AlertRule) => api(`/apps/${id}/alerts/rules/${r._id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  if (!current) return <NoApp />;
  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate(); };

  return (
    <>
      <PageHeader title="Alerts" subtitle="Rules are evaluated every 30 seconds (needs at least 5 requests in the window)" />

      <form onSubmit={submit} className="card mb-6 grid items-end gap-3 md:grid-cols-6">
        <div className="md:col-span-2"><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="High error rate" /></div>
        <div>
          <label className="label">Metric</label>
          <select className="input" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
            {Object.entries(METRIC_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="label">Threshold &gt;</label><input className="input" type="number" min={0.01} step="any" required value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} /></div>
        <div><label className="label">Window (min)</label><input className="input" type="number" min={1} max={1440} value={form.windowMinutes} onChange={(e) => setForm({ ...form, windowMinutes: Number(e.target.value) })} /></div>
        <div>
          <label className="label">Severity</label>
          <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
          </select>
        </div>
        <button className="btn-primary md:col-span-6 md:w-32" disabled={create.isPending}>Add rule</button>
        {create.error && <div className="text-sm text-bad md:col-span-6">{(create.error as Error).message}</div>}
      </form>

      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium">Rules</h3>
          {!rules.data?.length && <Empty>No rules yet.</Empty>}
          <div className="space-y-2">
            {rules.data?.map((r) => (
              <div key={r._id} className="card flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {r.name}
                    <span className={`rounded px-1.5 py-0.5 text-xs ${r.state === "firing" ? "bg-bad/20 text-bad" : "bg-good/15 text-good"}`}>{r.state}</span>
                  </div>
                  <div className="text-xs text-muted">{METRIC_LABEL[r.metric]} &gt; {r.threshold} over {r.windowMinutes}m · {r.severity}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={() => toggle.mutate(r)}>{r.enabled ? "Disable" : "Enable"}</button>
                  <button className="btn-danger" onClick={() => remove.mutate(r)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium">History</h3>
          {!history.data?.length && <Empty>Nothing has fired yet.</Empty>}
          <ul className="space-y-2">
            {history.data?.map((e) => (
              <li key={e._id} className="card flex items-start gap-2 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.state === "firing" ? "bg-bad" : "bg-good"}`} />
                <div>
                  <div>{e.message}</div>
                  <div className="text-xs text-muted">{e.state} · {e.severity} · {ago(e.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}