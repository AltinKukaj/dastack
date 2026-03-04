# Changelog

## 1.1.1

- Fixed runtime env detection for auth/feature flags in deployments (including Dokploy) by forcing dynamic rendering on `/` and dynamic, non-cached responses on `/api/features`.
- Included recent deploy/build hardening updates:
  - `8d5aae5` - Pin Bun version in deploy workflow.
  - `d6af708` - Copy Prisma schema and config in Dockerfile.

## 1.1.0

- Added `/api/health` endpoint for deployment liveness/readiness checks.
- Added `DOCS/troubleshooting.md` and `DOCS/optional.md` for common fixes and integration guidance.
- Added minimal starter tests for feature flags and the example tRPC router.

## 1.0.0

- Initial template release.
