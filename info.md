# OperFlow — Project Reference

Internal reference doc: what this app is, why it's built the way it is, and the decisions made along the way. Kept up to date as the project evolves so future work (by Claude or anyone else) doesn't have to rediscover context.

Last updated: 2026-08-16 (second correctness review pass)

---

## 1. What this is

**OperFlow** is an operational management app for SMEs: a single place to manage customers, jobs, employee assignments, job progress, daily operational activity, and management reporting. Built for a UK-market launch.

Two roles ship in this phase:
- **Admin** — full visibility: customers, jobs, employees, reports, assignment, pricing.
- **Employee** — scoped view: only their assigned jobs, with status updates and notes.

A **customer-facing portal** was explicitly deferred to a later phase (the user chose "Admin + Employee only for now" when the roles question came up during planning). The data model and job-activity system already support adding it later without rework.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router), TypeScript | Turbopack dev/build |
| Database | PostgreSQL (local, via Homebrew) | DB name: `oper_manag` |
| ORM | Prisma **v6** | Deliberately pinned below v7 — see "Decisions" below |
| Auth | NextAuth.js v5 (beta), Credentials provider, JWT sessions | `trustHost: true` for portable dev URLs |
| UI kit | shadcn/ui on **Base UI** (`@base-ui/react`), not Radix | Affects component APIs — see "Decisions" |
| Styling | Tailwind CSS v4 | |
| Charts | Recharts | Bar, pie/donut |
| Forms | React Hook Form + Zod (validation schemas live in `lib/actions/*.ts`, colocated with the server actions) | |
| Notifications | Sonner (toast) | Wired into every mutation |
| Icons | lucide-react | |

### Why these choices (decisions log)

