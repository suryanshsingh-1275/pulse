import { randomUUID } from "crypto";

export interface PulseConfig {
  apiKey: string;
  endpoint?: string;
  enabled?: boolean;
  flushIntervalMs?: number;
  maxBatchSize?: number;
  maxBufferSize?: number;
  maxRetries?: number;
  captureUncaught?: boolean;
  redactKeys?: string[];
  ignorePaths?: (string | RegExp)[];
  debug?: boolean;
}

type Level = "debug" | "info" | "warn" | "error";
interface ReqEvent { method: string; path: string; statusCode: number; durationMs: number; requestId?: string; timestamp: number }
interface ErrEvent { type: string; message: string; stack?: string; path?: string; method?: string; requestId?: string; timestamp: number }
interface LogEvent { level: Level; message: string; meta?: Record<string, unknown>; timestamp: number }

const DEFAULT_REDACT = /pass(word)?|secret|token|authorization|api[-_]?key|card|cvv|ssn|cookie|credential/i;

