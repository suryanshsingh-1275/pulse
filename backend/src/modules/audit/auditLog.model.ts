import { Schema, model, Types } from "mongoose";

const auditSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model("AuditLog", auditSchema);

export const audit = (userId: string | Types.ObjectId, action: string, meta?: unknown) =>
  AuditLog.create({ userId, action, meta }).catch((e) => console.error("[audit]", e.message));