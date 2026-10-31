export interface DomainMoveNotice {
  /** Origin of the new address, e.g. https://mybmad.example.com */
  url: string;
  /** Host of the new address, e.g. mybmad.example.com */
  host: string;
  /** Human-readable switch date, or null when none is configured. */
  date: string | null;
}

/**
 * Announces that this instance is moving to another domain.
 *
 * Configured with DOMAIN_MOVE_URL (the new address) and, optionally,
 * DOMAIN_MOVE_DATE (YYYY-MM-DD). The notice is shown only to visitors who are
 * not already on the new address, so it can stay enabled on both domains
 * during the transition. When DOMAIN_MOVE_URL is unset, nothing is shown.
 */
export function getDomainMoveNotice(
  requestHost: string | null | undefined,
): DomainMoveNotice | null {
  const rawUrl = process.env.DOMAIN_MOVE_URL?.trim();
  if (!rawUrl) return null;

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return null;
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") return null;

  const currentHost = requestHost?.trim().toLowerCase().replace(/:\d+$/, "");
  if (currentHost && currentHost === target.hostname.toLowerCase()) return null;

  return {
    url: target.origin,
    host: target.host,
    date: formatMoveDate(process.env.DOMAIN_MOVE_DATE),
  };
}

function formatMoveDate(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  // Date normalizes impossible days (2026-02-30 becomes March 2), so reject
  // any value that does not survive the round trip.
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== value) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
