import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Alerts from "./pages/Alerts";
import ApiMonitoring from "./pages/ApiMonitoring";
import Applications from "./pages/Applications";
import ComingSoon from "./pages/ComingSoon";
import Errors from "./pages/Errors";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Logs from "./pages/Logs";
import Overview from "./pages/Overview";
import Register from "./pages/Register";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="applications" element={<Applications />} />
        <Route path="api" element={<ApiMonitoring />} />
        <Route path="errors" element={<Errors />} />
        <Route path="logs" element={<Logs />} />
        <Route path="traces" element={<ComingSoon title="Distributed Tracing" phase="Phase 6" />} />
        <Route path="infrastructure" element={<ComingSoon title="Infrastructure" phase="Phase 6" />} />
        <Route path="database" element={<ComingSoon title="Database Monitoring" phase="Phase 6" />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="ai" element={<ComingSoon title="AI Assistant" phase="Phase 7" />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}