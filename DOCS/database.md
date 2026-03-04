# Database (PostgreSQL + Prisma)

Get Postgres running and apply the schema. The template uses **PostgreSQL**, **Prisma** (client in `generated/prisma/`), and **Better Auth** tables that are already in the schema.

---

## TL;DR

| Goal | Do this |
|------|--------|
| Local Postgres | Install Postgres, create a DB, set `DATABASE_URL` in `.env` |
| Hosted Postgres | Use Supabase, Neon, Railway, etc.; paste their connection string |
| Apply schema | `bun db:generate` then `bun db:push` |
| Inspect data | `bun db:studio` |

---

## 1. Where will Postgres run?

### Option A - Local (fastest for dev)

Install Postgres, create a database, then in `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB?schema=public
```

### Option B - Hosted (good for beginners)

Use any hosted Postgres (Supabase, Neon, Railway, Render, etc.). They give you a URL like:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
```

If the provider offers **two** URLs (direct + pooled), see the **Connection pooling** section below.

---

## 2. Generate client and push schema

From the project root:

```bash
bun db:generate
bun db:push
```

- **`db:generate`** - Generates the Prisma client.
- **`db:push`** - Applies `prisma/schema.prisma` to the database (no migration files). Good for templates and prototypes.

---

## 3. Migrations (when you’re ready)

For a real product you may want proper migrations:

```bash
# Create and apply a migration (dev)
bun db:migrate:dev

# Apply existing migrations (e.g. production)
bun db:migrate:deploy
```

---

## 4. Prisma Studio (inspect and edit data)

```bash
bun db:studio
```

Opens a local UI where you can view and edit `User`, `Session`, `Account`, `Subscription`, etc.

---

## 5. Connection pooling (serverless)

On Vercel, Lambda, or other serverless hosts, many short-lived connections can hit Postgres limits. Use a **pooled** connection string if your provider offers one (Neon, Supabase, Railway, etc.). Set that as `DATABASE_URL` and you’re done.

If you self-host Postgres, look into **PgBouncer**.

---

## 6. Where the database is used

| What | Where |
|------|--------|
| Schema | `prisma/schema.prisma` |
| Prisma client (single instance - use this everywhere) | `lib/db.ts` |
| Auth adapter | `lib/auth.ts` (uses Prisma adapter) |
