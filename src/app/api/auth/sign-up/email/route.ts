import { auth } from "@/lib/auth/auth";

// More specific than /api/auth/[...all]/route.ts, so this handler wins for
// /api/auth/sign-up/email. We delegate to Better Auth, then normalize any
// failure response so neither the HTTP status code nor the body can be
// used to enumerate registered email addresses.
//
// Why a route wrapper instead of a Better Auth `after` hook: the hook
// runner (`runAfterHooks` in better-auth/dist/api/to-auth-endpoints.mjs)
// only propagates `response` and `headers` from a re-thrown APIError —
// not `status`. So an after hook can rewrite the body but leaves the
// original 422 status intact, leaking email existence via the status code
// alone.
export async function POST(request: Request): Promise<Response> {
  const response = await auth.handler(request);

  // Preserve success responses (cookies/session headers must pass through).
  if (response.status < 400) {
    return response;
  }
  // Preserve the registration-disabled gate: it reflects a server-wide
  // flag (ALLOW_REGISTRATION=false), not a per-email signal.
  if (response.status === 403) {
    return response;
  }
  // Collapse every other failure into a single generic shape.
  return new Response(
    JSON.stringify({ message: "Sign-up failed" }),
    {
      status: 400,
      headers: { "content-type": "application/json" },
    },
  );
}
