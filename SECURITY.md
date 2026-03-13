# Security

## Reporting a vulnerability

If you believe you have found a security vulnerability in this project, please report it responsibly:

1. **Do not** open a public GitHub issue.
2. Email the maintainers (see the repository owner/contacts) with a description of the issue, steps to reproduce, and any suggested fix if you have one.
3. Allow reasonable time for a fix before disclosing publicly.

## For template users

This repository is a **starter template**. When you use it to create your own project:

- Never commit `.env` or any file containing secrets (API keys, `BETTER_AUTH_SECRET`, `DATABASE_URL`, Stripe keys, etc.).
- Use `.env.example` only as a reference; keep real values in `.env` and ensure `.env` is in `.gitignore`.
- Rotate any secrets if they were ever committed or exposed.
- Keep dependencies up to date (e.g. use Dependabot or run `pnpm update` regularly).
