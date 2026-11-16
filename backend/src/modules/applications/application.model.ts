import { randomUUID } from "crypto";
import { Schema, model } from "mongoose";

const applicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      default: "development",
    },
    projectId: { type: String, unique: true, default: () => randomUUID() },
    apiKeyHash: { type: String, required: true, unique: true },
    apiKeyPrefix: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, name: 1 }, { unique: true });

applicationSchema.set("toJSON", {
  transform: (_d, ret: any) => {
    delete ret.apiKeyHash;
    delete ret.__v;
    return ret;
  },
});

export const Application = model("Application", applicationSchema);