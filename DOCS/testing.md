# Testing

Template tests are intentionally minimal. They demonstrate patterns and protect core starter behavior, but they are not a full product test suite.

---

## What is covered by default

- Env schema behavior (required/optional variable validation patterns)
- Prisma config import resilience
- Feature flag behavior (`lib/features.ts`)
- Role/permission helpers (`lib/permissions.ts`)
- Example tRPC router call shape (`example.hello`)

Run tests:

```bash
bun test
```

---

## What you should add for your app

- Auth flow tests (sign-up, sign-in, protected dashboard access)
- Domain-specific unit tests for your own business logic
- Integration tests for your API/database boundaries
- End-to-end tests (for example Playwright) for regression safety
