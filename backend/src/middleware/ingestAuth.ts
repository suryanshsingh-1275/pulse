import { redis } from "../config/redis";
import { Application } from "../modules/applications/application.model";
import { ApiError } from "../utils/ApiError";
import { hashApiKey } from "../utils/apiKey";
import { asyncHandler } from "../utils/asyncHandler";

const LIMIT_PER_MIN = 600; // ingest calls per key per minute (each call is a batch)

export const ingestAuth = asyncHandler(async (req, res, next) => {
  const key = req.header("x-pulse-key");
  if (!key) throw new ApiError(401, "Missing x-pulse-key header");

  const app = await Application.findOne({ apiKeyHash: hashApiKey(key) });
  if (!app) throw new ApiError(401, "Invalid API key");
  if (!app.enabled) throw new ApiError(403, "Monitoring is disabled for this application");

  const bucket = Math.floor(Date.now() / 60_000);
  const rlKey = `rl:ingest:${app.id}:${bucket}`;
  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, 90);
  if (count > LIMIT_PER_MIN) {
    res.setHeader("Retry-After", "30");
    throw new ApiError(429, "Rate limit exceeded");
  }

  res.locals.application = app;
  next();
});