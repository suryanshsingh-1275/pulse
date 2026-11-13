export type Range = "15m" | "1h" | "6h" | "24h" | "7d";
export type Env = "development" | "staging" | "production";

export interface User { _id: string; name: string; email: string }

export interface Application {
  _id: string;
  name: string;
  environment: Env;
  projectId: string;
  apiKeyPrefix: string;
  enabled: boolean;
  createdAt: string;
}

export interface Overview {
  total: number; rpm: number; avgLatency: number;
  p50: number; p95: number; p99: number; errorRate: number;
  health: "healthy" | "degraded" | "critical" | "no-data";
}

export interface SeriesPoint { t: string; requests: number; avg: number; p95: number; errors: number }

export interface EndpointStat {
  method: string; path: string; requests: number; avg: number;
  p50: number; p95: number; p99: number; success: number; failed: number; errorRate: number;
  s2xx: number; s3xx: number; s4xx: number; s5xx: number;
}

export interface ErrorGroup {
  _id: string; fingerprint: string; type: string; message: string; lastPath?: string;
  count: number; firstSeen: string; lastSeen: string; status: "open" | "resolved" | "ignored";
}

export interface ErrorDetail {
  group: ErrorGroup;
  recent: { _id: string; stack?: string; path?: string; method?: string; requestId?: string; environment?: string; timestamp: string }[];
  frequency: { t: string; count: number }[];
}

export interface LogEntry {
  _id: string; level: "debug" | "info" | "warn" | "error"; message: string;
  meta?: Record<string, unknown>; timestamp: string;
}

export interface AlertRule {
  _id: string; name: string; metric: "errorRate" | "avgLatency" | "p95Latency";
  threshold: number; windowMinutes: number; severity: "info" | "warning" | "critical";
  enabled: boolean; state: "ok" | "firing";
}

export interface AlertEvent {
  _id: string; ruleName: string; severity: string; state: "firing" | "resolved";
  value: number; message: string; createdAt: string;
}

export interface LiveEvent { requests: number; failed: number; errorEvents: number; avgLatency: number; at: number }