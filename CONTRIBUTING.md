# Contributing to MyBMAD Dashboard

Thank you for your interest in contributing! This document explains how to get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [Development Setup](#development-setup)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Coding Conventions](#coding-conventions)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

This project follows a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

---

## How to Report a Bug

1. Check the [existing issues](https://github.com/DevHDI/my-bmad/issues) to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include: steps to reproduce, expected behavior, actual behavior, environment details

---

## How to Request a Feature

1. Check if it has been requested already
2. Open an issue using the **Feature Request** template
3. Describe the use case and why it would be valuable

---

## Development Setup

### Requirements

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or Docker)

### Steps

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/my-bmad.git
cd my-bmad

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Start database (if using Docker)
docker compose up -d postgres

# 5. Run migrations
pnpm db:migrate

# 6. Start dev server
pnpm dev
```

---

## Submitting a Pull Request

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** — keep them focused on a single concern

3. **Run checks** before submitting:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

4. **Write a clear commit message** (see below)

5. **Open a Pull Request** against `main` with:
   - A clear title and description
   - Reference to any related issue (`Closes #123`)
   - Screenshots if the change affects the UI

### PR Guidelines

- Keep PRs small and focused — one feature or fix per PR
- Add tests for new functionality where applicable
- Do not change unrelated code in the same PR
- Update documentation if your change affects behavior

---

## Coding Conventions

### TypeScript

- Use TypeScript strictly — no `any` unless absolutely necessary
- Prefer explicit types over inference for function signatures

### Tailwind CSS

This project uses **Tailwind CSS v4** with `@theme inline` in `src/app/globals.css`.

- **Never use arbitrary bracket values** when a canonical Tailwind class exists:
  - Spacing: `160px` → `w-40`, `15px` → `mt-3.75`
  - Ring width: `ring-3` not `ring-[3px]`
  - Percentages: `top-1/2` not `top-[50%]`
- Arbitrary values are OK for: `calc()` expressions, CSS variable references, non-standard values
- Repeated hex colors should be added as theme tokens in `globals.css`

### React / Next.js

- Use Server Components by default — add `"use client"` only when needed
- Use Server Actions for mutations (see `src/actions/`)
- Keep components small and focused

### File Organization

```
src/
├── app/           # Pages and API routes only
├── components/    # Reusable UI components
├── lib/           # Business logic, utilities, external integrations
└── actions/       # Next.js Server Actions
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

Body (optional): explain WHY not WHAT

Closes #issue
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(epics): add timeline view with drag-to-collapse
fix(github): handle 403 on private repo access
docs: update deployment guide for Traefik v3
chore(deps): upgrade Next.js to 16.2
```

---

## License

By contributing, you agree that your contributions will be licensed under the project's **GNU AGPL v3** license.
