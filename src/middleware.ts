import { NextRequest, NextResponse } from "next/server";
import {
  buildCsp,
  buildReportingEndpoints,
  generateNonce,
  isCspEnforced,
} from "@/lib/security/csp";

// Edge-compatible middleware: uses cookie presence to detect session.
// Role-based access (admin) is enforced at the layout/page level via server components.

/**
 * Attach the CSP to a response, and hand Next.js the nonce it needs.
 *
 * The nonce reaches Next.js through the *request* headers: it parses the
 * `Content-Security-Policy` request header and applies the nonce to every
 * script it emits. That header name is the only one it looks at, so in
 * report-only mode the request still carries the enforcing name while the
 * browser receives `Content-Security-Policy-Report-Only`.
 */
function withCsp(
  request: NextRequest,
  build: (init?: { request: { headers: Headers } }) => NextResponse
): NextResponse {
  const nonce = generateNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = build({ request: { headers: requestHeaders } });

  response.headers.set(
    isCspEnforced()
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only",
    csp
  );
  response.headers.set("Reporting-Endpoints", buildReportingEndpoints());

  return response;
}

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/login";

  // better-auth session cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    if (isLoginPage) return withCsp(request, (init) => NextResponse.next(init));
    return withCsp(request, () =>
      NextResponse.redirect(new URL("/login", request.url))
    );
  }

  // Authenticated user on login page → redirect to dashboard
  if (isLoginPage) {
    return withCsp(request, () =>
      NextResponse.redirect(new URL("/", request.url))
    );
  }

  return withCsp(request, (init) => NextResponse.next(init));
}

export const config = {
  matcher: [
    // Protect all routes except: API auth, static assets, public images.
    // api/csp-report is excluded too: violation reports are sent without
    // credentials, so redirecting them to /login would drop every report.
    "/((?!api/auth|api/health|api/csp-report|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
