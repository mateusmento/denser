---
name: local-dev
description: How to bring denser up from zero in this sandbox (recorded during onboarding, 2026-10-09)
---

# local-dev

## Toolchain (exact versions)

- Node **24.18.0** per `.nvmrc`. Sandbox had only Node 20 → tarball install:
  `curl -fsSL https://nodejs.org/dist/v24.18.0/node-v24.18.0-linux-x64.tar.xz | tar -xJ -C ~/opt`, symlink `node`/`npm`/`npx`/`corepack` into `/usr/local/bin`.
- pnpm **11.17.0**: `sudo corepack enable` — resolved from `packageManager` on first `pnpm` run in the repo.
- **Postgres 16** (no Docker daemon in this sandbox; `pnpm db:up` cannot work here):
  1. `sudo apt-get install -y postgresql-16` from PGDG (`trixie-pgdg` repo).
  2. `sudo sed -i "s/^#\?port = .*/port = 5434/" /etc/postgresql/16/main/postgresql.conf` (matches `.env.example` port).
  3. `sudo pg_ctlcluster 16 main start` (no systemd in sandbox).
  4. `sudo -u postgres psql -c "CREATE USER denser WITH PASSWORD 'denser' SUPERUSER; CREATE DATABASE denser OWNER denser;"`

## Steps that worked

1. `cp .env.example .env` — then comment out `BLOB_STORE_ADAPTER` (no AWS creds locally; omission = NotImplemented stub by design). Everything else keeps example values.
2. `sudo chown -R user:user node_modules` — sandbox image ships it root-owned; plain `pnpm install` fails with EACCES otherwise.
3. `pnpm install` (~13s warm; `allowBuilds` already declared in `pnpm-workspace.yaml`).
4. `pnpm db:migrate` → "Migrations applied." then `pnpm seed` (creates workspaces/channels/244 messages/users).
5. `pnpm dev` under tmux → `packages/api dev: API listening on http://localhost:3457`, `packages/app dev: VITE ready` on `http://localhost:5173`.

## Verify (primary flow)

```bash
curl -s localhost:3457/api/health                    # {"ok":true}
curl -s -c /tmp/cj.txt -X POST localhost:3457/api/auth/sign-in/email \
  -H 'content-type: application/json' -H 'origin: http://localhost:5173' \
  -d '{"email":"alice@local.dev","password":"password"}'   # 200
curl -s -b /tmp/cj.txt localhost:3457/api/auth/get-session # valid session
curl -s -b /tmp/cj.txt -X PATCH localhost:3457/api/me \
  -H 'content-type: application/json' -H 'origin: http://localhost:5173' \
  -d '{"timezone":"America/Los_Angeles"}'                  # 200, persisted
```

Seeded users: `alice|bob|carol|david|emma|frank@local.dev`, password `password` (`SEED_PASSWORD`). Sign-in POST requires the `origin` header (Better Auth). `PATCH /api/me` takes `{timezone, timezoneSource?}` — anything else 500s (Zod parse, expected).

Headless browser (optional): Chrome at `~/.local/share/choreographer/deps/chrome-linux64/chrome` — needs `sudo apt-get install -y libnspr4 libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2`; then `--headless=new --no-sandbox --screenshot`.

## Pre-existing failures on main (do not chase during setup)

- `pnpm lint`: 52 errors (mostly unused imports).
- `pnpm typecheck`: 1 error — `packages/api/src/domains/attachments/routes.ts(161,19)` TS2769.
- `pnpm --filter @denser/api test`: 124/125 pass; 1 fail — "deleteMessage on one message keeps shared attachment join on another" (`src/domains/messages/integration.test.ts:235`).
- `pnpm test:e2e`: requires Docker (Testcontainers) — skip in this sandbox.

## Cleanup / notes

- `bun.lock` is an untracked leftover from the image — never commit it.
- Postgres data: `/var/lib/postgresql/16/main`; logs: `/var/log/postgresql/postgresql-16-main.log`.
