import { describe, it, expect } from "vitest";
import { isValidEmail, isValidPhone, isValidUrl, checkPassword, cleanText } from "./validation";

describe("validation", () => {
  it("email", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("first.last@sub.domain.com")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
  it("phone", () => {
    expect(isValidPhone("+1 (555) 123-4567")).toBe(true);
    expect(isValidPhone("5551234")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
  it("url", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://x.io/path")).toBe(true);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
  });
  it("password", () => {
    expect(checkPassword("abc12345").ok).toBe(true);
    expect(checkPassword("short1").ok).toBe(false);
    expect(checkPassword("allletters").ok).toBe(false);
    expect(checkPassword("12345678").ok).toBe(false);
  });
  it("cleanText trims, collapses, caps", () => {
    expect(cleanText("  a   b  ")).toBe("a b");
    expect(cleanText("abcdef", 3)).toBe("abc");
  });
});
