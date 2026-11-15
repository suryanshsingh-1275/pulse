import { createHash, randomBytes } from "crypto";

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

/** Keys are 192 bits of entropy, so a fast SHA-256 is appropriate (unlike passwords). */
export function generateApiKey() {
  const key = `pk_${randomBytes(24).toString("hex")}`;
  return { key, hash: hashApiKey(key), prefix: key.slice(0, 10) };
}