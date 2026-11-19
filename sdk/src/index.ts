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

export class PulseClient {
  private cfg: Required<Omit<PulseConfig, "redactKeys" | "ignorePaths">> & Pick<PulseConfig, "redactKeys" | "ignorePaths">;
  private requests: ReqEvent[] = [];
  private errors: ErrEvent[] = [];
  private logs: LogEvent[] = [];
  private timer?: NodeJS.Timeout;
  private flushing = false;
  private redactRx: RegExp;

  constructor(config: PulseConfig) {
    if (!config.apiKey) throw new Error("[pulse] apiKey is required");
    this.cfg = {
      endpoint: "http://localhost:4000",
      enabled: true,
      flushIntervalMs: 5000,
      maxBatchSize: 100,
      maxBufferSize: 5000,
      maxRetries: 3,
      captureUncaught: false,
      debug: false,
      ...config,
    };
    this.redactRx = this.cfg.redactKeys?.length
      ? new RegExp(`${DEFAULT_REDACT.source}|${this.cfg.redactKeys.map(escapeRx).join("|")}`, "i")
      : DEFAULT_REDACT;

    if (!this.cfg.enabled) return;

    this.timer = setInterval(() => void this.flush(), this.cfg.flushIntervalMs);
    this.timer.unref(); // never keep the host process alive

    if (this.cfg.captureUncaught) {
      process.on("uncaughtException", (err) => {
        this.captureException(err);
        void this.shutdown().finally(() => process.exit(1));
      });
      process.on("unhandledRejection", (reason) => {
        this.captureException(reason instanceof Error ? reason : new Error(String(reason)));
      });
    }
    process.once("beforeExit", () => void this.shutdown());
    for (const sig of ["SIGTERM", "SIGINT"] as const) {
      process.once(sig, () => void this.shutdown().finally(() => process.kill(process.pid, sig)));
    }
  }

  // ---------- public API ----------

  /** Express/Connect compatible request monitoring middleware. */
  middleware() {
    return (req: any, res: any, next: (e?: unknown) => void) => {
      if (!this.cfg.enabled || this.ignored(req.path ?? req.url)) return next();
      const start = process.hrtime.bigint();
      req.pulseRequestId = req.headers?.["x-request-id"] ?? randomUUID();

      res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        // use the route pattern (/users/:id) to avoid high-cardinality paths
        const path = req.route?.path
          ? `${req.baseUrl ?? ""}${req.route.path}`
          : res.statusCode === 404
            ? "(unmatched)"
            : req.path;
        this.push(this.requests, {
          method: req.method,
          path,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          requestId: req.pulseRequestId,
          timestamp: Date.now(),
        });
      });
      next();
    };
  }

  /** Register AFTER your routes, BEFORE your own error handler. */
  errorHandler() {
    return (err: any, req: any, _res: any, next: (e?: unknown) => void) => {
      this.captureException(err, { path: req.route?.path ? `${req.baseUrl ?? ""}${req.route.path}` : req.path, method: req.method, requestId: req.pulseRequestId });
      next(err);
    };
  }

  captureException(err: unknown, ctx: { path?: string; method?: string; requestId?: string } = {}) {
    if (!this.cfg.enabled) return;
    const e = err instanceof Error ? err : new Error(String(err));
    this.push(this.errors, {
      type: e.name || "Error",
      message: e.message,
      stack: e.stack,
      ...ctx,
      timestamp: Date.now(),
    });
  }

  log(level: Level, message: string, meta?: Record<string, unknown>) {
    if (!this.cfg.enabled) return;
    this.push(this.logs, {
      level,
      message,
      meta: meta ? (this.redact(meta) as Record<string, unknown>) : undefined,
      timestamp: Date.now(),
    });
  }

  async flush(): Promise<void> {
    if (this.flushing || !this.cfg.enabled) return;
    if (!this.requests.length && !this.errors.length && !this.logs.length) return;
    this.flushing = true;
    try {
      const n = this.cfg.maxBatchSize;
      const batch = {
        batchId: randomUUID(), // lets the server drop duplicates on retry
        requests: this.requests.splice(0, n),
        errors: this.errors.splice(0, n),
        logs: this.logs.splice(0, n),
      };
      const ok = await this.send(batch);
      if (!ok) {
        // put back at the front; buffer cap in push() trims the oldest if we grow too large
        this.requests.unshift(...batch.requests);
        this.errors.unshift(...batch.errors);
        this.logs.unshift(...batch.logs);
        this.trim();
      }
    } finally {
      this.flushing = false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    for (let i = 0; i < 20 && (this.requests.length || this.errors.length || this.logs.length); i++) {
      const before = this.requests.length + this.errors.length + this.logs.length;
      await this.flush();
      if (this.requests.length + this.errors.length + this.logs.length >= before) break; // not progressing
    }
  }

  // ---------- internals ----------

  private ignored(path: string) {
    return !!this.cfg.ignorePaths?.some((p) => (typeof p === "string" ? path === p : p.test(path)));
  }

  private push<T>(buf: T[], item: T) {
    buf.push(item);
    this.trim();
    if (buf.length >= this.cfg.maxBatchSize) void this.flush();
  }

  private trim() {
    for (const buf of [this.requests, this.errors, this.logs] as unknown[][]) {
      if (buf.length > this.cfg.maxBufferSize) buf.splice(0, buf.length - this.cfg.maxBufferSize);
    }
  }

  private async send(batch: object): Promise<boolean> {
    for (let attempt = 0; attempt <= this.cfg.maxRetries; attempt++) {
      try {
        const res = await fetch(`${this.cfg.endpoint}/api/v1/ingest`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-pulse-key": this.cfg.apiKey },
          body: JSON.stringify(batch),
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) return true;
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          this.debug(`dropped batch, server said ${res.status}`);
          return true; // permanent failure, retrying won't help
        }
        this.debug(`ingest ${res.status}, retrying`);
      } catch (e) {
        this.debug(`ingest failed: ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 2 ** attempt * 500 + Math.random() * 200));
    }
    return false;
  }

  private redact(value: unknown, depth = 0): unknown {
    if (depth > 5 || value == null) return value;
    if (Array.isArray(value)) return value.map((v) => this.redact(v, depth + 1));
    if (typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as object)) {
        out[k] = this.redactRx.test(k) ? "[REDACTED]" : this.redact(v, depth + 1);
      }
      return out;
    }
    return value;
  }

  private debug(msg: string) {
    if (this.cfg.debug) console.warn(`[pulse] ${msg}`);
  }
}

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function initPulse(config: PulseConfig) {
  return new PulseClient(config);
}