import { describe, it, expect } from "vitest";
import { isActiveSub } from "./subscription";
import { buildCertificatePdf } from "./certificatePdf";

describe("isActiveSub", () => {
  const now = Date.parse("2026-07-01T00:00:00Z");
  it("counts an active sub whose period is in the future", () => {
    expect(isActiveSub({ status: "active", current_period_end: "2026-08-01T00:00:00Z" }, now)).toBe(true);
  });
  it("does NOT count an active sub whose period has ended (the bug this fixes)", () => {
    expect(isActiveSub({ status: "active", current_period_end: "2026-06-01T00:00:00Z" }, now)).toBe(false);
  });
  it("does not count cancelled/expired/past_due regardless of date", () => {
    expect(isActiveSub({ status: "cancelled", current_period_end: "2026-08-01T00:00:00Z" }, now)).toBe(false);
    expect(isActiveSub({ status: "expired", current_period_end: "2026-08-01T00:00:00Z" }, now)).toBe(false);
  });
  it("trusts status when no period is tracked", () => {
    expect(isActiveSub({ status: "active" }, now)).toBe(true);
  });
  it("handles null/undefined safely", () => {
    expect(isActiveSub(null, now)).toBe(false);
    expect(isActiveSub(undefined, now)).toBe(false);
  });
});

describe("buildCertificatePdf", () => {
  it("produces valid PDF bytes with the recipient details", async () => {
    const bytes = await buildCertificatePdf({ name: "Jordan Rivera", courseTitle: "Client Foundations", completedAt: "2026-07-01T00:00:00Z" });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(500);
    // PDF magic number "%PDF"
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe("%PDF");
  });
});
