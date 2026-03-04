# Contributing

Thanks for your interest in improving this template.

## Ground Rules

- Keep changes focused and minimal.
- Preserve the template-first philosophy: secure defaults, optional features, and clear docs.
- Do not commit secrets (`.env`, API keys, credentials).
- Update docs in `DOCS/` when behavior or setup steps change.

## Local Development

```bash
bun install
bun run lint
bun run type-check
bun test
```

If your change touches database behavior:

```bash
bun db:generate
bun db:push
```

## Pull Requests

- Use a clear title and describe the intent of the change.
- Include testing notes (what you ran and what passed).
- For UI changes, include screenshots or short clips when possible.
- Keep PRs small so they are easy to review.

## Documentation Expectations

When adding or changing features, update the relevant docs:

- `README.md` for high-level behavior
- `DOCS/README.md` for navigation
- Specific guides in `DOCS/` for setup/usage details
