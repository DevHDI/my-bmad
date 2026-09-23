import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Collects Content-Security-Policy violation reports.
 *
 * Public and unauthenticated by necessity: browsers post reports without
 * credentials, and a violation can fire on the login page before any session
 * exists. Everything below therefore assumes the body is hostile.
 */

/** Reports are small; anything larger is not a browser. Counted in bytes. */
const MAX_BODY_BYTES = 16_000;

/** Cap what a single report can write to the logs. */
const MAX_FIELD_LENGTH = 300;

/** Legacy `application/csp-report` body. */
const legacyReportSchema = z.object({
  "csp-report": z.object({
    "document-uri": z.string().optional(),
    "violated-directive": z.string().optional(),
    "effective-directive": z.string().optional(),
    "blocked-uri": z.string().optional(),
  }),
});

/** Reporting API `application/reports+json` body. */
const reportingApiSchema = z.array(
  z.object({
    type: z.string().optional(),
    url: z.string().optional(),
    body: z
      .object({
        documentURL: z.string().optional(),
        effectiveDirective: z.string().optional(),
        blockedURL: z.string().optional(),
      })
      .optional(),
  })
);

interface Violation {
  documentUri?: string;
  directive?: string;
  blockedUri?: string;
}

function truncate(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.length > MAX_FIELD_LENGTH
    ? `${value.slice(0, MAX_FIELD_LENGTH)}…`
    : value;
}

function extractViolations(body: unknown): Violation[] {
  const legacy = legacyReportSchema.safeParse(body);
  if (legacy.success) {
    const report = legacy.data["csp-report"];
    return [
      {
        documentUri: report["document-uri"],
        directive:
          report["effective-directive"] ?? report["violated-directive"],
        blockedUri: report["blocked-uri"],
      },
    ];
  }

  const modern = reportingApiSchema.safeParse(body);
  if (modern.success) {
    return modern.data
      .filter((entry) => entry.type === undefined || entry.type === "csp-violation")
      .map((entry) => ({
        documentUri: entry.body?.documentURL ?? entry.url,
        directive: entry.body?.effectiveDirective,
        blockedUri: entry.body?.blockedURL,
      }));
  }

  return [];
}

/**
 * Read the body while enforcing a byte ceiling.
 *
 * `request.text()` would buffer everything before any check, so a chunked
 * request with no `content-length` could spend arbitrary memory first. Reading
 * the stream lets the connection be cancelled as soon as the limit is passed.
 * The count is in bytes: `String.length` counts UTF-16 units, so a multi-byte
 * body would slip well past a limit expressed in bytes.
 *
 * Returns null when the body is too large.
 */
async function readBoundedBody(
  request: NextRequest,
  maxBytes: number
): Promise<string | null> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

export async function POST(request: NextRequest) {
  // Anonymous global quota. Per-IP would be pointless here: reports carry no
  // credentials and x-forwarded-for is spoofable, so one shared ceiling is the
  // honest bound. A real violation storm still gets a representative sample.
  if (!checkRateLimit("csp-report", 120, 60000)) {
    return new NextResponse(null, { status: 429 });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  const raw = await readBoundedBody(request, MAX_BODY_BYTES);
  if (raw === null) {
    return new NextResponse(null, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  for (const violation of extractViolations(parsed)) {
    console.warn("[csp] violation", {
      documentUri: truncate(violation.documentUri),
      directive: truncate(violation.directive),
      blockedUri: truncate(violation.blockedUri),
    });
  }

  // 204 regardless: browsers ignore the status, and a body would only give an
  // attacker a reflection surface.
  return new NextResponse(null, { status: 204 });
}
