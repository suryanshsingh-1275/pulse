import { Schema, model } from "mongoose";

const ruleSchema = new Schema(
  {
    appId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    metric: { type: String, enum: ["errorRate", "avgLatency", "p95Latency"], required: true },
    threshold: { type: Number, required: true },
    windowMinutes: { type: Number, default: 5, min: 1, max: 1440 },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "warning" },
    enabled: { type: Boolean, default: true },
    state: { type: String, enum: ["ok", "firing"], default: "ok" },
  },
  { timestamps: true }
);

const eventSchema = new Schema(
  {
    appId: { type: Schema.Types.ObjectId, required: true },
    ruleId: { type: Schema.Types.ObjectId, required: true },
    ruleName: String,
    severity: String,
    state: { type: String, enum: ["firing", "resolved"], required: true },
    value: Number,
    message: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
eventSchema.index({ appId: 1, createdAt: -1 });

export const AlertRule = model("AlertRule", ruleSchema);
export const AlertEvent = model("AlertEvent", eventSchema);