import { describe, it, expect, afterEach, vi } from "vitest";
import { isSuperAdmin } from "@/lib/auth/super-admin";

describe("isSuperAdmin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when SUPER_ADMIN_EMAIL is unset", () => {
    vi.stubEnv("SUPER_ADMIN_EMAIL", "");
    expect(isSuperAdmin("owner@example.com")).toBe(false);
  });

  it("returns false when the email is missing", () => {
    vi.stubEnv("SUPER_ADMIN_EMAIL", "owner@example.com");
    expect(isSuperAdmin(undefined)).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin("")).toBe(false);
  });

  it("returns true for the configured email", () => {
    vi.stubEnv("SUPER_ADMIN_EMAIL", "owner@example.com");
    expect(isSuperAdmin("owner@example.com")).toBe(true);
  });

  it("ignores case and surrounding whitespace", () => {
    vi.stubEnv("SUPER_ADMIN_EMAIL", "  Owner@Example.com ");
    expect(isSuperAdmin("OWNER@example.COM")).toBe(true);
  });

  it("returns false for any other email", () => {
    vi.stubEnv("SUPER_ADMIN_EMAIL", "owner@example.com");
    expect(isSuperAdmin("someone@example.com")).toBe(false);
  });
});
