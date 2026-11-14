export default function Integration({ apiKey }: { apiKey?: string }) {
  const key = apiKey ?? "<YOUR_API_KEY>";
  const code = `// 1. install
npm install pulse-monitor

// 2. initialise (before your routes)
import express from "express";
import { initPulse } from "pulse-monitor";

const pulse = initPulse({
  apiKey: process.env.PULSE_API_KEY!,        // ${key}
  endpoint: process.env.PULSE_ENDPOINT,      // ${window.location.origin.replace("5173", "4000")}
});

const app = express();
app.use(pulse.middleware());

// ...your routes...

app.use(pulse.errorHandler());               // after routes

// optional
pulse.log("info", "server started", { port: 3000 });`;

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">SDK integration</h3>
        <button className="btn" onClick={() => navigator.clipboard.writeText(code)}>Copy</button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-bg p-3 font-mono text-xs leading-relaxed text-slate-300">{code}</pre>
    </div>
  );
}