- **Prisma v6, not v7**: v7 removed `datasource { url }` in favor of `prisma.config.ts` + driver adapters — a bigger migration than this project needed. Downgraded to v6 to keep the standard `schema.prisma` + `DATABASE_URL` workflow.
- **Base UI, not Radix, under shadcn**: `npx shadcn@latest init` on this Next 16 setup pulled in `@base-ui/react` primitives. This means shadcn's usual `asChild` prop pattern **does not work** the same way — Base UI triggers (`DropdownMenuTrigger`, `SheetTrigger`, etc.) already render as real buttons/elements, so you style them directly instead of wrapping a child with `asChild`. Also: `DropdownMenuLabel` requires a `Menu.Group` context in Base UI — simplest fix used here was a plain styled `<div>` instead of the primitive for the user-info block in the avatar dropdown.
- **Next.js "proxy" convention**: Next 16 deprecated the `middleware.ts` file convention in favor of `proxy.ts` (same API, `auth()` wrapper). File is named `proxy.ts` at the project root, not `middleware.ts`.
- **Local Postgres over Docker/SQLite**: no Docker available in the dev environment; Postgres installed directly via `brew install postgresql@16` and left running as a background service (`brew services start postgresql@16`).
- **JWT session strategy**: session data (name, role) is embedded in the JWT at sign-in and **not re-fetched from the DB on every request**. Known consequence: if you rename a seeded user and re-seed, already-logged-in sessions keep showing the old name until they sign out/in again. Not a bug, just how NextAuth JWT sessions behave — worth remembering if demo data ever looks stale mid-session.
- **Server Component → Client Component boundary**: hit this twice during the build. React Server Components cannot pass functions or component references (icons, formatter callbacks) as props into a Client Component — only plain serializable data or Server Actions. Both times the fix was the same shape: replace the function prop with a string/enum "type" prop, and let the Client Component resolve the actual function internally (see `nav-links.ts`'s icons being resolved inside `DashboardShell` itself, and `AnimatedNumber`'s `formatType` prop instead of a passed-in formatter).
- **`setState` inside `useEffect` (React Compiler / eslint rule)**: the lint rule `react-hooks/set-state-in-effect` flagged several dialog components that auto-closed on successful form submission via a `useEffect` watching action state. Fixed by moving the "close on success" logic into the `useActionState` action wrapper itself (an async function that awaits the real action, then calls `setOpen(false)` directly) instead of reacting to state changes after the fact.
- **UK VAT is a fixed 20%** (`UK_VAT_RATE` constant in `lib/currency.ts`), with a per-job `vatExempt` boolean for services that don't attract VAT. Not configurable per-tenant — fine for a single-business tool, would need revisiting for a multi-tenant SaaS version.
- **No sidebar, by explicit request**: the app originally shipped with a sidebar + top bar (standard admin dashboard pattern). The user asked for it removed in favor of a single sticky top navbar with inline links (desktop) and an inline-expanding dropdown panel (mobile, not a drawer/sheet).
- **Dark navbar over light content, by explicit request**: user asked for "more advanced" background colors and better text visibility. Navbar is hardcoded to a dark slate (`slate-950`) regardless of system light/dark preference (the app doesn't have a dark-mode toggle — `next-themes` is installed as a shadcn dependency but unused). Because of this, navbar text colors are hardcoded light-on-dark (`text-white`, `text-slate-400`, etc.) rather than using the semantic `text-foreground`/`text-muted-foreground` tokens, which are calibrated for the light theme used everywhere else in the app.
- **Base UI's `Select.Value` does not auto-derive a label** (unlike Radix, which Base UI otherwise resembles): it renders the raw selected `value` string by default. This silently showed raw customer IDs / enum values (`MEDIUM`, `IN_PROGRESS`) instead of human labels in every `<Select>` in the app until caught during final verification. Fix pattern used everywhere now: pass a children render-function to `<SelectValue>`, e.g. `<SelectValue>{(value) => labelFor(value)}</SelectValue>` — see `components/jobs/job-form-dialog.tsx` and `status-control.tsx`. Worth checking any *new* `<Select>` against this — it's an easy one to miss because the app still builds and looks fine until you actually pick a non-trivial value.
- **Zod + unchecked HTML checkboxes**: `formData.get("someCheckbox")` returns `null` (not `undefined`) when a checkbox is unchecked. `z.enum(["on"]).optional()` only tolerates `undefined`, so it rejected every job creation where "VAT exempt" was left unchecked — a real, previously-unexercised bug caught during final end-to-end testing. Fixed with `.nullable().optional()`. Worth the same check on any future checkbox-backed Zod field.
- **`prisma migrate dev` refuses to run in this (non-interactive) environment**, even for additive/safe migrations — it always wants a TTY prompt. Workaround used for every migration after the first: `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script` to generate the SQL, hand-place it in a new timestamped `prisma/migrations/<ts>_<name>/migration.sql` folder, then `prisma migrate deploy` (which is non-interactive-safe) to apply and record it.
- **Prisma's `Decimal` type must not be handed to a Client Component as a prop** — it's a class instance, not a plain object, so it fails the RSC serialization boundary (console warning: "Only plain objects can be passed to Client Components..."). Solution: map Server Component data down to a lean, purpose-built plain-object shape before passing to any Client Component, rather than forwarding raw Prisma rows — see `AttentionJob` in `components/dashboard/needs-attention.tsx` vs. the raw `Job` it used to take.
- **The browser tool's `read_console_messages` returns the *entire accumulated* console history for a tab's lifetime**, not just the current page. Old errors (including ones already fixed) kept reappearing across every check, including after a dev-server restart, because the same long-lived tab was reused throughout the session. The reliable way to check "is this actually still broken?" is to open a fresh tab (`tabs_create`) and re-navigate, not to re-read console on a tab that's been open for a while.
- **Editing an NextAuth-authenticated dev DB (deleting/recreating `User` rows via reseed) invalidates existing JWT sessions' user id**, causing FK-constraint crashes the next time server code tries to write a row referencing `session.user.id` (e.g. notifications). This used to require manually signing out (`/api/auth/signout` if the UI itself was crashed) and back in after any reseed. **Fixed** in `lib/auth.ts`'s `jwt` callback: on every token read (not just sign-in), it now verifies `token.id` still resolves to a real, active `User` row, and returns `null` if not — which Auth.js treats as "no session," so the app cleanly redirects to `/login` instead of crashing with a raw Prisma FK error. Verified by logging in, deleting that session's `User` row directly in the DB, then reloading: before the fix this crashed with `Notification_userId_fkey` violated; after, it redirects to `/login`. Trade-off: this adds one `db.user.findUnique` per `auth()` call on existing sessions (only on token *reads*, not on the sign-in request itself, which already looked the user up) — an acceptable cost at this app's scale, and arguably the more correct behavior for a JWT-strategy session anyway (closer to re-validating against the source of truth without giving up JWT's other benefits).
- **Never reuse Prisma's auto-managed `updatedAt` as a proxy for a domain-specific event timestamp** (e.g. "when was this job completed"). `@updatedAt` bumps on *every* write to the row, including unrelated ones — `setJobRating()` calling `db.job.update()` to store a star rating silently reset `updatedAt` to "now," which corrupted every metric that had been reading `updatedAt` as "completion time": on-time-completion %, avg. completion hours, and the completed-this-week/-month counts on the dashboard and reports. A job completed months ago that got rated today would briefly report as "completed this month." Fixed by adding a dedicated `Job.completedAt` field, set (and cleared, if status moves away from `COMPLETED`) only inside `updateJobStatus` — the one place that should own that timestamp. General rule: if a field's write-timing needs to be independently controllable from a row's other fields, it needs its own column, not `updatedAt`.
- **`dueDate` (and other date-only fields from an `<input type="date">`) are stored as midnight timestamps, not calendar dates** — comparing them against `new Date()` with `<`/`<=` treats "due today" as overdue for almost the entire day, since midnight-today is already in the past by the time anyone looks at the page. `lib/jobs.ts`'s `isOverdue()` had exactly this bug (confirmed live: a job due "today" was showing a red "Overdue" badge). Fixed by comparing `startOfDay()` of both sides instead of raw timestamps — see `isOverdue()` and the new `isCompletedOnTime()` helper. Any new comparison against `dueDate` should go through one of these helpers rather than a fresh raw comparison.
- **`assignEmployees()` auto-promotes `PENDING → ASSIGNED` when the first employee is assigned, but originally never reverted `ASSIGNED → PENDING` when the last employee was unassigned** — a job could end up showing the "Assigned" status badge while its assignee list read "Unassigned." Fixed with a symmetric `else if` branch in `lib/actions/jobs.ts`. Worth checking for the same asymmetry if more auto-status-transition rules get added later (e.g. would completing the last open assignment need a symmetric counterpart too?).
- **Any employee picker/select must include currently-assigned employees even if they're inactive**, not just `where: { active: true }` — otherwise deactivating someone mid-assignment makes them silently vanish from pickers (like the job detail page's "Assign employees" dialog) while they're still actually assigned underneath, with no UI way to see or remove them. Fixed in `app/admin/jobs/[id]/page.tsx` by widening the query to `OR: [{ active: true }, { assignments: { some: { jobId: id } } }]`. Same pattern would apply to any future picker scoped to "active" rows that can also represent an existing, already-selected value.
- **Never seed a Client Component's local state from a prop via `useState(prop)` if that prop is expected to change on re-render** — `useState`'s argument is only consulted on the component's first mount; later prop updates (e.g. from Next.js re-rendering a persistent layout after a Server Action revalidates the route) are silently ignored, leaving the component stuck showing first-load data forever. Hit this in `NotificationsBell` (`components/dashboard/notifications-bell.tsx`): its bell badge/list never picked up newly-generated notifications without a full page reload. The naive fix — a `useEffect` that calls `setState` whenever the prop changes — trips ESLint's `react-hooks/set-state-in-effect` rule (cascading-render risk); the correct fix is React's documented "adjusting state when a prop changes" pattern: track the previous prop value in its own `useState`, and call `setState` directly during render (not inside an effect) when it differs from the incoming prop. See `components/dashboard/notifications-bell.tsx` for the pattern to copy if another component needs the same "server prop can refresh under a mounted client component" handling.

---

## 3. Data model

Defined in `prisma/schema.prisma`.

- **User** — `role` (`ADMIN` | `EMPLOYEE`), `jobTitle`, `active` (soft-deactivate, not hard delete — employees with job history can't be deleted, only deactivated).
- **Customer** — company + contact info + `industry` (free-text tag shown on the customer card). Has many `Site`s.
- **Site** — a physical location belonging to a `Customer` (e.g. a property manager's individual buildings). `name` + optional `address`. A `Job` can optionally reference one.
- **Job** — belongs to a `Customer` and optionally a `Site`. `number` (Int, `@default(autoincrement())`, unique — the human-facing `JOB-0042` id, formatted via `formatJobNumber()` in `lib/jobs.ts`; note the underlying Postgres sequence is **not** reset by reseeding, so numbers keep climbing across reseeds). `status` (`PENDING → ASSIGNED → IN_PROGRESS → COMPLETED`/`CANCELLED`), `priority` (`LOW`/`MEDIUM`/`HIGH`), `scheduledDate`/`dueDate`, pricing: `price` (Decimal(10,2), excl. VAT, nullable) + `vatExempt` (Boolean), `rating` (Int 1–5, nullable — captured after completion, admin-only to set), and `completedAt` (DateTime, nullable — set/cleared only by `updateJobStatus`; **do not** use Prisma's auto-managed `updatedAt` as a stand-in for "when was this completed," see decisions log).
- **JobAssignment** — many-to-many join between `Job` and `User` (employees assigned to a job).
- **JobActivity** — append-only log per job: `STATUS_CHANGE`, `NOTE`, `CHECK_IN`, `CHECK_OUT`. Drives both the per-job activity timeline and the admin dashboard's global "Recent activity" feed. Every mutating action (create job, assign, change status, add note) writes one of these — this is the audit trail / operational visibility mechanism the whole app is built around.
- **Notification** — per-user, `type` (`JOB_ASSIGNED` | `JOB_COMPLETED` | `JOB_OVERDUE` | `NOTE_ADDED`), optional `jobId`, `read` boolean. Event-driven types are created directly inside the relevant server action (`assignEmployees`, `updateJobStatus`, `addJobNote` in `lib/actions/jobs.ts`). `JOB_OVERDUE` is different — there's no background scheduler in this app, so it's generated **lazily**: every time `getNotifications()` runs (i.e. on every admin page load, via the layout), it checks currently-overdue jobs against existing `JOB_OVERDUE` notifications and creates any missing ones before returning the list. Good enough for a single-business tool; would need a real cron/queue for anything higher-scale.

Migrations live in `prisma/migrations/`. Four so far: `init`, `add_job_price_vat`, `add_sites_notifications_job_extras`, `add_job_completed_at`.

---

## 4. Auth & route protection

- `lib/auth.ts` — NextAuth config, Credentials provider, bcrypt password check, JWT callbacks attach `id`/`role` to the session.
- `proxy.ts` (project root) — route-level guard: unauthenticated → `/login`; `/admin/*` requires `ADMIN`; `/employee/*` requires `ADMIN` or `EMPLOYEE`.
- Each layout (`app/admin/layout.tsx`, `app/employee/layout.tsx`) double-checks role server-side and redirects — belt-and-braces alongside the proxy.
- Server actions in `lib/actions/*.ts` also re-check the session (`requireAdmin`, `requireJobAccess`) — never trust the client, even though the UI already hides unauthorized actions. `requireJobAccess` specifically checks an employee is actually assigned to a job before letting them update its status or add notes.

**Demo credentials** (seeded, UK fictitious data — see §6):
- Admin: `admin@operflow.app` / `password123`
- Employee: `jamie@operflow.app` / `password123`

---

## 5. Feature map

| Area | Where | Notes |
|---|---|---|
| Admin dashboard | `app/admin/page.tsx` | KPI row (open/due-today/overdue/completed-this-month), "Needs attention" panel (overdue + high-priority jobs), "Weekly performance" panel (on-time %, avg. completion hours, avg. rating, week-over-week trend), jobs-by-status chart, "Team workload" panel (open jobs per employee), recent activity feed, upcoming jobs, pending-assignment banner |
| Employee dashboard | `app/employee/page.tsx` | Today's jobs, quick status control, full assigned-job list |
| Customers | `app/admin/customers/` | Card-grid list (industry, sites count, open-jobs count); detail page with contact/job-count/avg-rating/notes stats, **Sites** management, job history |
| Sites | `components/sites/`, `lib/actions/sites.ts` | Multiple locations per customer; managed from the customer detail page; selectable (customer-filtered) when creating a job |
| Jobs CRUD | `app/admin/jobs/` | List with status filters + job numbers + overdue badges, detail (assign/status/notes/pricing/rating/timeline), create dialog (with site picker), delete |
| Employee job view | `app/employee/jobs/[id]/` | Same job detail, scoped — no assign/delete controls, rating shown read-only |
| Employees CRUD | `app/admin/employees/` | List, create (sets temp password), edit, activate/deactivate toggle |
| Job completion rating | `components/jobs/job-rating.tsx` | 1–5 star picker, admin-settable once a job is `COMPLETED`; rolls up into customer avg., reports, and the dashboard's weekly performance panel |
| Reports | `app/admin/reports/` | Revenue (incl. VAT), total/completed jobs, completion rate, avg. time-to-complete, avg. customer rating, status donut, jobs-completed-by-employee bar |
| Notifications | `lib/actions/notifications.ts`, `components/dashboard/notifications-bell.tsx` | Navbar bell with unread badge; job-assigned / job-completed / note-added (event-driven) + job-overdue (lazily synced on read); mark one or all as read |
| Quick create job | `components/jobs/quick-create-job.tsx` | Admin-only "+" in the navbar, opens the same job dialog used on the Jobs page from anywhere in the app |
| Command palette | `components/dashboard/command-palette.tsx` | Cmd/Ctrl+K, fuzzy nav search + sign out |
| Toasts | Sonner, mounted in `app/layout.tsx` | Wired into every create/update/delete/status-change/assign action |

---

## 6. UK-market specifics

- Currency formatting via `Intl.NumberFormat('en-GB', { currency: 'GBP' })` (`lib/currency.ts`).
- VAT fixed at 20%, with per-job exemption flag.
- Seed data (`prisma/seed.ts`) uses **fictitious** UK details only — no real personal/contact info:
  - Company names, contacts, and addresses are invented (London/Manchester/Birmingham).
  - Phone numbers use **Ofcom's officially reserved fictional ranges** (safe to display anywhere): `020 7946 0xxx` (London), `0161 496 0xxx` (Manchester), `0121 496 0xxx` (Birmingham).
  - This replaced an earlier seed pass that used Nigerian (+234) numbers and Lagos/Abuja addresses — changed specifically because (a) the product is launching in the UK, and (b) the user asked that demo data not resemble their own real contact details.
- Completed jobs in the seed have **explicitly backdated `createdAt`/`updatedAt`** (via `hoursAgo()` in `prisma/seed.ts`) rather than letting Prisma default them to "now". Without this, every seeded completed job would show 0.0h average completion time and 0% on-time rate on the dashboard, since `createdAt`/`updatedAt` would be identical seed-run timestamps regardless of the fictional `dueDate` offset. Worth remembering if more seed jobs are added later — completed jobs need believable backdated timestamps to make the Reports/Weekly-performance numbers look real.

---

## 7. Local dev setup

```bash
# one-time
brew install postgresql@16
brew services start postgresql@16
createdb oper_manag

cd oper-manag
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed   # or: npm run db:seed

npm run dev
```

`.env` (gitignored) needs:
```
DATABASE_URL="postgresql://<user>@localhost:5432/oper_manag?schema=public"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
```
(No `NEXTAUTH_URL` needed — `trustHost: true` in `lib/auth.ts` handles dynamic dev ports.)

**To reset seed data**: `prisma/seed.ts` clears all rows (in FK-safe order) before re-inserting, so `npx prisma db seed` is safe to re-run any time. Note NextAuth JWT sessions won't reflect renamed users until re-login (see decisions log above).

---

## 8. Conversation / build history

Chronological summary of how this app came to be, in case future changes need the "why":

1. **Plugin detour**: session started with installing the `figma` plugin for Claude Code (marketplace `claude-plugins-official`, repo `anthropics/claude-plugins-official`). Unrelated to the app itself — Figma MCP tools require interactive OAuth (`/mcp` in a terminal session), not available in a non-interactive session.
2. **Planning**: user asked to build "an operational management app for SME" with admin/engineer/employee dashboards, customer management, job tracking, employee assignment, reporting, "modern interactive" UX. Clarified via questions: stack = Next.js + Postgres; roles = Admin + Employee only for now (customer portal deferred).
3. **Initial build** (plan-mode → approved → executed): scaffolded Next.js, Prisma schema, NextAuth, dashboard shell (originally sidebar + topbar), Customers/Jobs/Employees CRUD, admin dashboard, employee dashboard, reports, UI polish (loading skeletons, empty states, mobile responsiveness). Verified everything in-browser at each step.
4. **Demo data privacy pass**: user asked to remove anything resembling their real contact details and reseed with fresh names — done.
5. **UK relaunch pass**: user said the product is launching in the UK — reseeded with UK companies/addresses and Ofcom-fictional phone numbers.
6. **VAT + navbar + interactivity pass**: user asked for (a) UK VAT and currency formatting on jobs, (b) "modernised interactive features," (c) sidebar removed. Delivered: `price`/`vatExempt` on jobs + GBP/VAT display everywhere pricing shows, sidebar replaced with a top navbar (inline desktop nav, inline mobile dropdown, not a drawer), Cmd+K command palette, toasts on all mutations, animated KPI counters, hover/transition polish.
   - Caught and fixed two real bugs during verification: `AnimatedNumber` could get stuck at 0 if `requestAnimationFrame` never fired (fixed to render the correct value on first paint, animate only on updates); passing a formatter function as a prop from a Server Component into `AnimatedNumber` violated the RSC serialization boundary (fixed with a `formatType` string enum instead).
7. **Color/contrast pass**: user asked for more advanced navbar/background colors for better text visibility. Navbar changed to dark slate-950 with white/slate-400 text and a glowing indigo active-tab indicator; main content background changed from flat gray to a soft indigo radial-gradient wash. Also caught and fixed a stale reference: the login page's "Demo accounts" hint still listed the pre-UK-reseed employee email.
8. **This file**: written on request, to keep the plan/stack/decisions/history in one place instead of scattered across chat.
9. **Feature-parity pass against a reference dashboard**: user linked an external reference site (behind a ChatGPT sign-in wall Claude couldn't access directly) and asked to "add features from it." User signed in themselves and pasted screenshots of its Customers and Manager Dashboard views. Claude compared them against OperFlow and proposed 8 candidate features via a scoped multi-select question; the user selected all 8:
   - Job reference numbers (`JOB-0042`) + overdue/due-today tracking
   - "Needs attention" + "Team workload" dashboard panels
   - Weekly performance metrics (on-time %, avg. completion time, trend)
   - Global quick "+ Create job" button in the navbar
   - Customer sites (multiple locations per customer)
   - Customer industry/category tag + a redesigned card-grid Customers list to show it
   - Customer satisfaction rating (1–5, captured on job completion)
   - Persistent notifications (navbar bell, unread count)

   All 8 were built in one pass: new `Site` and `Notification` Prisma models, `Job.number`/`rating`/`siteId`, `Customer.industry`, three new dashboard panels, the notification bell + event-driven generation, and the navbar quick-create button. See §2's decisions log for the technical snags hit along the way (the non-interactive `prisma migrate dev` workaround, the Base UI `Select.Value` label bug, the Zod-checkbox-null bug, the Decimal/RSC-boundary bug, and the console-history/stale-tab false positives) — several of these were **real, previously-unnoticed bugs** in code from earlier in the session, only caught because this pass ended with careful end-to-end browser testing (actually submitting forms, not just eyeballing screenshots) rather than a routine build+lint check.
10. **Correctness review pass** ("check, refine and correct any errors"): a targeted code-review of the highest-risk code (server actions, dashboard calculations) rather than a mechanical whole-repo diff review (the repo has one initial-scaffold commit, so a literal "diff against history" would have covered nearly the entire app). Found and fixed three real, user-facing bugs, all confirmed live in the browser before and after the fix:
    - `isOverdue()` compared `dueDate` (always midnight) against the exact current timestamp, so a job due "today" showed as overdue for almost the whole day. Fixed with calendar-day comparison (`startOfDay()`).
    - Dashboard/reports completion metrics (on-time %, avg. completion time, completed-this-month/-week) read Prisma's auto-managed `updatedAt` as if it were "when the job was completed" — so rating a job via `setJobRating()` (which itself calls `db.job.update()`) silently reset that timestamp and corrupted every metric derived from it. Fixed by adding a dedicated `Job.completedAt` field owned only by `updateJobStatus`.
    - `assignEmployees()` promoted `PENDING → ASSIGNED` on first assignment but never reverted `ASSIGNED → PENDING` when the last employee was unassigned, leaving a job showing "Assigned" with an "Unassigned" employee list. Fixed with a symmetric revert branch.

    See §2's decisions log for the general lessons (don't reuse `updatedAt` as a domain timestamp; date-only fields need calendar-day comparisons, not raw timestamp comparisons).
11. **Second correctness review pass** ("review code and refine"): with the highest-risk code (server actions, dashboard math) already covered in pass 1, this pass read through the remaining pages, forms, and dialogs not yet reviewed (customers, employees, job detail, assign dialog, pricing card, command palette, notifications bell). Found and fixed two more real bugs, both confirmed live:
    - The job detail page's "Assign employees" picker only queried `active: true` employees, so deactivating someone who's still assigned to a job made them silently disappear from the picker — visible everywhere else as the assignee, but impossible to see or unassign from that dialog. Fixed by including currently-assigned employees regardless of active status.
    - `NotificationsBell` seeded its state from props via `useState(initialNotifications)`, which only reads the prop on first mount — new notifications generated after the bell first loaded never appeared without a full page reload. Fixed using React's documented "adjusting state when a prop changes" pattern (compare against a tracked previous-prop value, set state during render) rather than a `useEffect`, which trips the `react-hooks/set-state-in-effect` lint rule.

    See §2's decisions log for the general lessons (pickers scoped to "active" rows need to also include the already-selected value even if inactive; never seed local state from a prop that's expected to change post-mount).
12. **Fixed the recurring stale-session crash properly**: the user hit the exact `Notification_userId_fkey` crash (documented as a known dev-only annoyance since §2) live in their own browser and asked Claude to check the error. Rather than only re-explaining "sign out and back in," Claude fixed it at the root: `lib/auth.ts`'s `jwt` callback now verifies the token's user still exists (and is active) on every read, invalidating the session cleanly (redirect to `/login`) instead of letting a stale session reach a query that crashes. Verified by reproducing the exact scenario (log in, delete that user's row, reload) before and after the fix.

---

## 9. Known gaps / follow-ups (not yet built)

- **Customer-facing portal** — deferred by design, not started. Data model already supports it (a `Customer` doesn't currently have login credentials — would need either a `User` role addition or a separate customer-auth mechanism).
- **No dark-mode toggle** — `next-themes` is installed but unused; the app is single-theme (light body, permanently-dark navbar).
- **File attachments / photos on jobs** — mentioned as a possible next step, not built.
- **NextAuth session staleness** — see §2's decisions log; a background job or session-refresh strategy could fix this if it becomes a real annoyance, but it's low-priority for a demo/single-business tool.
- **VAT rate is a hardcoded constant**, not a settings-page value — fine for one UK business, would need to become configurable for any multi-tenant future.
- **`JOB_OVERDUE` notifications have no scheduler** — they're only generated when an admin's `getNotifications()` runs (i.e. on page load). An admin who never opens the app won't get overdue alerts in anything resembling real time. Fine for now; would need a real cron/queue (or at least a periodic server action) for genuine timeliness.
- **Notification bell has no pagination** — `getNotifications()` caps at the 20 most recent per user. Fine at demo scale, would need cursor-based loading for a busy real business.
- **Job rating is admin-set, not customer-submitted** — there's no customer-facing surface to leave a rating themselves yet (ties back to the deferred customer portal); today it's the admin recording a rating on the customer's behalf.
