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

