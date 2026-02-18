import { NextRequest, NextResponse } from "next/server";

// Edge-compatible middleware: uses cookie presence to detect session.
// Role-based access (admin) is enforced at the layout/page level via server components.
export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/login";

  // better-auth session cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated user on login page → redirect to dashboard
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all routes except: API auth, static assets, public images
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
