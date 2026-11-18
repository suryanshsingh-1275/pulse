import { Types } from "mongoose";
import { RequestMetric } from "../telemetry/requestMetric.model";

export const RANGES = {
  "15m": { ms: 15 * 60_000, unit: "minute", bin: 1 },
  "1h": { ms: 60 * 60_000, unit: "minute", bin: 5 },
  "6h": { ms: 6 * 3_600_000, unit: "minute", bin: 30 },
  "24h": { ms: 24 * 3_600_000, unit: "hour", bin: 1 },
  "7d": { ms: 7 * 24 * 3_600_000, unit: "hour", bin: 6 },
} as const;
export type RangeKey = keyof typeof RANGES;

const isFailed = { $cond: [{ $gte: ["$statusCode", 500] }, 1, 0] };
const statusClass = (lo: number) => ({
  $sum: { $cond: [{ $and: [{ $gte: ["$statusCode", lo] }, { $lt: ["$statusCode", lo + 100] }] }, 1, 0] },
});
// $percentile requires MongoDB 7+ (docker image mongo:7)
const percentiles = { $percentile: { input: "$durationMs", p: [0.5, 0.95, 0.99], method: "approximate" } };

const since = (ms: number) => new Date(Date.now() - ms);
const round = (n: number | null | undefined) => (n == null ? 0 : Math.round(n * 100) / 100);

export async function windowStats(appId: string | Types.ObjectId, minutes: number) {
  const [r] = await RequestMetric.aggregate<any>([
    { $match: { appId: new Types.ObjectId(String(appId)), timestamp: { $gte: since(minutes * 60_000) } } },
    { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: "$durationMs" }, failed: { $sum: isFailed }, p: percentiles } },
  ] as any[]);
  if (!r) return { total: 0, errorRate: 0, avg: 0, p95: 0 };
  return { total: r.total, errorRate: (r.failed / r.total) * 100, avg: r.avg, p95: r.p[1] };
}

export async function overview(appId: string, range: RangeKey) {
  const { ms } = RANGES[range];
  const [r] = await RequestMetric.aggregate<any>([
    { $match: { appId: new Types.ObjectId(appId), timestamp: { $gte: since(ms) } } },
    { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: "$durationMs" }, failed: { $sum: isFailed }, p: percentiles } },
  ] as any[]);

  if (!r) {
    return { total: 0, rpm: 0, avgLatency: 0, p50: 0, p95: 0, p99: 0, errorRate: 0, health: "no-data" as const };
  }
  const errorRate = (r.failed / r.total) * 100;
  return {
    total: r.total,
    rpm: round(r.total / (ms / 60_000)),
    avgLatency: round(r.avg),
    p50: round(r.p[0]),
    p95: round(r.p[1]),
    p99: round(r.p[2]),
    errorRate: round(errorRate),
    health: errorRate < 1 ? ("healthy" as const) : errorRate < 5 ? ("degraded" as const) : ("critical" as const),
  };
}

export async function timeseries(appId: string, range: RangeKey) {
  const { ms, unit, bin } = RANGES[range];
  const rows = await RequestMetric.aggregate<any>([
    { $match: { appId: new Types.ObjectId(appId), timestamp: { $gte: since(ms) } } },
    {
      $group: {
        _id: { $dateTrunc: { date: "$timestamp", unit, binSize: bin } },
        requests: { $sum: 1 },
        avg: { $avg: "$durationMs" },
        errors: { $sum: isFailed },
        p: percentiles,
      },
    },
    { $sort: { _id: 1 } },
  ] as any[]);
  return rows.map((r) => ({
    t: r._id.toISOString(),
    requests: r.requests,
    avg: round(r.avg),
    p95: round(r.p[1]),
    errors: r.errors,
  }));
}

export async function endpoints(appId: string, range: RangeKey) {
  const rows = await RequestMetric.aggregate<any>([
    { $match: { appId: new Types.ObjectId(appId), timestamp: { $gte: since(RANGES[range].ms) } } },
    {
      $group: {
        _id: { method: "$method", path: "$path" },
        requests: { $sum: 1 },
        avg: { $avg: "$durationMs" },
        failed: { $sum: isFailed },
        s2xx: statusClass(200),
        s3xx: statusClass(300),
        s4xx: statusClass(400),
        s5xx: statusClass(500),
        p: percentiles,
      },
    },
  ] as any[]);
  return rows.map((r) => ({
    method: r._id.method,
    path: r._id.path,
    requests: r.requests,
    avg: round(r.avg),
    p50: round(r.p[0]),
    p95: round(r.p[1]),
    p99: round(r.p[2]),
    failed: r.failed, // failed = 5xx
    success: r.requests - r.failed,
    errorRate: round((r.failed / r.requests) * 100),
    s2xx: r.s2xx,
    s3xx: r.s3xx,
    s4xx: r.s4xx,
    s5xx: r.s5xx,
  }));
}