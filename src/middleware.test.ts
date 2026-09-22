import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

function cspOf(res: Response): string {
  return (
    res.headers.get("content-security-policy") ??
    res.headers.get("content-security-policy-report-only") ??
    ""
  );
}

function directive(csp: string, name: string): string {
  return (
    csp
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name} `)) ?? ""
  );
}

function nonceOf(res: Response): string | undefined {
  return /'nonce-([^']+)'/.exec(cspOf(res))?.[1];
}

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

describe("middleware CSP", () => {
  const ORIGINAL_ENFORCE = process.env.CSP_ENFORCE;

  afterEach(() => {
    if (ORIGINAL_ENFORCE === undefined) delete process.env.CSP_ENFORCE;
    else process.env.CSP_ENFORCE = ORIGINAL_ENFORCE;
  });

  it("reports rather than enforces by default", () => {
    delete process.env.CSP_ENFORCE;
    const res = middleware(createRequest("/dashboard", SESSION_COOKIE));

    expect(res.headers.get("content-security-policy-report-only")).toContain(
      "default-src 'self'",
    );
    expect(res.headers.get("content-security-policy")).toBeNull();
  });

  it("enforces when CSP_ENFORCE is set", () => {
    process.env.CSP_ENFORCE = "true";
    const res = middleware(createRequest("/dashboard", SESSION_COOKIE));

    expect(res.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(res.headers.get("content-security-policy-report-only")).toBeNull();
  });

  it("issues a distinct nonce per request", () => {
    const first = nonceOf(middleware(createRequest("/a", SESSION_COOKIE)));
    const second = nonceOf(middleware(createRequest("/b", SESSION_COOKIE)));

    expect(first).toBeTruthy();
    expect(first).not.toBe(second);
  });

  it("keeps 'unsafe-inline' out of script-src and the nonce out of style-src", () => {
    const csp = cspOf(middleware(createRequest("/dashboard", SESSION_COOKIE)));
    const scriptSrc = directive(csp, "script-src");
    const styleSrc = directive(csp, "style-src");

    // A nonce in style-src would make CSP3 browsers ignore 'unsafe-inline',
    // which the server-rendered `style` attributes depend on.
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(styleSrc).toContain("'unsafe-inline'");
    expect(styleSrc).not.toContain("nonce-");
  });

  it("points violations at the report endpoint", () => {
    const res = middleware(createRequest("/dashboard", SESSION_COOKIE));

    expect(res.headers.get("reporting-endpoints")).toContain("/api/csp-report");
    expect(cspOf(res)).toContain("report-uri /api/csp-report");
  });

  it("covers redirects too", () => {
    const res = middleware(createRequest("/dashboard"));

    expect(res.status).toBe(307);
    expect(cspOf(res)).toContain("default-src 'self'");
  });
});
