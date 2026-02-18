import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function createRequest(
  path: string,
  cookies?: Record<string, string>,
): NextRequest {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

const SESSION_COOKIE = { "better-auth.session_token": "valid-token" };

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when not authenticated", () => {
    const req = createRequest("/dashboard");
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("allows unauthenticated user on /login", () => {
    const req = createRequest("/login");
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  it("redirects authenticated user from /login to /", () => {
    const req = createRequest("/login", SESSION_COOKIE);
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("allows authenticated user to access routes", () => {
    const req = createRequest("/dashboard", SESSION_COOKIE);
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  it("recognises __Secure- prefixed cookie", () => {
    const req = createRequest("/dashboard", {
      "__Secure-better-auth.session_token": "secure-token",
    });
    const res = middleware(req);

    expect(res.status).toBe(200);
  });
});
