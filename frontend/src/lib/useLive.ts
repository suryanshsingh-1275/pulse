import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSocket } from "./socket";
import type { LiveEvent } from "./types";

/** Subscribes to the selected app's socket room. On new telemetry it invalidates that app's queries (throttled). */
export function useLive(appId?: string) {
  const qc = useQueryClient();
  const [last, setLast] = useState<LiveEvent | null>(null);

  useEffect(() => {
    if (!appId) return;
    const socket = getSocket();
    const subscribe = () => socket.emit("subscribe", appId);
    subscribe();
    socket.on("connect", subscribe);

    let timer: number | undefined;
    const refresh = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = undefined;
        qc.invalidateQueries({ queryKey: ["app", appId] });
      }, 1500);
    };
    const onTelemetry = (e: LiveEvent) => { setLast(e); refresh(); };

    socket.on("telemetry", onTelemetry);
    socket.on("alert", refresh);
    return () => {
      socket.emit("unsubscribe", appId);
      socket.off("connect", subscribe);
      socket.off("telemetry", onTelemetry);
      socket.off("alert", refresh);
      if (timer) clearTimeout(timer);
      setLast(null);
    };
  }, [appId, qc]);

  return last;
}