import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Application, Range } from "./types";

interface Ctx {
  apps: Application[];
  loading: boolean;
  current: Application | null;
  select: (id: string) => void;
  range: Range;
  setRange: (r: Range) => void;
}

const AppCtx = createContext<Ctx>(null!);
export const useApps = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => api<Application[]>("/apps"),
  });
  const [currentId, setCurrentId] = useState<string | null>(localStorage.getItem("pulse_app"));
  const [range, setRange] = useState<Range>("1h");

  const select = useCallback((id: string) => {
    localStorage.setItem("pulse_app", id);
    setCurrentId(id);
  }, []);

  const current = apps.find((a) => a._id === currentId) ?? apps[0] ?? null;

  return (
    <AppCtx.Provider value={{ apps, loading: isLoading, current, select, range, setRange }}>
      {children}
    </AppCtx.Provider>
  );
}