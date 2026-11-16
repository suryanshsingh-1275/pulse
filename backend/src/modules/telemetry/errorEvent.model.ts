import { Schema, model } from "mongoose";
import { env } from "../../config/env";

const schema = new Schema({
  appId: { type: Schema.Types.ObjectId, required: true },
  fingerprint: { type: String, required: true },
  type: String,
  message: String,
  stack: String,
  path: String,
  method: String,
  environment: String,
  requestId: String,
  timestamp: { type: Date, required: true },
});

schema.index({ appId: 1, fingerprint: 1, timestamp: -1 });
schema.index({ timestamp: 1 }, { expireAfterSeconds: env.TELEMETRY_TTL_DAYS * 86400 });

export const ErrorEvent = model("ErrorEvent", schema);