@AGENTS.md

# OperFlow — quick reference

Operational management app for SMEs (customers, jobs, employee assignment, reporting). UK-market launch. Full history/decisions/rationale live in [info.md](info.md) — this file is just the fast-orientation summary; check info.md before assuming something isn't already solved.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · PostgreSQL via **Prisma v6** (not v7 — see gotchas) · NextAuth.js v5 (Credentials, JWT sessions) · shadcn/ui on **Base UI** (not Radix) · Tailwind v4 · Recharts · React Hook Form + Zod · Sonner.

Roles: `ADMIN` (full access) and `EMPLOYEE` (scoped to assigned jobs). No customer-facing portal yet (deferred by design).

## Gotchas that will bite you

- **`proxy.ts`, not `middleware.ts`** — Next 16 renamed the convention.
- **Base UI, not Radix**: shadcn's `asChild` pattern doesn't work the same way; triggers already render as real elements. `DropdownMenuLabel` needs a `Menu.Group` context — use a plain `<div>` if you don't have one.
- **Prisma pinned to v6** — v7 requires a bigger `prisma.config.ts` migration than this project needs.
- **`prisma migrate dev` doesn't work in this environment** (wants a TTY). Use `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`, hand-place the SQL in a new `prisma/migrations/<ts>_<name>/migration.sql`, then `prisma migrate deploy`.
- **Never use `updatedAt` as a domain timestamp** — it bumps on any write. Use `Job.completedAt`, owned only by `updateJobStatus`.
- **Date-only fields (`dueDate`) are midnight timestamps** — compare via `startOfDay()` (see `isOverdue()`/`isCompletedOnTime()` in `lib/jobs.ts`), never a raw `<`/`<=` against `new Date()`.
- **Decimal (Prisma) can't cross the Server→Client Component boundary** — map to a plain-object shape first.
- **Functions/formatters can't be passed as props into Client Components** — use a string/enum "type" prop and resolve the function inside the client component instead.
- **Unchecked HTML checkboxes submit `null`, not `undefined`** — Zod fields need `.nullable().optional()`, not just `.optional()`.
- **Base UI's `<SelectValue>` doesn't auto-derive a label** — pass a children render-function or you'll show raw enum/ID values in the UI.
- **The browser tool's `read_console_messages` accumulates for a tab's whole lifetime**, including across dev-server restarts. To check "is this still actually broken," open a fresh tab, don't re-read console on a long-lived one.
- **Any `generateMetadata` + page-body pair that fetches the same record, or any layout/page pair that wants the same list, should share a `cache()`-wrapped fetcher** (see `lib/queries.ts`, and the `getJob`/`getCustomer` pattern in the three detail pages) — Next.js dedupes `fetch()` automatically but not raw Prisma calls, and this app got bit by that twice (see info.md §11).
- **`auth()` is memoized per-request** (`lib/auth.ts`, wrapped in React `cache()`) because its `jwt` callback hits the DB on every call — don't unwrap that without re-checking why (info.md §11).

## Local dev

```bash
brew services start postgresql@16   # if not already running
npm run dev
```

`.env` needs `DATABASE_URL`, `AUTH_SECRET`, `DEMO_MODE="true"`. Demo login: `admin@operflow.app` / `jamie@operflow.app`, password `password123` (one-click buttons on `/login` when `DEMO_MODE=true`). Reseed anytime with `npm run db:seed` — safe, clears and re-inserts.

## Production

Live at `https://operation-platform.techwithtop.co.uk` (Vercel project `tech-with-top/oper-manag`, GitHub `Azamann01/operation-manage-mvp`, pushes to `main` auto-deploy). Neon Postgres, `lhr1` region.

**`vercel.json` pins function region to `lhr1`** — do not remove. Without it, functions default to `iad1` and every DB query pays a transatlantic round trip to Neon (this cost ~1.5s per page load before it was caught — info.md §11). Verify with `curl -sI <url> | grep x-vercel-id`: should read a single `lhr1::...`.

`DEMO_MODE=true` is set in all Vercel environments for now (no real customer data yet) — flip to `false` in Production the moment real customer data exists.

## Where to look

- Full decision log, every gotcha with its story, and complete build history → [info.md](info.md)
- Data model → `prisma/schema.prisma` (or info.md §3)
- Feature map (what's where) → info.md §5
- Known gaps / not-yet-built → info.md §10
