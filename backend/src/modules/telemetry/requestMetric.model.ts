import { Schema, model } from "mongoose";
import { env } from "../../config/env";

const schema = new Schema({
  appId: { type: Schema.Types.ObjectId, required: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  requestId: String,
  timestamp: { type: Date, required: true },
});

// Query pattern: filter by app + time window, group by path
schema.index({ appId: 1, timestamp: -1 });
schema.index({ appId: 1, path: 1, timestamp: -1 });
// Retention
schema.index({ timestamp: 1 }, { expireAfterSeconds: env.TELEMETRY_TTL_DAYS * 86400 });

export const RequestMetric = model("RequestMetric", schema);