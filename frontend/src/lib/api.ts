const BASE = "/api/v1";

export const getToken = () => localStorage.getItem("pulse_token");
export const setToken = (t: string | null) =>
  t ? localStorage.setItem("pulse_token", t) : localStorage.removeItem("pulse_token");

