import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import { Server } from "socket.io";
import { env } from "../config/env";
import { Application } from "../modules/applications/application.model";

let io: Server | null = null;
export const getIO = () => io;

export function initSockets(server: HttpServer) {
  io = new Server(server, { cors: { origin: env.CLIENT_URL } });

  io.use((socket, next) => {
    try {
      const payload = jwt.verify(String(socket.handshake.auth?.token), env.JWT_SECRET) as { sub: string };
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", async (appId: string, ack?: (r: { ok: boolean }) => void) => {
      const owns = isValidObjectId(appId) && (await Application.exists({ _id: appId, userId: socket.data.userId }));
      if (owns) socket.join(`app:${appId}`);
      ack?.({ ok: !!owns });
    });
    socket.on("unsubscribe", (appId: string) => socket.leave(`app:${appId}`));
  });

  return io;
}