import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { liveStats } from "../telemetry/telemetry.service";
import * as metrics from "./metrics.service";

const range = z.enum(["15m", "1h", "6h", "24h", "7d"]).default("1h");
const parseRange = (q: unknown) => range.parse((q as any)?.range);

const router = Router({ mergeParams: true });

router.get("/overview", asyncHandler(async (req, res) => {
  res.json({ data: await metrics.overview(req.params.appId, parseRange(req.query)) });
}));

router.get("/timeseries", asyncHandler(async (req, res) => {
  res.json({ data: await metrics.timeseries(req.params.appId, parseRange(req.query)) });
}));

router.get("/endpoints", asyncHandler(async (req, res) => {
  res.json({ data: await metrics.endpoints(req.params.appId, parseRange(req.query)) });
}));

router.get("/live", asyncHandler(async (req, res) => {
  res.json({ data: await liveStats(req.params.appId, 5) });
}));

export default router;