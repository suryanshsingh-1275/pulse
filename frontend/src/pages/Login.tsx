import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/app");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-lg font-semibold">Sign in to PULSE</h1>
        {error && <div className="text-sm text-bad">{error}</div>}
        <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Password</label><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="text-center text-xs text-muted">No account? <Link className="text-accent" to="/register">Register</Link></p>
      </form>
    </div>
  );
}