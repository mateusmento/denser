# obvious.md — mateusmento/denser

Denser: workspace for nested spaces and typed artifacts. pnpm monorepo — Hono API + Vue SPA + shared contracts/design system.

## Stack

- **Runtime:** Node 24.18.0 (`.nvmrc`), pnpm 11.17.0 (`packageManager` field)
- **API:** `@denser/api` — Hono + Better Auth + Drizzle ORM + Socket.IO, tsx watch
- **App:** `@denser/app` — Vue 3 SPA + Vite 7, TanStack Query/DB, TipTap, Tailwind
- **DB:** PostgreSQL 16 (Compose: `postgres:16-alpine`, host port **5434**)
- **Contracts:** `@denser/contracts` — Zod schemas + branded IDs
- Realtime adapters default to in-memory/local; Redis optional (off by default).

## Commands

```bash
nvm use                 # or any Node 24.18.0
cp .env.example .env    # then adjust (see Env)
pnpm install
pnpm db:up              # docker compose up -d (Postgres on :5434)
pnpm db:migrate
pnpm seed               # users alice/bob/carol/david/emma/frank @local.dev, password = $SEED_PASSWORD (default "password")
pnpm dev                # api :3457 + app :5173 (parallel)
```

Verification: `pnpm lint` (ESLint + Stylelint), `pnpm typecheck`, `pnpm --filter @denser/api test` (node test runner), `pnpm test:e2e` (needs Docker — Testcontainers), `pnpm format:check` (oxfmt).

## Env (from `.env.example`)

Required locally: `DATABASE_URL` (default `postgresql://denser:denser@localhost:5434/denser`), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3457`, `APP_ORIGIN=http://localhost:5173`, `API_PORT=3457`, `SEED_PASSWORD`, `SEED_MODE=minimal`.
Optional: `BLOB_STORE_ADAPTER` (s3|r2; omit → NotImplemented stub), `AWS_*`/`R2_*` blob creds, `EPHEMERAL_STORE_ADAPTER`/`REALTIME_ADAPTER` (`memory`/`local` default), `REDIS_URL`, Google OAuth + SMTP placeholders.

## Ports

| Service | Port |
| --- | --- |
| API (`@denser/api`) | 3457 |
| App (Vite dev) | 5173 |
| Postgres | 5434 (host) → 5432 (container) |
| Storybook ds / app | 6006 / 6007 |

## Codebase map

See [codebase-map.md](./codebase-map.md). Domain glossary lives in `CONTEXT.md`; feature specs in `docs/`.

## API quick reference

`GET /api/health` → `{"ok":true}` · auth via Better Auth under `/api/auth/*` (`sign-in/email`, `get-session`) · `GET|PATCH /api/me` (session required; PATCH body `{timezone, timezoneSource?}`). All other domains mount from `packages/api/src/app.ts` via `routes.ts`.

## Local Verification Summary

Recorded 2026-10-09 during onboarding (sandbox snapshot `t4i447fptmx8fy0inhy3:default`).

- Postgres 16.15 up on :5434; migrate + seed OK (workspaces, channels, 244 messages seeded).
- `pnpm dev` → API listening on `http://localhost:3457`, Vite ready on `http://localhost:5173` (ports parsed from startup output).
- Primary flow verified: health check → `sign-in/email` with seeded user `alice@local.dev` (HTTP 200) → `get-session` (valid) → `PATCH /api/me` timezone write (HTTP 200, persisted).
- SPA renders the Sign in page (headless-Chrome screenshot captured; DOM contains username/password form).
- Pre-existing baseline on `main` (onboarding touched no source files): `pnpm lint` 52 errors (mostly unused imports); `pnpm typecheck` 1 error — `packages/api/src/domains/attachments/routes.ts(161,19)` TS2769; API unit tests 124/125 pass, 1 fail — "deleteMessage on one message keeps shared attachment join on another" (`src/domains/messages/integration.test.ts:235`).
- `pnpm test:e2e` not run — requires Docker (Testcontainers), unavailable in the onboarding sandbox. TODO(confirm) on a Docker-capable machine.

## Snapshot

- ID: `t4i447fptmx8fy0inhy3:default` · captured 2026-10-09T16:44:17.257Z
- State: Node 24.18.0 + pnpm 11.17.0 installed, Postgres 16 running on :5434 (systemd-less, via `pg_ctlcluster`), deps installed, DB migrated + seeded, dev servers running under tmux.

## Gotchas

- No Docker daemon in the snapshot: `pnpm db:up` is unavailable; Postgres runs natively (see skills/local-dev).
- `packages/app/public/theme-dev-override.json` and drizzle `meta/*` (except `_journal.json`) are gitignored generated files.
- Sandbox image ships `node_modules` root-owned: `sudo chown -R user:user node_modules` before `pnpm install`.
