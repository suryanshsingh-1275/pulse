const BASE = "/api/v1";

export const getToken = () => localStorage.getItem("pulse_token");
export const setToken = (t: string | null) =>
  t ? localStorage.setItem("pulse_token", t) : localStorage.removeItem("pulse_token");

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    setToken(null);
    window.location.href = "/login";
  }
  if (!res.ok) {
    const details = json?.error?.details?.map((d: { message: string }) => d.message).join(", ");
    throw new Error(details || json?.error?.message || "Request failed");
  }
  return json.data as T;
}