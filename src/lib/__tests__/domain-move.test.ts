import { describe, it, expect, afterEach, vi } from "vitest";
import { getDomainMoveNotice } from "@/lib/domain-move";

describe("getDomainMoveNotice", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when DOMAIN_MOVE_URL is unset", () => {
    vi.stubEnv("DOMAIN_MOVE_URL", "");
    expect(getDomainMoveNotice("old.example.com")).toBeNull();
  });

  it("returns null when DOMAIN_MOVE_URL is not a valid http(s) URL", () => {
    vi.stubEnv("DOMAIN_MOVE_URL", "not a url");
    expect(getDomainMoveNotice("old.example.com")).toBeNull();

    vi.stubEnv("DOMAIN_MOVE_URL", "javascript:alert(1)");
    expect(getDomainMoveNotice("old.example.com")).toBeNull();
  });

  it("returns the notice on another host", () => {
    vi.stubEnv("DOMAIN_MOVE_URL", "https://new.example.com/");
    vi.stubEnv("DOMAIN_MOVE_DATE", "");
    expect(getDomainMoveNotice("old.example.com")).toEqual({
      url: "https://new.example.com",
      host: "new.example.com",
      date: null,
    });
  });

  it("returns null when already on the new host, ignoring case and port", () => {
    vi.stubEnv("DOMAIN_MOVE_URL", "https://new.example.com");
    expect(getDomainMoveNotice("new.example.com")).toBeNull();
    expect(getDomainMoveNotice("NEW.example.com:443")).toBeNull();
  });

  it("still returns the notice when the request host is unknown", () => {
    vi.stubEnv("DOMAIN_MOVE_URL", "https://new.example.com");
    expect(getDomainMoveNotice(null)).not.toBeNull();
  });

  it("formats a valid DOMAIN_MOVE_DATE", () => {
    vi.stubEnv("DOMAIN_MOVE_URL", "https://new.example.com");
    vi.stubEnv("DOMAIN_MOVE_DATE", "2026-11-14");
    expect(getDomainMoveNotice("old.example.com")?.date).toBe(
      "November 14, 2026",
    );
  });

  it("ignores a malformed DOMAIN_MOVE_DATE", () => {
    vi.stubEnv("DOMAIN_MOVE_URL", "https://new.example.com");
    vi.stubEnv("DOMAIN_MOVE_DATE", "14/11/2026");
    expect(getDomainMoveNotice("old.example.com")?.date).toBeNull();
  });
});
