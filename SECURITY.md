# Security Policy

## Supported Versions

As this project is in early development (`0.x`), only the latest version on the `main` branch receives security fixes.

| Version | Supported |
|---------|-----------|
| `main` (latest) | Yes |
| Older releases | No |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability, please report it responsibly:

### Option 1 — GitHub Security Advisories (Preferred)

Use [GitHub's private vulnerability reporting](https://github.com/DevHDI/my-bmad/security/advisories/new) to report the issue confidentially.

### Option 2 — Direct Contact

Reach out through the repository's contact channels listed on the GitHub profile.

---

## What to Include in Your Report

Please provide as much of the following as possible:

- A clear description of the vulnerability
- Steps to reproduce the issue
- The potential impact (what an attacker could do)
- Affected versions or components
- Any suggested fix (optional)

---

## Response Process

1. We will acknowledge receipt within **72 hours**
2. We will investigate and provide an initial assessment within **7 days**
3. We will work on a fix and coordinate disclosure with you
4. We will credit you in the release notes (unless you prefer to remain anonymous)

---

## Scope

### In Scope

- Authentication bypass or session vulnerabilities
- SQL injection or database access issues
- GitHub token/secret exposure
- Authorization issues (accessing other users' data)
- Server-Side Request Forgery (SSRF)
- Cross-Site Scripting (XSS) in rendered content

### Out of Scope

- Vulnerabilities in third-party dependencies (report directly to maintainers)
- Self-inflicted issues from misconfigured deployments
- Social engineering attacks
- Rate limiting or denial of service in development environments

---

## Security Best Practices for Deployment

When self-hosting MyBMAD Dashboard:

- **Never commit** `.env` or `.env.local` files to version control
- Use strong, randomly generated secrets for `BETTER_AUTH_SECRET` and `REVALIDATE_SECRET`
- Use environment-specific GitHub OAuth Apps (separate dev/prod apps)
- Keep your Docker images and dependencies up to date
- Restrict database access to the application container only
- Enable HTTPS (handled automatically by the Traefik setup in `docker-compose.prod.yml`)

---

## Known Risks and Mitigations

### OAuth Token Encryption at Rest

**Status:** Not yet implemented

**Risk:** GitHub OAuth tokens stored in the `account` table are not encrypted at rest. If an attacker gains read access to the database, they could use these tokens to access users' GitHub repositories.

**Current mitigations:**
- Database access is restricted to the application container only (Docker network isolation)
- The application enforces session-based authentication before any token usage
- PostgreSQL connections use password authentication

**Planned mitigation:** Implement AES-256-GCM encryption for OAuth tokens using `BETTER_AUTH_SECRET` as the key material. This requires intercepting Better Auth's account creation and token refresh flows via hooks or database triggers.
