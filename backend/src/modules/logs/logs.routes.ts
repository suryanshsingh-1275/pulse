import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppLog } from "../telemetry/appLog.model";

const router = Router({ mergeParams: true });

const query = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).optional(),
  q: z.string().max(100).optional(),
  before: z.string().datetime().optional(), // cursor pagination
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

router.get("/", asyncHandler(async (req, res) => {
  const { level, q, before, limit } = query.parse(req.query);
  const filter: Record<string, unknown> = { appId: new Types.ObjectId(req.params.appId) };
  if (level) filter.level = level;
  if (before) filter.timestamp = { $lt: new Date(before) };
  if (q) filter.$text = { $search: q };

  const logs = await AppLog.find(filter).sort({ timestamp: -1 }).limit(limit);
  res.json({ data: { logs, nextCursor: logs.length === limit ? logs[logs.length - 1].timestamp : null } });
}));

export default router;