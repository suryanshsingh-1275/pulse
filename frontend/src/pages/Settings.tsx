import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Integration from "../components/Integration";
import { NoApp, PageHeader } from "../components/ui";
import { api } from "../lib/api";
import { useApps } from "../lib/appContext";
import { useAuth } from "../lib/auth";
import type { Application } from "../lib/types";

export default function Settings() {
  const { current } = useApps();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["apps"] });

  const update = useMutation({
    mutationFn: (body: Partial<Application>) => api(`/apps/${current!._id}`, { method: "PATCH", body }),
    onSuccess: refresh,
  });
  const rotate = useMutation({
    mutationFn: () => api<{ apiKey: string }>(`/apps/${current!._id}/rotate-key`, { method: "POST" }),
    onSuccess: (d) => { setNewKey(d.apiKey); refresh(); },
  });
  const remove = useMutation({
    mutationFn: () => api(`/apps/${current!._id}`, { method: "DELETE" }),
    onSuccess: () => { localStorage.removeItem("pulse_app"); refresh(); navigate("/app/applications"); },
  });

  return (
    <>
      <PageHeader title="Settings" />
      <div className="card mb-4 max-w-xl">
        <div className="label">Account</div>
        <div className="text-sm">{user?.name} · {user?.email}</div>
      </div>

      {!current ? <NoApp /> : (
        <div className="max-w-2xl space-y-4">
          <div className="card space-y-3">
            <h3 className="text-sm font-medium">{current.name}</h3>
            <div className="flex gap-2">
              <input className="input" placeholder="Rename application" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn" disabled={name.length < 2} onClick={() => { update.mutate({ name }); setName(""); }}>Rename</button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={current.enabled} onChange={(e) => update.mutate({ enabled: e.target.checked })} />
              Monitoring enabled (disabled apps reject telemetry)
            </label>
            <div className="text-xs text-muted">Project ID: <span className="font-mono">{current.projectId}</span> · Key prefix: <span className="font-mono">{current.apiKeyPrefix}…</span></div>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-medium">API key</h3>
            <p className="text-xs text-muted">Rotating invalidates the current key immediately.</p>
            <button className="btn" onClick={() => confirm("Rotate key? The old key stops working immediately.") && rotate.mutate()}>Rotate API key</button>
            {newKey && (
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-bg px-3 py-2 font-mono text-sm">{newKey}</code>
                <button className="btn" onClick={() => navigator.clipboard.writeText(newKey)}>Copy</button>
              </div>
            )}
          </div>

          <Integration apiKey={newKey ?? undefined} />

          <div className="card border-bad/30">
            <h3 className="mb-2 text-sm font-medium text-bad">Danger zone</h3>
            <button className="btn-danger" onClick={() => confirm(`Delete ${current.name} and ALL its telemetry?`) && remove.mutate()}>Delete application</button>
          </div>
        </div>
      )}
    </>
  );
}