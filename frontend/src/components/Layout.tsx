import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { AppProvider, useApps } from "../lib/appContext";
import { useLive } from "../lib/useLive";

const NAV = [
  ["/app", "Overview"],
  ["/app/applications", "Applications"],
  ["/app/api", "API Monitoring"],
  ["/app/errors", "Error Tracking"],
  ["/app/logs", "Logs"],
  ["/app/traces", "Distributed Tracing"],
  ["/app/infrastructure", "Infrastructure"],
  ["/app/database", "Database Monitoring"],
  ["/app/alerts", "Alerts"],
  ["/app/ai", "AI Assistant"],
  ["/app/settings", "Settings"],
] as const;

function Shell() {
  const { user, logout } = useAuth();
  const { apps, current, select } = useApps();
  const navigate = useNavigate();
  const live = useLive(current?._id);

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-panel">
        <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-accent" /> PULSE
        </div>

        <div className="px-3 pb-3">
          <label className="label">Application</label>
          <select
            className="input"
            value={current?._id ?? ""}
            onChange={(e) => select(e.target.value)}
            disabled={!apps.length}
          >
            {!apps.length && <option>No applications</option>}
            {apps.map((a) => (
              <option key={a._id} value={a._id}>{a.name} ({a.environment.slice(0, 4)})</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
          {NAV.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-1.5 text-sm ${isActive ? "bg-accent/15 text-accent" : "text-muted hover:bg-panel2 hover:text-white"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3 text-xs">
          <div className="truncate text-slate-300">{user?.email}</div>
          <button className="mt-1 text-muted hover:text-white" onClick={() => { logout(); navigate("/login"); }}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {live && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-good" />
            Live: +{live.requests} req{live.failed ? `, ${live.failed} failed` : ""} just now
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}