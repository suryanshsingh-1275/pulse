import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ErrorEvent } from "../telemetry/errorEvent.model";
import { ErrorGroup } from "../telemetry/errorGroup.model";

const router = Router({ mergeParams: true });

const listQuery = z.object({
  status: z.enum(["open", "resolved", "ignored"]).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

router.get("/", asyncHandler(async (req, res) => {
  const { status, q, limit } = listQuery.parse(req.query);
  const filter: Record<string, unknown> = { appId: new Types.ObjectId(req.params.appId) };
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); // escaped: no regex injection
    filter.$or = [{ type: rx }, { message: rx }, { lastPath: rx }];
  }
  res.json({ data: await ErrorGroup.find(filter).sort({ lastSeen: -1 }).limit(limit) });
}));

router.get("/:fingerprint", asyncHandler(async (req, res) => {
  const appId = new Types.ObjectId(req.params.appId);
  const group = await ErrorGroup.findOne({ appId, fingerprint: req.params.fingerprint });
  if (!group) throw new ApiError(404, "Error group not found");

  const [recent, frequency] = await Promise.all([
    ErrorEvent.find({ appId, fingerprint: group.fingerprint }).sort({ timestamp: -1 }).limit(20),
    ErrorEvent.aggregate([
      { $match: { appId, fingerprint: group.fingerprint, timestamp: { $gte: new Date(Date.now() - 24 * 3_600_000) } } },
      { $group: { _id: { $dateTrunc: { date: "$timestamp", unit: "hour" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  res.json({ data: { group, recent, frequency: frequency.map((f) => ({ t: f._id, count: f.count })) } });
}));

router.patch("/:fingerprint", asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(["open", "resolved", "ignored"]) }).parse(req.body);
  const group = await ErrorGroup.findOneAndUpdate(
    { appId: req.params.appId, fingerprint: req.params.fingerprint },
    { status },
    { new: true }
  );
  if (!group) throw new ApiError(404, "Error group not found");
  res.json({ data: group });
}));

export default router;