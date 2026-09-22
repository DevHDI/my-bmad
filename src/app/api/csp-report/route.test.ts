import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

type RequestInitArg = ConstructorParameters<typeof NextRequest>[1];

function post(body: BodyInit, headers: Record<string, string> = {}): NextRequest {
  const init = {
    method: "POST",
    headers: { "content-type": "application/csp-report", ...headers },
    body,
    // Required by undici whenever the body is a stream.
    duplex: "half",
  } as unknown as RequestInitArg;

  return new NextRequest("http://localhost/api/csp-report", init);
}

/** A body delivered in chunks, carrying no content-length. */
function streamed(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

describe("POST /api/csp-report", () => {
  it("accepts a legacy csp-report body", async () => {
    const res = await POST(
      post(JSON.stringify({ "csp-report": { "document-uri": "/login" } }))
    );

    expect(res.status).toBe(204);
  });

  it("accepts a Reporting API body", async () => {
    const res = await POST(
      post(
        JSON.stringify([
          { type: "csp-violation", body: { effectiveDirective: "img-src" } },
        ]),
        { "content-type": "application/reports+json" }
      )
    );

    expect(res.status).toBe(204);
  });

  it("rejects a malformed body", async () => {
    const res = await POST(post("not json"));

    expect(res.status).toBe(400);
  });

  it("rejects an oversized body declared via content-length", async () => {
    const res = await POST(post("x".repeat(20_000)));

    expect(res.status).toBe(413);
  });

  it("rejects an oversized streamed body that declares no content-length", async () => {
    // Guards the ceiling when no content-length is declared. Note this asserts
    // the status only: the point of reading the stream is that the memory is
    // never spent, which a status code cannot show.
    const chunk = new Uint8Array(4_000).fill(120);
    const res = await POST(post(streamed(Array.from({ length: 10 }, () => chunk))));

    expect(res.status).toBe(413);
  });

  it("measures the limit in bytes, not UTF-16 units", async () => {
    // 9 000 accented characters: well under the limit by String.length, but
    // 18 000 bytes once encoded as UTF-8.
    const payload = JSON.stringify({ "csp-report": { "document-uri": "é".repeat(9_000) } });
    expect(payload.length).toBeLessThan(16_000);
    expect(new TextEncoder().encode(payload).byteLength).toBeGreaterThan(16_000);

    const res = await POST(post(payload));

    expect(res.status).toBe(413);
  });
});
