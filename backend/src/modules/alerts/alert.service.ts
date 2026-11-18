import { redis } from "../../config/redis";
import { getIO } from "../../sockets";
import { windowStats } from "../metrics/metrics.service";
import { AlertEvent, AlertRule } from "./alert.model";

const MIN_SAMPLES = 5; // don't alert on tiny samples

export async function evaluateAlerts() {
  // Redis lock => safe if multiple backend processes run this loop
  if (!(await redis.set("lock:alerts", "1", "EX", 25, "NX"))) return;

  const rules = await AlertRule.find({ enabled: true });
  for (const rule of rules) {
    const s = await windowStats(rule.appId, rule.windowMinutes);
    if (s.total < MIN_SAMPLES) continue;

    const value = rule.metric === "errorRate" ? s.errorRate : rule.metric === "avgLatency" ? s.avg : s.p95;
    const breached = value > rule.threshold;
    const unit = rule.metric === "errorRate" ? "%" : "ms";

    let state: "firing" | "resolved" | null = null;
    if (breached && rule.state === "ok") state = "firing";
    if (!breached && rule.state === "firing") state = "resolved";
    if (!state) continue;

    rule.state = state === "firing" ? "firing" : "ok";
    await rule.save();

    const event = await AlertEvent.create({
      appId: rule.appId,
      ruleId: rule._id,
      ruleName: rule.name,
      severity: rule.severity,
      state,
      value,
      message: `${rule.name}: ${rule.metric} is ${value.toFixed(2)}${unit} (threshold ${rule.threshold}${unit}, last ${rule.windowMinutes}m)`,
    });
    getIO()?.to(`app:${rule.appId}`).emit("alert", event);
  }
}

export function startAlertEvaluator() {
  setInterval(() => evaluateAlerts().catch((e) => console.error("[alerts]", e.message)), 30_000).unref();
  console.log("[alerts] evaluator started (every 30s)");
}