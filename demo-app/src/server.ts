import express from "express";
import { initPulse } from "pulse-monitor";

const pulse = initPulse({
  apiKey: process.env.PULSE_API_KEY!,
  endpoint: process.env.PULSE_ENDPOINT,
  flushIntervalMs: 2000,
  captureUncaught: false,
  ignorePaths: ["/health"],
  debug: true,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const app = express();
app.use(express.json());
app.use(pulse.middleware());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/ok", (_req, res) => res.json({ status: "fine" }));

app.get("/api/users/:id", async (req, res) => {
  await sleep(20 + Math.random() * 80);
  res.json({ id: req.params.id, name: "Demo User" });
});

app.get("/api/slow", async (_req, res) => {
  await sleep(800 + Math.random() * 1700);
  pulse.log("warn", "slow endpoint hit", { took: "high" });
  res.json({ status: "slow but ok" });
});

app.get("/api/db-delay", async (_req, res) => {
  const t = 300 + Math.random() * 600;
  await sleep(t);
  pulse.log("info", "simulated db query", { query: "find orders", durationMs: Math.round(t) });
  res.json({ rows: 42 });
});

app.get("/api/boom", () => {
  throw new Error("Payment gateway timeout");
});

app.get("/api/boom-type", () => {
  throw new TypeError("Cannot read properties of undefined (reading 'total')");
});

app.post("/api/login", (req, res) => {
  // password is redacted by the SDK before leaving this process
  pulse.log("info", "login attempt", { email: req.body?.email, password: req.body?.password });
  res.json({ ok: true });
});

// 404s for unknown routes are recorded as "(unmatched)"
app.use(pulse.errorHandler());
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => console.log(`demo-app on http://localhost:${port}`));