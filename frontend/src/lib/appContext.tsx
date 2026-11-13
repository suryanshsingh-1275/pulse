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

