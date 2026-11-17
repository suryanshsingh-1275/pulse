import { Router } from "express";
import { ingestAuth } from "../../middleware/ingestAuth";
import { validate } from "../../middleware/validate";
import { telemetryQueue } from "../../queues/telemetry.queue";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { telemetrySchema } from "./telemetry.schema";

const MAX_QUEUE_DEPTH = 10_000;
const router = Router();

router.post(
  "/",
  ingestAuth,
  validate(telemetrySchema),
  asyncHandler(async (req, res) => {
    const app = res.locals.application;

    // backpressure: tell SDKs to slow down instead of growing the queue unbounded
    if ((await telemetryQueue.count()) > MAX_QUEUE_DEPTH) {
      res.setHeader("Retry-After", "30");
      throw new ApiError(503, "Ingestion overloaded, retry later");
    }

    const { batchId, ...payload } = req.body;
    await telemetryQueue.add(
      "ingest",
      { ...payload, appId: app.id, environment: app.environment },
      // jobId makes retried batches idempotent (duplicate-event handling)
      batchId ? { jobId: `${app.id}-${batchId}` } : undefined
    );
    res.status(202).json({ data: { accepted: true } });
  })
);

export default router;