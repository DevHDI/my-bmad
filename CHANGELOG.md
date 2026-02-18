# Changelog

All notable changes to MyBMAD Dashboard are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Open-source release preparation (LICENSE, CONTRIBUTING, SECURITY, README)

---

## [0.1.0] — 2026-02-18

Initial public release.

### Added
- GitHub OAuth authentication via Better Auth
- Import GitHub repositories structured with the BMAD methodology
- Dashboard overview with global stats across all projects
- Per-project views: epics timeline, stories table, docs browser, sprint status
- Velocity metrics and progress tracking
- Markdown/YAML/JSON document viewer with syntax highlighting
- Admin panel for user and role management
- Docker + Traefik production deployment with automatic TLS
- Health check API endpoint (`/api/health`)
- Cache revalidation webhook (`/api/revalidate`)
- Dark/light theme support
- Graceful error handling for parse errors in BMAD files

---

[Unreleased]: https://github.com/DevHDI/my-bmad/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/DevHDI/my-bmad/releases/tag/v0.1.0
