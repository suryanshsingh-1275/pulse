import { Schema, model } from "mongoose";
import { env } from "../../config/env";

const schema = new Schema({
  appId: { type: Schema.Types.ObjectId, required: true },
  level: { type: String, enum: ["debug", "info", "warn", "error"], required: true },
  message: { type: String, required: true },
  meta: Schema.Types.Mixed,
  timestamp: { type: Date, required: true },
});

schema.index({ appId: 1, timestamp: -1 });
schema.index({ appId: 1, level: 1, timestamp: -1 });
schema.index({ message: "text" });
schema.index({ timestamp: 1 }, { expireAfterSeconds: env.TELEMETRY_TTL_DAYS * 86400 });

export const AppLog = model("ApplicationLog", schema);