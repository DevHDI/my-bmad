# Getting Started

Step-by-step guide to run MyBMAD Dashboard locally.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Docker** (for PostgreSQL, or use your own PostgreSQL 15+ instance)
- A **GitHub OAuth App** — optional, only needed for GitHub login ([create one here](https://github.com/settings/developers))
- A **GitHub Personal Access Token** — optional but recommended for rate limits when importing GitHub repos

## 1. Clone the repository

```bash
git clone https://github.com/DevHDI/my-bmad.git
cd my-bmad
```

## 2. Install dependencies

```bash
pnpm install
```

## 3. Set up environment variables

**Quick method** — auto-generates secrets for you:

```bash
bash scripts/setup.sh
```

**Manual method** — copy the template and edit by hand:

```bash
cp .env.example .env
```

Then fill in each variable as described below.

### Database (`DATABASE_URL`)

If you use the included Docker Compose (step 4), the default value works out of the box:

```
DATABASE_URL=postgresql://bmad:bmad_dev_password@localhost:5433/bmad_dashboard
```

The format is `postgresql://<user>:<password>@<host>:<port>/<database>`. Adjust if you use your own PostgreSQL instance.

### Auth secret (`BETTER_AUTH_SECRET`)

A random string used to sign session tokens. Generate one with:

```bash
openssl rand -base64 32
```

Paste the output as the value. Any long random string works.

### App URL (`BETTER_AUTH_URL`)

The base URL where your app runs. For local development:

```
BETTER_AUTH_URL=http://localhost:3002
```

In production, set this to your real domain (e.g. `https://mybmad.example.com`).

### Revalidation secret (`REVALIDATE_SECRET`)

A random string to protect the cache revalidation API endpoint. Generate one with:

```bash
openssl rand -hex 32
```

### GitHub OAuth App (`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`)

Required for "Login with GitHub". Follow these steps:

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name:** `MyBMAD` (or anything you like)
   - **Homepage URL:** `http://localhost:3002`
   - **Authorization callback URL:** `http://localhost:3002/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID** into `GITHUB_CLIENT_ID`
6. Click **Generate a new client secret**, copy it into `GITHUB_CLIENT_SECRET`

### GitHub Personal Access Token (`GITHUB_PAT`) — optional

Without a PAT, the GitHub API allows only 60 requests/hour. With one, you get 5,000/hour. Recommended if you import multiple repositories.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select scopes:
   - `public_repo` — for public repositories only
   - `repo` — if you also need private repositories
4. Copy the token into `GITHUB_PAT`

## 4. Start PostgreSQL with Docker Compose (optional)

If you don't have a local PostgreSQL instance:

```bash
docker compose up -d
```

This starts a PostgreSQL instance on port `5433` (to avoid conflicts with a local PostgreSQL on 5432).

## 5. Run database migrations

```bash
pnpm db:migrate
```

## 6. Create your first account

**Option A** — enable registration in `.env`, then sign up from the web UI:

```
ALLOW_REGISTRATION=true
```

After creating your account, you can set it back to `false`.

**Option B** — create an admin directly from the command line:

```bash
pnpm db:create-admin --email admin@example.com --password your_password --name Admin
```

To access the admin panel (`/admin`), set `SUPER_ADMIN_EMAIL` to your account's email in `.env`.
Only that account sees the **Admin** button in the sidebar.

## 7. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002) — log in and start importing repositories.

> **Note:** The dev server runs on port **3002** (configured in `package.json`). If you set up GitHub OAuth, make sure the callback URL matches this port.

---

## Environment Variables Reference

| Variable | Required | Default / How to generate | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://bmad:bmad_dev_password@localhost:5433/bmad_dashboard` | PostgreSQL connection string. Works out of the box with the included Docker Compose. |
| `BETTER_AUTH_SECRET` | Yes | `openssl rand -base64 32` | Random string to sign session tokens. |
| `BETTER_AUTH_URL` | Yes | `http://localhost:3002` | Base URL where the app is running. |
| `REVALIDATE_SECRET` | Yes | `openssl rand -hex 32` | Secret to protect the cache revalidation endpoint. |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth App Client ID. Only needed for "Login with GitHub". |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth App Client Secret. |
| `GITHUB_PAT` | No | — | Personal Access Token for higher GitHub API rate limits (60 → 5,000 req/h). |
| `ALLOW_REGISTRATION` | No | `false` | Set to `true` to allow new users to sign up via email/password. |
| `SUPER_ADMIN_EMAIL` | No | — | Email of the only account allowed to open `/admin` (users list and usage metrics). Unset = admin panel disabled. |
| `ENABLE_LOCAL_FS` | No | `false` | Set to `true` to enable [local folder imports](./LOCAL_FOLDER.md). |

> The `scripts/setup.sh` script auto-generates `BETTER_AUTH_SECRET` and `REVALIDATE_SECRET` for you.
