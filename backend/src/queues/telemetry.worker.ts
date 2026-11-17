import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { processTelemetry } from "../modules/telemetry/telemetry.service";
import type { TelemetryJob } from "../modules/telemetry/telemetry.schema";

export function startTelemetryWorker() {
  const worker = new Worker<TelemetryJob>("telemetry", (job) => processTelemetry(job.data), {
    connection: redis,
    concurrency: 5,
  });
  worker.on("failed", (job, err) => console.error(`[worker] job ${job?.id} failed:`, err.message));
  console.log("[worker] telemetry worker started");
  return worker;
}