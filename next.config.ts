import type { NextConfig } from "next";

/**
 * Static fallback CSP.
 *
 * The real, nonce-based policy is set per request in src/middleware.ts. This
 * covers what the middleware matcher skips — /api/auth, /api/health, static
 * assets — where no HTML and no inline script is ever served, so it can stay
 * strict without a nonce. `headers()` runs at build time and cannot produce a
 * per-request nonce, which is why it is not the primary mechanism.
 */
const fallbackCsp = [
  "default-src 'self'",
  "script-src 'none'",
  "style-src 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // The middleware overwrites this header on every path it matches, so
        // in practice this only ever reaches the excluded ones.
        source:
          "/((?!api/csp-report)(?:api/auth|api/health|_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Content-Security-Policy", value: fallbackCsp },
        ],
      },
    ];
  },
};

export default nextConfig;
