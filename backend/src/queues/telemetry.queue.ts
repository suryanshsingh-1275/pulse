import { Queue } from "bullmq";
import { redis } from "../config/redis";
import type { TelemetryJob } from "../modules/telemetry/telemetry.schema";

export const telemetryQueue = new Queue<TelemetryJob>("telemetry", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});