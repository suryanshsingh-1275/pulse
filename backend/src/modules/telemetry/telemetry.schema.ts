import { z } from "zod";

const ts = z.union([z.number(), z.string()]).optional();

export const telemetrySchema = z.object({
  batchId: z.string().max(100).optional(),
  requests: z
    .array(
      z.object({
        method: z.string().max(10),
        path: z.string().max(500),
        statusCode: z.number().int().min(100).max(599),
        durationMs: z.number().min(0),
        requestId: z.string().max(100).optional(),
        timestamp: ts,
      })
    )
    .max(500)
    .default([]),
  errors: z
    .array(
      z.object({
        type: z.string().max(200),
        message: z.string().max(2000),
        stack: z.string().max(10_000).optional(),
        path: z.string().max(500).optional(),
        method: z.string().max(10).optional(),
        requestId: z.string().max(100).optional(),
        timestamp: ts,
      })
    )
    .max(100)
    .default([]),
  logs: z
    .array(
      z.object({
        level: z.enum(["debug", "info", "warn", "error"]),
        message: z.string().max(2000),
        meta: z.record(z.string(), z.unknown()).optional(),
        timestamp: ts,
      })
    )
    .max(500)
    .default([]),
});

export type TelemetryPayload = z.infer<typeof telemetrySchema>;
export type TelemetryJob = TelemetryPayload & { appId: string; environment: string };