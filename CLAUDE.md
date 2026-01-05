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
- **PostgreSQL** database via `pg` library
- **iron-session** for session management with encrypted cookies
- **bcryptjs** for password hashing

### Project Structure
The project uses Next.js App Router with path aliases:
- `@/*` maps to `src/*` (configured in tsconfig.json)

Key directories:
- `app/` - Pages and API routes (App Router)
- `app/api/` - API route handlers
- `app/components/` - Shared React components
- `app/subpages/` - Page-specific components
- `src/lib/` - Shared utilities (session, hooks)
- `src/db.ts` - PostgreSQL connection pool

### Database
PostgreSQL connection uses `DATABASE_URL` environment variable. The main user table is `personlogin` with fields: `id`, `username`, `hashed_passwort`, `admin`, `login_versuche`, `letzte_login_sperre`.

### Authentication
- Session managed via `iron-session` with `SESSION_SECRET` env var
- Session type defined in `src/lib/session.ts` (UserSession interface)
- Protected routes use layout-level auth checks (see `app/dashboard/layout.tsx`)
- Login has rate limiting: 3 attempts, then 5-minute lockout

### Production Deployment
- Uses `output: "standalone"` in next.config.ts
- Custom HTTPS server in `server.ts` with Let's Encrypt certs for kezar.at
- Production runs on port 443 via `node server.js`

## Environment Variables
Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for iron-session cookie encryption
