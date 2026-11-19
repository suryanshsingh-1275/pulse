import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey } from "../src/utils/apiKey";
import { errorFingerprint } from "../src/utils/fingerprint";

describe("apiKey", () => {
  it("generates a key whose hash matches", () => {
    const { key, hash, prefix } = generateApiKey();
    expect(key.startsWith("pk_")).toBe(true);
    expect(hashApiKey(key)).toBe(hash);
    expect(key.startsWith(prefix)).toBe(true);
  });
  it("generates unique keys", () => {
    expect(generateApiKey().key).not.toBe(generateApiKey().key);
  });
});

describe("errorFingerprint", () => {
  const stackA = "Error: x\n    at handler (/app/a.js:10:5)\n    at next (/app/b.js:1:1)";
  const stackB = "Error: x\n    at handler (/app/a.js:99:7)\n    at other (/app/c.js:1:1)";
  it("ignores line/column numbers", () => {
    expect(errorFingerprint("Error", stackA)).toBe(errorFingerprint("Error", stackB));
  });
  it("differs by type", () => {
    expect(errorFingerprint("Error", stackA)).not.toBe(errorFingerprint("TypeError", stackA));
  });
});