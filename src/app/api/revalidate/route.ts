import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  tag: z.string().min(1).max(256),
});

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function getClientIp(request: NextRequest): string {
  // Trust the first forwarded IP from the proxy, fall back to x-real-ip,
  // then to a sentinel so we never bypass the limit because the header
  // is missing.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Per-IP rate limit. Defense in depth: the shared secret is still the
  // primary protection, but if it leaks an attacker could otherwise
  // hammer this endpoint to drive continuous cache invalidation and
  // upstream load. 30/min per IP comfortably exceeds any legitimate
  // build pipeline cadence while stopping abuse cold.
  if (!checkRateLimit(`revalidate:${getClientIp(request)}`, 30, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const provided = request.headers.get("x-revalidate-secret");
  if (!provided || !safeEqual(provided, secret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  revalidateTag(parsed.data.tag, "default");
  return NextResponse.json({ revalidated: true, tag: parsed.data.tag });
}
