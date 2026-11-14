import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/app/applications");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-lg font-semibold">Create your PULSE account</h1>
        {error && <div className="text-sm text-bad">{error}</div>}
        <div><label className="label">Name</label><input className="input" required value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={set("email")} /></div>
        <div><label className="label">Password (min 8)</label><input className="input" type="password" minLength={8} required value={form.password} onChange={set("password")} /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="text-center text-xs text-muted">Have an account? <Link className="text-accent" to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}