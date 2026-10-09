# Codebase map — denser

pnpm workspace (`packages/*`). Depth-2 overview; depth cap respected. Domain glossary: `CONTEXT.md`.

| Path | What it is |
| --- | --- |
| `packages/contracts/` | `@denser/contracts` — Zod schemas + branded IDs shared by API/app (`src/{attachment,auth,domain,ephemeral}.ts`) |
| `packages/api-client/` | `@denser/api-client` — typed HTTP + Socket.IO client (`src/{http,socket}.ts`) |
| `packages/api/` | `@denser/api` — Hono server (`src/app.ts` mounts domains; `src/auth`, `src/db` (drizzle + migrations + seed), `src/domains/*`, `src/realtime`, `src/ports`) |
| `packages/app/` | `@denser/app` — Vue 3 SPA (`src/router.ts`, `src/features`, `src/modules`, `src/views`; Storybook :6007) |
| `packages/design-system/` | `@denser/design-system` — shadcn-vue kit + Tailwind theme (Storybook :6006) |
| `packages/e2e/` | `@denser/e2e` — Playwright smoke over the API using Testcontainers (needs Docker) |
| `docs/` | Domain specs (planning, scheduling, conversations, workflow…), ADRs, UI surfaces |
| `CONTEXT.md` | Ubiquitous language — Space/Workspace/Artifact/Board/etc. |
| `.cursor/` | Cursor rules (design-system primitives, storybook placement) + agent skills |
| `.scratch/` | Local effort trackers for agent-parallel work (not domain specs) |

Key wiring: `app` → `api-client` → `api` (`/api`), with `contracts` as the shared type surface; `design-system` feeds `app`.
