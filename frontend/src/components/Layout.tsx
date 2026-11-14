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

