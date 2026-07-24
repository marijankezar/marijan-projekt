# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start dev server on port 4004 with Turbopack
npm run build        # Build for production (linting disabled)
npm run start        # Start production server (runs server.js for HTTPS)
npm run lint         # Run ESLint
npm test             # Run Vitest (currently: src/lib/regatta-{geo,results}.test.ts only)
```

## Architecture

### Tech Stack
- **Next.js 15.3** with App Router (React 19)
- **Tailwind CSS 4** for styling
- **PostgreSQL** via `pg` library — three separate connection pools
- **iron-session** for session management with encrypted cookies
- **bcryptjs** for password hashing

### Multiple Databases

Five separate PostgreSQL pools, each with its own env var:

| Pool file | Env var | Used by |
|-----------|---------|---------|
| `src/db.ts` | `DATABASE_URL` | dashboard, CRM (`/crm/`), gold (auth only) |
| `src/db-timebook.ts` | `TIMEBOOK_DATABASE_URL` | `/timebook/` and `/api/timebook/` |
| `src/db-songs.ts` | `SONGS_DATABASE_URL` | `/songs/` |
| `src/db-worktime.ts` | `WORKTIME_DATABASE_URL` | `/worktime/` and `/api/worktime/` (own DB `db_worktime`) |
| `src/db-regatta.ts` | `REGATTA_DATABASE_URL` | `/regatta/` and `/api/regatta/` (own DB `db_regatta`) |

SQL schema files are in `sql/` — run against the appropriate database when creating new tables.

### App Sections

Each section is a self-contained area with its own layout (auth check + nav) and API routes:

- **`/dashboard`** — Stundenverwaltung (time/hours tracking), uses `db.ts` + `Stundenbuchungen` table
- **`/crm`** — Freelancer CRM (Kunden, Projekte, Aufgaben), uses `db.ts` + `crm_*` tables
- **`/timebook`** — Full time-tracking app with clients, invoices, categories; uses `db-timebook.ts`
- **`/worktime`** — Multi-company time & task tracking (employee/supervisor/admin roles), uses `db-worktime.ts`. Own iron-session cookie `wt_session` (`src/lib/worktime-session.ts`, 60min TTL). Client-side layout (`'use client'`, fetches `/api/worktime/auth/me`) instead of the server-side auth-check pattern used elsewhere. i18n via `src/lib/worktime-i18n.ts` (DE/EN/IT, `localStorage` key `wt_lang`).
- **`/regatta`** — Full regatta management (not just tracking): events, crew registration, boat-class/yardstick scoring, finish-line crossing detection, results, public live view, admin. Uses `db-regatta.ts`. Own iron-session cookie `regatta_session` (`src/lib/regatta-session.ts`, 8h TTL). Realtime position updates via server-side `EventEmitter` singleton (`src/lib/regatta-broadcast.ts`, survives Turbopack HMR through `globalThis`) pushed to clients over SSE — no polling.
  - **Ad-hoc tracking (legacy, still works)**: `/regatta/tracking` + `/regatta/crew` (admin roster), `track_session` per `person`, one active session per person via partial unique index, `/api/regatta/live` (protected SSE, admin sees all / user sees own).
  - **Event model (added 2026-07)**: `event` (status planned/active/ended, `gps_interval_seconds`), `boat_class` (yardstick), `entry` (boat+skipper meldung per event, unique `(event_id, start_number)`), `entry_crew` (up to 4 crew, no login, plain roster data), `finish_line` (1 per event, point A→B **quer zum Kurs**, not the direction of travel — see doc comment in `detectFinishCrossing`), `finish_time`. `track_session.entry_id` (nullable) links ad-hoc tracking to the event model — additive, non-breaking.
  - **Public routes (no login)**: `/regatta/events` (browse), `/regatta/events/[id]/register` (skipper account + boat + crew, transactional), `/regatta/events/[id]/live` (public SSE-driven map + live ranking), `/regatta/events/[id]/results` (yardstick + realtime sortable table).
  - **Admin routes**: `/regatta/admin` hub → events / boat-classes CRUD, `/regatta/admin/events/[id]/finish-line` (map click-to-place + numeric input, red direction arrow shows the accepted crossing side), `/regatta/admin/events/[id]/entries` (meldeliste).
  - **Finish detection**: runs inside `POST /api/regatta/gps` using the in-memory `activeSessionSnapshots` as the "previous point" (no extra DB query in the hot path). Pure geometry in `src/lib/regatta-geo.ts` (`detectFinishCrossing`, segment-intersection + direction check), yardstick math in `src/lib/regatta-results.ts` (`computeResults`/`sortResults`) — both unit-tested with Vitest (`npm test`), the only test suite in this repo.
  - SQL: `sql/regatta_setup.sql` (base) + `sql/regatta_v2_events.sql` (event model, additive).
- **`/gold`** — Gold price chart + forecast (`/api/gold/chart`, `/api/gold/prognose`). Auth via the shared `getSession()` (main `db.ts`/`personlogin`), not a separate session. Forecast is computed locally from technical indicators (RSI, MACD, SMA, Bollinger Bands) pulled from Yahoo Finance — no LLM call involved despite appearances.
- **`/songs`, `/fitness`, `/termine`, `/birthday`** — Standalone feature pages

### Authentication

- Main session via `iron-session` (`SESSION_SECRET` env var), defined in `src/lib/session.ts` — shared by dashboard, CRM, timebook, gold
- Protected layouts call `getSession()` server-side and `redirect('/login')` if no user
- Login rate limiting: 3 attempts → 5-minute lockout (tracked in `personlogin` table)
- `personlogin` is the shared user table for `dashboard`, `timebook`, and `gold` sections
- `worktime` and `regatta` each have their own independent iron-session cookie, session lib, and user table — do not mix them up with the main session

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
DATABASE_URL          # Main PostgreSQL DB (dashboard, CRM, gold auth)
TIMEBOOK_DATABASE_URL # Timebook PostgreSQL DB
SONGS_DATABASE_URL    # Songs PostgreSQL DB
WORKTIME_DATABASE_URL # Worktime PostgreSQL DB (db_worktime)
REGATTA_DATABASE_URL  # Regatta PostgreSQL DB (db_regatta)
SESSION_SECRET        # iron-session encryption key (shared by main session; worktime/regatta reuse it for their own cookies)
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD  # GMX SMTP for password-reset emails
APP_URL                # Base URL used in outgoing links (e.g. password-reset emails)
```
