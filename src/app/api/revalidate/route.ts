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

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Validate the shared secret first. timingSafeEqual on SHA-256 digests
  // makes brute force computationally infeasible, so no pre-auth quota
  // is needed (and a per-IP one would be bypassable via x-forwarded-for
  // spoofing).
  const provided = request.headers.get("x-revalidate-secret");
  if (!provided || !safeEqual(provided, secret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // Global post-auth rate limit. If the secret ever leaks, this caps the
  // damage an attacker can do at 30 cache invalidations per minute,
  // regardless of source IP. Legitimate build/deploy automation rarely
  // exceeds a handful of revalidations per minute, so the ceiling is
  // generous for honest callers.
  if (!checkRateLimit("revalidate:authenticated", 30, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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
