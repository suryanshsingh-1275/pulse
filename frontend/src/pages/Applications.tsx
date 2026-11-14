import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import Integration from "../components/Integration";
import { PageHeader } from "../components/ui";
import { api } from "../lib/api";
import { useApps } from "../lib/appContext";
import { ago } from "../lib/format";
import type { Application, Env } from "../lib/types";

export default function Applications() {
  const { apps, current, select } = useApps();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<Env>("development");
  const [created, setCreated] = useState<{ application: Application; apiKey: string } | null>(null);

  const create = useMutation({
    mutationFn: () => api<{ application: Application; apiKey: string }>("/apps", { method: "POST", body: { name, environment } }),
    onSuccess: (d) => {
      setCreated(d);
      setName("");
      select(d.application._id);
      qc.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate(); };

  return (
    <>
      <PageHeader title="Applications" subtitle="Each application gets its own project ID and API key." />

      <form onSubmit={submit} className="card mb-6 grid items-end gap-3 md:grid-cols-[1fr_200px_auto]">
        <div><label className="label">Application name</label><input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="payments-api" /></div>
        <div>
          <label className="label">Environment</label>
          <select className="input" value={environment} onChange={(e) => setEnvironment(e.target.value as Env)}>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
        <button className="btn-primary" disabled={create.isPending}>Create</button>
        {create.error && <div className="text-sm text-bad md:col-span-3">{(create.error as Error).message}</div>}
      </form>

      {created && (
        <div className="mb-6 space-y-3">
          <div className="card border-warn/40">
            <div className="text-sm font-medium text-warn">Copy your API key now. It will not be shown again.</div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-bg px-3 py-2 font-mono text-sm">{created.apiKey}</code>
              <button className="btn" onClick={() => navigator.clipboard.writeText(created.apiKey)}>Copy</button>
            </div>
          </div>
          <Integration apiKey={created.apiKey} />
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((a) => (
          <button
            key={a._id}
            onClick={() => select(a._id)}
            className={`card text-left transition hover:border-accent/60 ${current?._id === a._id ? "border-accent" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{a.name}</span>
              <span className={`text-xs ${a.enabled ? "text-good" : "text-muted"}`}>{a.enabled ? "monitoring" : "paused"}</span>
            </div>
            <div className="mt-1 text-xs text-muted">{a.environment} · key {a.apiKeyPrefix}… · created {ago(a.createdAt)}</div>
            <div className="mt-2 truncate font-mono text-xs text-muted">{a.projectId}</div>
          </button>
        ))}
      </div>
    </>
  );
}