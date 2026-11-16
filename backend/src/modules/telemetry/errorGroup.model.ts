import { Schema, model } from "mongoose";

const schema = new Schema({
  appId: { type: Schema.Types.ObjectId, required: true },
  fingerprint: { type: String, required: true },
  type: String,
  message: String,
  lastPath: String,
  count: { type: Number, default: 0 },
  firstSeen: Date,
  lastSeen: Date,
  status: { type: String, enum: ["open", "resolved", "ignored"], default: "open" },
});

schema.index({ appId: 1, fingerprint: 1 }, { unique: true });
schema.index({ appId: 1, lastSeen: -1 });

export const ErrorGroup = model("ErrorGroup", schema);