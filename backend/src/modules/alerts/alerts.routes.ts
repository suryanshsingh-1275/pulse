import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { AlertEvent, AlertRule } from "./alert.model";

const router = Router({ mergeParams: true });

const ruleSchema = z.object({
  name: z.string().min(2).max(80),
  metric: z.enum(["errorRate", "avgLatency", "p95Latency"]),
  threshold: z.number().positive(),
  windowMinutes: z.number().int().min(1).max(1440).default(5),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
});

router.get("/rules", asyncHandler(async (req, res) => {
  res.json({ data: await AlertRule.find({ appId: req.params.appId }).sort({ createdAt: -1 }) });
}));

router.post("/rules", asyncHandler(async (req, res) => {
  const body = ruleSchema.parse(req.body);
  res.status(201).json({ data: await AlertRule.create({ ...body, appId: req.params.appId }) });
}));

router.patch("/rules/:ruleId", asyncHandler(async (req, res) => {
  const body = ruleSchema.partial().extend({ enabled: z.boolean().optional() }).parse(req.body);
  const rule = await AlertRule.findOneAndUpdate({ _id: req.params.ruleId, appId: req.params.appId }, body, { new: true });
  if (!rule) throw new ApiError(404, "Rule not found");
  res.json({ data: rule });
}));

router.delete("/rules/:ruleId", asyncHandler(async (req, res) => {
  await AlertRule.deleteOne({ _id: req.params.ruleId, appId: req.params.appId });
  res.status(204).end();
}));

router.get("/history", asyncHandler(async (req, res) => {
  res.json({ data: await AlertEvent.find({ appId: req.params.appId }).sort({ createdAt: -1 }).limit(50) });
}));

export default router;