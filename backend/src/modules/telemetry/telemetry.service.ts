import { Types } from "mongoose";
import { redis } from "../../config/redis";
import { getIO } from "../../sockets";
import { errorFingerprint } from "../../utils/fingerprint";
import { AppLog } from "./appLog.model";
import { ErrorEvent } from "./errorEvent.model";
import { ErrorGroup } from "./errorGroup.model";
import { RequestMetric } from "./requestMetric.model";
import type { TelemetryJob } from "./telemetry.schema";

const toDate = (t: number | string | undefined, fallback: number) => (t ? new Date(t) : new Date(fallback));

export async function processTelemetry(job: TelemetryJob) {
  const appId = new Types.ObjectId(job.appId);
  const now = Date.now();

  const requests = job.requests.map((r) => ({ ...r, appId, timestamp: toDate(r.timestamp, now) }));
  const logs = job.logs.map((l) => ({ ...l, appId, timestamp: toDate(l.timestamp, now) }));
  const errors = job.errors.map((e) => ({
    ...e,
    appId,
    environment: job.environment,
    fingerprint: errorFingerprint(e.type, e.stack),
    timestamp: toDate(e.timestamp, now),
  }));

  await Promise.all([
    requests.length ? RequestMetric.insertMany(requests, { ordered: false }) : null,
    logs.length ? AppLog.insertMany(logs, { ordered: false }) : null,
    errors.length ? ErrorEvent.insertMany(errors, { ordered: false }) : null,
  ]);

  if (errors.length) {
    await ErrorGroup.bulkWrite(
      errors.map((e) => ({
        updateOne: {
          filter: { appId, fingerprint: e.fingerprint },
          update: {
            $inc: { count: 1 },
            $set: { lastSeen: e.timestamp, lastPath: e.path, message: e.message, type: e.type },
            $setOnInsert: { firstSeen: e.timestamp, status: "open" },
          },
          upsert: true,
        },
      }))
    );
    // a resolved error that happens again is a regression -> reopen it
    await ErrorGroup.updateMany(
      { appId, fingerprint: { $in: errors.map((e) => e.fingerprint) }, status: "resolved" },
      { $set: { status: "open" } }
    );
  }

  // ---- Redis live counters (per-minute buckets, 1h TTL) ----
  const failed = requests.filter((r) => r.statusCode >= 500).length;
  const latencySum = requests.reduce((s, r) => s + r.durationMs, 0);
  const key = `live:${job.appId}:${Math.floor(now / 60_000)}`;
  await redis
    .multi()
    .hincrby(key, "requests", requests.length)
    .hincrby(key, "errors", failed)
    .hincrby(key, "latencySum", Math.round(latencySum))
    .expire(key, 3600)
    .exec();

  getIO()
    ?.to(`app:${job.appId}`)
    .emit("telemetry", {
      requests: requests.length,
      failed,
      errorEvents: errors.length,
      avgLatency: requests.length ? latencySum / requests.length : 0,
      at: now,
    });
}

/** Last N minutes of live counters from Redis. */
export async function liveStats(appId: string, minutes = 5) {
  const nowBucket = Math.floor(Date.now() / 60_000);
  const pipeline = redis.pipeline();
  for (let i = 0; i < minutes; i++) pipeline.hgetall(`live:${appId}:${nowBucket - i}`);
  const results = (await pipeline.exec()) ?? [];
  return results
    .map(([, v], i) => {
      const h = (v ?? {}) as Record<string, string>;
      return {
        minute: new Date((nowBucket - i) * 60_000).toISOString(),
        requests: Number(h.requests ?? 0),
        errors: Number(h.errors ?? 0),
        latencySum: Number(h.latencySum ?? 0),
      };
    })
    .reverse();
}