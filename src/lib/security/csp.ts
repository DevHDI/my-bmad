/**
 * Baseline Content-Security-Policy.
 *
 * Built per request because `script-src` carries a nonce. Next.js parses the
 * `Content-Security-Policy` *request* header, extracts `'nonce-{value}'`, and
 * applies it to the framework scripts, the page bundles and the inline scripts
 * it generates — including the anti-flash script from `next-themes`.
 */

export const CSP_REPORT_PATH = "/api/csp-report";

/** Reporting API endpoint name, referenced by the `report-to` directive. */
export const CSP_REPORT_ENDPOINT = "csp-endpoint";

/**
 * Enforce the policy instead of only reporting violations.
 *
 * Stays off until the report-only window has been observed long enough to be
 * confident the policy breaks nothing. Flip `CSP_ENFORCE=true` to turn it on.
 */
export function isCspEnforced(): boolean {
  return process.env.CSP_ENFORCE === "true";
}

/** Generate a fresh nonce. Web Crypto is available in the Edge runtime. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export interface CspOptions {
  isDev: boolean;
  /** Whether the policy will be delivered as enforcing rather than report-only. */
  enforced: boolean;
}

export function buildCsp(nonce: string, { isDev, enforced }: CspOptions): string {
  const directives = [
    "default-src 'self'",

    // 'strict-dynamic' lets the nonced Next.js bootstrap load the chunks it
    // needs without listing every bundle path.
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} 'strict-dynamic'`,

    // No nonce here on purpose: a nonce in style-src makes CSP3 browsers ignore
    // 'unsafe-inline', and the app server-renders `style` attributes (motion,
    // Radix, @tanstack/react-virtual) that a nonce cannot cover.
    "style-src 'self' 'unsafe-inline'",

    // Avatars come from avatars.githubusercontent.com, but rendered BMAD docs
    // can reference images from anywhere — rehype-sanitize's defaultSchema
    // permits any http/https `img src`. `https:` keeps docs working while still
    // ruling out plaintext http and javascript: sources. Narrowing this means
    // first restricting hosts in src/lib/bmad/sanitize-schema.ts.
    "img-src 'self' blob: data: https:",

    // next/font/google self-hosts Inter at build time, so no external origin.
    "font-src 'self'",

    // GitHub is only ever called server-side via Octokit. Dev needs websockets
    // for hot module replacement.
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,

    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `report-to ${CSP_REPORT_ENDPOINT}`,
    `report-uri ${CSP_REPORT_PATH}`,
  ];

  // Browsers ignore this directive in a report-only policy and log a console
  // error saying so, so only emit it once the policy actually enforces. It
  // would also break plain-http local development.
  if (!isDev && enforced) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}

/**
 * Registers the reporting endpoint. `report-uri` is deprecated but still what
 * Safari and older Chrome use, so both are emitted.
 */
export function buildReportingEndpoints(): string {
  return `${CSP_REPORT_ENDPOINT}="${CSP_REPORT_PATH}"`;
}
