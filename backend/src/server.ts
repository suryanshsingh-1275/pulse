import http from "http";
import mongoose from "mongoose";
import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { startAlertEvaluator } from "./modules/alerts/alert.service";
import { startTelemetryWorker } from "./queues/telemetry.worker";
import { initSockets } from "./sockets";

async function main() {
  await connectDB();

  const server = http.createServer(app);
  initSockets(server);
  const worker = startTelemetryWorker();
  startAlertEvaluator();

  server.listen(env.PORT, () => console.log(`[server] http://localhost:${env.PORT}`));

  const shutdown = async () => {
    console.log("[server] shutting down...");
    server.close();
    await worker.close();
    await mongoose.disconnect();
    redis.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});