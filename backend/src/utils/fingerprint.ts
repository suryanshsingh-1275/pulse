import { createHash } from "crypto";

/** Groups errors by type + top stack frame (line/col numbers stripped). */
export function errorFingerprint(type: string, stack?: string) {
  const frame =
    stack
      ?.split("\n")
      .find((l) => l.trim().startsWith("at "))
      ?.replace(/:\d+:\d+\)?$/, "")
      .trim() ?? "no-stack";
  return createHash("sha1").update(`${type}|${frame}`).digest("hex").slice(0, 16);
}