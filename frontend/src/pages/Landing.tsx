import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-20">
      <div className="mb-4 flex items-center gap-2 text-sm text-accent">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> PULSE
      </div>
      <h1 className="text-4xl font-semibold leading-tight">See what your backend is actually doing.</h1>
      <p className="mt-4 max-w-xl text-muted">
        Drop in one SDK. Get request latency, error tracking, logs and live alerts for every service you run.
      </p>
      <pre className="mt-8 overflow-x-auto rounded-lg border border-line bg-panel p-4 font-mono text-sm text-slate-300">
{`npm install pulse-monitor

const pulse = initPulse({ apiKey: process.env.PULSE_API_KEY! });
app.use(pulse.middleware());`}
      </pre>
      <div className="mt-8 flex gap-3">
        <Link to="/register" className="btn-primary">Get started</Link>
        <Link to="/login" className="btn">Sign in</Link>
      </div>
    </div>
  );
}