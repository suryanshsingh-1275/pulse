import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import { resetSocket } from "./socket";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());
  const qc = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const finish = (d: { user: User; token: string }) => {
    setToken(d.token);
    setUser(d.user);
  };

  const login = useCallback(async (email: string, password: string) => {
    finish(await api("/auth/login", { method: "POST", body: { email, password } }));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    finish(await api("/auth/register", { method: "POST", body: { name, email, password } }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    resetSocket();
    qc.clear();
  }, [qc]);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}