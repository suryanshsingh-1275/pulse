import { io, type Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) socket = io({ auth: (cb) => cb({ token: getToken() }) });
  return socket;
}

export function resetSocket() {
  socket?.disconnect();
  socket = null;
}