# Production Deployment Guide — my-bmad

## Prerequisites

- Docker and Docker Compose installed on the VPS
- A domain name pointing to the server's IP (DNS A record)
- Ports 80 and 443 open in the firewall

> **IMPORTANT**: Both `.env` and `.env.local` files at the project root are **mandatory**. The Docker stack refuses to start if either one is missing. Docker Compose will fail with an error if the required variables (`DOMAIN`, `ACME_EMAIL`, `POSTGRES_*`) are not defined in `.env`.

## 1. Prepare the environment files

Two files are required at the project root:

### `.env` — Docker Compose variables (parse time)

```bash
# Domain for Traefik and Let's Encrypt
DOMAIN=mybmad.example.com
ACME_EMAIL=admin@example.com

# PostgreSQL credentials
POSTGRES_DB=bmad_dashboard
POSTGRES_USER=bmad
POSTGRES_PASSWORD=a_strong_password_here
```

### `.env.local` — Next.js container runtime variables

```bash
# Better Auth
BETTER_AUTH_SECRET=generate_with_openssl_rand_base64_32
BETTER_AUTH_URL=https://mybmad.example.com

# GitHub OAuth (create an app at https://github.com/settings/developers)
# Callback URL: https://mybmad.example.com/api/auth/callback/github
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

## 2. Create the external Docker network

```bash
docker network create web
```

This network is shared between Traefik and the application. On a multi-stack VPS, each stack can join this same network to be exposed through Traefik.

## 3. Start the stack

```bash
docker compose --env-file .env -f docker/docker-compose.prod.yml up -d
```

> **Note:** `--env-file .env` is explicit for clarity. Docker Compose loads `.env` implicitly from the working directory, but specifying it avoids any ambiguity.

> **DATABASE_URL**: This variable is automatically built by Docker Compose in `docker-compose.prod.yml` from the `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` variables. Do not define it in `.env.local` — this would create a conflict with the value injected by `environment:` in the compose file.

## 3b. Run database migrations

After the first deployment or after a Prisma schema update:

```bash
docker compose --env-file .env -f docker/docker-compose.prod.yml exec my-bmad npx prisma migrate deploy
```

This command applies pending migrations to the production database. It must be run:
- **First deployment**: to create the initial tables
- **Updates**: whenever the Prisma schema changes (new field, new table, etc.)

> **Important**: `prisma migrate deploy` is NOT destructive — it only applies pending migrations, never a reset.

## 4. Verify the deployment

```bash
# Check that all 3 services are running
docker compose --env-file .env -f docker/docker-compose.prod.yml ps

# Check the health endpoint
curl https://mybmad.example.com/api/health

# Check Traefik logs
docker compose --env-file .env -f docker/docker-compose.prod.yml logs traefik

# Check application logs
docker compose --env-file .env -f docker/docker-compose.prod.yml logs my-bmad
```

## 5. Let's Encrypt Certificates

Certificates are automatically obtained and renewed by Traefik via the TLS challenge. They are persisted in the `letsencrypt` Docker volume.

- **First launch**: the certificate is obtained automatically (may take 1-2 min)
- **Renewal**: automatic before expiration (Traefik manages the full cycle)
- **Persistence**: certificates survive restarts thanks to the `letsencrypt` volume

## 6. Updates

```bash
# Rebuild and restart the application
docker compose --env-file .env -f docker/docker-compose.prod.yml up -d --build my-bmad

# Apply migrations if the schema has changed
docker compose --env-file .env -f docker/docker-compose.prod.yml exec my-bmad npx prisma migrate deploy
```

## 7. Shutdown

```bash
docker compose --env-file .env -f docker/docker-compose.prod.yml down
```

PostgreSQL data and Let's Encrypt certificates are preserved in Docker volumes.
