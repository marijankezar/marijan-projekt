# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start dev server on port 4004 with Turbopack
npm run build        # Build for production (linting disabled)
npm run start        # Start production server (runs server.js for HTTPS)
npm run lint         # Run ESLint
```

## Architecture

### Tech Stack
- **Next.js 15.3** with App Router (React 19)
- **Tailwind CSS 4** for styling
- **PostgreSQL** via `pg` library — three separate connection pools
- **iron-session** for session management with encrypted cookies
- **bcryptjs** for password hashing

### Multiple Databases

Three separate PostgreSQL pools, each with its own env var:

| Pool file | Env var | Used by |
|-----------|---------|---------|
| `src/db.ts` | `DATABASE_URL` | dashboard, CRM (`/crm/`) |
| `src/db-timebook.ts` | `TIMEBOOK_DATABASE_URL` | `/timebook/` and `/api/timebook/` |
| `src/db-songs.ts` | `SONGS_DATABASE_URL` | `/songs/` |

SQL schema files are in `sql/` — run against the appropriate database when creating new tables.

### App Sections

Each section is a self-contained area with its own layout (auth check + nav) and API routes:

- **`/dashboard`** — Stundenverwaltung (time/hours tracking), uses `db.ts` + `Stundenbuchungen` table
- **`/crm`** — Freelancer CRM (Kunden, Projekte, Aufgaben), uses `db.ts` + `crm_*` tables
- **`/timebook`** — Full time-tracking app with clients, invoices, categories; uses `db-timebook.ts`
- **`/songs`, `/fitness`, `/termine`, `/birthday`** — Standalone feature pages

### Authentication

- Session via `iron-session` (`SESSION_SECRET` env var), defined in `src/lib/session.ts`
- Protected layouts call `getSession()` server-side and `redirect('/login')` if no user
- Login rate limiting: 3 attempts → 5-minute lockout (tracked in `personlogin` table)
- `personlogin` is the shared user table for both `dashboard` and `timebook` sections

### API Route Conventions

Every API route must have these two exports:
```typescript
export const runtime = 'nodejs';   // required for pg driver
export const dynamic = 'force-dynamic';  // no caching
```

Auth check pattern:
```typescript
const session = await getSession();
if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
```

Always filter DB queries by `session.user.id` (column is `user_id` or `id_person` depending on table).

### Dynamic Route Params (Next.js 15)

`params` is a Promise in Next.js 15 — always await it:
```typescript
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

In client components use the `use()` hook:
```typescript
const { id } = use(params);
```

### Design System

- Color theme per section: indigo/purple for dashboard, violet/indigo for CRM
- Cards: `bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm`
- Inputs: `px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`
- Primary buttons: `rounded-xl bg-gradient-to-r from-X-500 to-Y-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all`
- All components must include `dark:` variants
- Icons exclusively from `lucide-react`

### Path Aliases

`@/*` maps to `src/*` (tsconfig.json). So `import pool from '@/db'` → `src/db.ts`.

### Production Deployment

- `output: "standalone"` in next.config.ts
- Custom HTTPS server in `server.ts` with Let's Encrypt certs for kezar.at
- Production runs on port 443 via `node server.js`

## Environment Variables

```
DATABASE_URL          # Main PostgreSQL DB (dashboard, CRM)
TIMEBOOK_DATABASE_URL # Timebook PostgreSQL DB
SONGS_DATABASE_URL    # Songs PostgreSQL DB
SESSION_SECRET        # iron-session encryption key
```
