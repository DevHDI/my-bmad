# MyBMAD Dashboard

A web dashboard to visualize and track [BMAD (Breakthrough Method of Agile AI-Driven Development)](https://github.com/bmad-method/bmad-method) projects from your GitHub repositories.

> **License:** GNU AGPL v3 — see [LICENSE](./LICENSE) for details.

---

## What is MyBMAD Dashboard?

MyBMAD Dashboard connects to your GitHub repositories, reads the BMAD project structure (epics, stories, sprint status, docs), and displays everything in a clean, real-time dashboard. It is designed for solo developers and small teams who use the BMAD methodology with AI coding agents.

**Key features:**
- Import any GitHub repository that follows the BMAD structure
- Visualize epic progress and story status at a glance
- Browse BMAD docs and planning artifacts directly in the app
- Track sprint status and velocity metrics
- GitHub OAuth authentication (login with your GitHub account)
- Multi-user support with role management (admin / user)
- Self-hostable with Docker and automatic TLS via Traefik

---

<img width="1720" alt="Screenshot 1" src="./docs/screen1.png" />
<img width="1720" alt="Screenshot 2" src="./docs/screen2.png" />
<img width="1720" alt="Screenshot 3" src="./docs/screen3.png" />
<img width="1720" alt="Screenshot 4" src="./docs/screen4.png" />
<img width="1720" alt="Screenshot 5" src="./docs/screen5.png" />
<img width="1720" alt="Screenshot 6" src="./docs/screen6.png" />
<img width="1720" alt="Screenshot 7" src="./docs/screen7.png" />
<img width="1720" alt="Screenshot 8" src="./docs/screen8.png" />


## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + [Prisma](https://prisma.io) |
| Auth | [Better Auth](https://better-auth.com) (GitHub OAuth) |
| GitHub API | [@octokit/rest](https://github.com/octokit/rest.js) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| Deployment | Docker + Traefik (automatic TLS) |
| Tests | [Vitest](https://vitest.dev) |

---

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 15+ (or use Docker Compose)
- A **GitHub OAuth App** ([create one here](https://github.com/settings/developers))
- A **GitHub Personal Access Token** (optional but recommended for rate limits)

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/DevHDI/my-bmad.git
cd my-bmad
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

**Quick method** — auto-generates secrets for you:

```bash
bash scripts/setup.sh
```

**Manual method** — copy the template and edit by hand:

```bash
cp .env.example .env
```

Then fill in each variable as described below.

#### Database (`DATABASE_URL`)

If you use the included Docker Compose (step 4), the default value works out of the box:

```
DATABASE_URL=postgresql://bmad:bmad_dev_password@localhost:5433/bmad_dashboard
```

The format is `postgresql://<user>:<password>@<host>:<port>/<database>`. Adjust if you use your own PostgreSQL instance.

#### Auth secret (`BETTER_AUTH_SECRET`)

A random string used to sign session tokens. Generate one with:

```bash
openssl rand -base64 32
```

Paste the output as the value. Any long random string works.

#### App URL (`BETTER_AUTH_URL`)

The base URL where your app runs. For local development:

```
BETTER_AUTH_URL=http://localhost:3000
```

In production, set this to your real domain (e.g. `https://mybmad.example.com`).

#### Revalidation secret (`REVALIDATE_SECRET`)

A random string to protect the cache revalidation API endpoint. Generate one with:

```bash
openssl rand -hex 32
```

#### GitHub OAuth App (`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`)

Required for "Login with GitHub". Follow these steps:

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name:** `MyBMAD` (or anything you like)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID** into `GITHUB_CLIENT_ID`
6. Click **Generate a new client secret**, copy it into `GITHUB_CLIENT_SECRET`

#### GitHub Personal Access Token (`GITHUB_PAT`) — optional

Without a PAT, the GitHub API allows only 60 requests/hour. With one, you get 5,000/hour. Recommended if you import multiple repositories.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select scopes:
   - `public_repo` — for public repositories only
   - `repo` — if you also need private repositories
4. Copy the token into `GITHUB_PAT`

### 4. Start PostgreSQL with Docker Compose (optional)

If you don't have a local PostgreSQL instance:

```bash
docker compose up -d postgres
```

This starts a PostgreSQL instance on port `5433` (as configured in `.env.example`).

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — log in with GitHub and start importing repositories.

---

## Project Structure

```
my-bmad/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── (dashboard)/        # Authenticated dashboard pages
│   │   │   ├── page.tsx        # Home — projects overview
│   │   │   ├── repo/           # Per-repository views (epics, stories, docs)
│   │   │   ├── admin/          # Admin panel (user management)
│   │   │   └── profile/        # User profile
│   │   ├── api/
│   │   │   ├── auth/           # Better Auth handler
│   │   │   ├── health/         # Health check endpoint
│   │   │   └── revalidate/     # Cache revalidation webhook
│   │   └── login/              # Login page
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── docs/               # Markdown/doc viewer components
│   │   ├── epics/              # Epics & stories components
│   │   ├── layout/             # Sidebar, header, nav
│   │   └── ui/                 # shadcn/ui base components
│   ├── lib/
│   │   ├── auth/               # Better Auth configuration
│   │   ├── bmad/               # BMAD parser (reads repo structure)
│   │   ├── db/                 # Prisma client and helpers
│   │   └── github/             # Octokit client with retry/throttle
│   └── actions/                # Next.js Server Actions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history
├── docker/
│   ├── docker-compose.prod.yml # Production Docker Compose
│   └── DEPLOY.md               # Production deployment guide
├── _bmad/                      # BMAD methodology system (used to build this app)
└── _bmad-output/               # Planning artifacts generated during development
```

---

## Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run tests (Vitest)
pnpm test:watch       # Run tests in watch mode
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run database migrations (dev)
pnpm db:push          # Push schema changes without migration
pnpm db:studio        # Open Prisma Studio (database GUI)
```

---

## Production Deployment (Docker)

See the full guide in [`docker/DEPLOY.md`](./docker/DEPLOY.md).

**Quick summary:**

1. Clone the repo on your VPS
2. Create `.env` and `.env.local` from `.env.example`
3. Create the external Docker network: `docker network create web`
4. Launch: `docker compose --env-file .env -f docker/docker-compose.prod.yml up -d`
5. Run migrations: `docker compose ... exec my-bmad npx prisma migrate deploy`

The stack includes:
- **Next.js** application container
- **PostgreSQL** database
- **Traefik** reverse proxy with automatic Let's Encrypt TLS

---

## Configuration

### Making yourself an admin

After your first login, open Prisma Studio to set your role:

```bash
pnpm db:studio
```

Find your user in the `users` table and change `role` from `"user"` to `"admin"`.

### GitHub Personal Access Token

A PAT is optional but highly recommended to avoid GitHub API rate limits (60 req/h unauthenticated vs 5000 req/h authenticated). Required scopes:
- `repo` — for private repositories
- `public_repo` — for public repositories only

---

## API Endpoints

### POST `/api/revalidate`

Triggers cache revalidation for a specific tag. Requires authentication via the `x-revalidate-secret` header.

**Headers:**
- `x-revalidate-secret` (required): Must match the `REVALIDATE_SECRET` environment variable

**Body (JSON):**
```json
{ "tag": "repo-owner-name" }
```

**Example:**
```bash
curl -X POST https://mybmad.example.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your_secret_here" \
  -d '{"tag": "repo-owner-name"}'
```

**Responses:**
- `200 OK` — `{ "revalidated": true, "now": <timestamp> }`
- `401 Unauthorized` — Invalid or missing secret
- `503 Service Unavailable` — Revalidation is disabled (no secret configured)

### GET `/api/health`

Health check endpoint for monitoring and load balancers.

**Responses:**
- `200 OK` — `{ "status": "ok" }`
- `503 Service Unavailable` — `{ "status": "error" }`

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

---

## Security

Found a vulnerability? Please read our [SECURITY.md](./SECURITY.md) and report it responsibly.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**.

This means:
- You are free to use, modify, and distribute this software
- If you modify and deploy it as a network service (SaaS), you **must** publish your modified source code under the same license
- See [LICENSE](./LICENSE) for the full license text

---

## Acknowledgements

Built with the [BMAD Method](https://github.com/bmad-method/bmad-method) — an AI-driven agile development methodology.
