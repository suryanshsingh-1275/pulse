import IORedis from "ioredis";
import { env } from "./env";

// maxRetriesPerRequest must be null for BullMQ
export const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
redis.on("connect", () => console.log("[redis] connected"));
redis.on("error", (e) => console.error("[redis] error", e.message));