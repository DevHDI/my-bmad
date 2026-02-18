import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

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

  const provided = request.headers.get("x-revalidate-secret");
  if (!provided || !safeEqual(provided, secret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  revalidateTag(parsed.data.tag, "default");
  return NextResponse.json({ revalidated: true, tag: parsed.data.tag });
}
