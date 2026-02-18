import { describe, it, expect, vi, afterEach } from "vitest";
import { formatRelativeTime } from "../utils";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Never synced' for null", () => {
    expect(formatRelativeTime(null)).toBe("Never synced");
  });

  it("returns 'Last synced just now' for < 1 min", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:30Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced just now");
  });

  it("returns 'Last synced 1 min ago' for 1 minute", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:01:00Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced 1 min ago");
  });

  it("returns 'Last synced 59 min ago' for 59 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:59:00Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced 59 min ago");
  });

  it("returns 'Last synced 1h ago' for 1 hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T13:00:00Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced 1h ago");
  });

  it("returns 'Last synced 23h ago' for 23 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-16T11:00:00Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced 23h ago");
  });

  it("returns 'Last synced 1d ago' for 24 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-16T12:00:00Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced 1d ago");
  });

  it("returns 'Last synced 7d ago' for 7 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-22T12:00:00Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced 7d ago");
  });

  it("accepts an ISO string input (serialization defense)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:05:00Z"));
    const isoString = "2026-02-15T12:00:00Z";
    expect(formatRelativeTime(isoString)).toBe("Last synced 5 min ago");
  });

  it("accepts a Date object input", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:05:00Z"));
    const date = new Date("2026-02-15T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("Last synced 5 min ago");
  });

  it("returns 'Never synced' for an invalid date string", () => {
    expect(formatRelativeTime("not-a-date")).toBe("Never synced");
  });

  it("returns 'Last synced just now' for a future date (clock skew)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:00Z"));
    const futureDate = new Date("2026-02-15T12:05:00Z");
    expect(formatRelativeTime(futureDate)).toBe("Last synced just now");
  });
});
