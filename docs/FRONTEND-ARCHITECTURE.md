# Frontend Architecture Decisions

Portable architecture for Denser. **Package layout and client state follow** [`.cursor/skills/frontend-patterns`](.cursor/skills/frontend-patterns/SKILL.md). Proven stack patterns (Hono, Better Auth, Drizzle, Socket.IO, Testcontainers e2e, hybrid seed) come from the [`frontend-architecture`](../frontend-architecture) demo ADRs. Product UI inventories: [UI-SURFACES.md](./UI-SURFACES.md); domain feature contracts: [FEATURE-SPECS.md](./FEATURE-SPECS.md); look-and-feel: [VISUAL-LANGUAGE.md](./VISUAL-LANGUAGE.md).

---

## 1. Monorepo packages

pnpm workspaces (`packages/*`). Node **v24.18.0** (`.nvmrc`). No Turborepo.

| Package | Owns |
| --- | --- |
| `@denser/contracts` | Zod schemas + branded IDs (API/backend-shared wire vocabulary) |
| `@denser/api-client` | Typed HTTP + Socket.IO over `contracts` — Vue must not own `io()` |
| `@denser/design-system` | Domain-agnostic UI: **shadcn-vue full kit**, tokens, Storybook (primitives, port 6006) |
| `@denser/api` | Hono, Better Auth, Drizzle/Postgres, Socket.IO, migrate/seed |
| `@denser/app` | Vue SPA: features / modules / views / lib; Storybook for presentationals (port 6007) |
| `@denser/e2e` | Vitest + Testcontainers API harness |

**Dependency rules:** `api-client` → `contracts`; `contracts` must not depend on app/api-client; app prefers `api-client` over ad-hoc `fetch`; app must not duplicate shadcn under `components/ui`.

---

## 2. Stack locks

- **Vue 3** + Vite + Vue Router + Tailwind 4
- **TanStack Query** — transport for synchronized server data
- **TanStack DB** — canonical client entity replica under sync pressure (stub wired in app; grow with multi-entity features)
- **No Pinia** — ephemeral UI in component state, URL, or VueUse `createGlobalState` / `createSharedComposable`
- **Hono** + Zod at request edges; **Drizzle** + **Postgres** (Docker Compose port **5434**)
- **Better Auth** username/password credentials + database session cookies
- **Socket.IO** for realtime ingest; `api-client` owns the connection
- API default port **3457**; app **5173** with Vite proxy for `/api` and `/socket.io`

---

## 3. Client data ownership

| Kind | Home |
| --- | --- |
| Server transport / list windows | TanStack Query |
| Canonical domain entities | TanStack DB (when normalize pressure applies) |
| Ephemeral UI | Component / UI·local composable |
| Bookmarkable location | URL |
| App shell singleton UI | VueUse `createGlobalState` |
| Wire types | Zod in `@denser/contracts` |

Exactly one owner per fact. Realtime is another **ingest** into the same canonical replica (prefer DB apply), not a third store. Optimistic updates must not skip version/409 gates when concurrency applies.

---

## 4. App folder layout (frontend-patterns)

```text
packages/app/src/
  features/<feature>/containers|presentationals|stories|composables
  modules/<domain>/presentationals|stories|composables   # reusable; no containers
  views/                                          # thin routes
  lib/                                            # pure helpers, async view-models, db stub
```

Containers wire sync → presentationals (no chrome of their own). Presentationals are Storybookable without MSW/API/sync. Story files live in the feature/module **`stories/`** sibling folder (not inside `presentationals/`).
---

## 5. Dual Storybook

| Package | Port | Catalog |
| --- | --- | --- |
| `design-system` | 6006 | shadcn primitives |
| `app` | 6007 | feature/module presentationals only |

Root scripts: `pnpm storybook:design-system`, `pnpm storybook:app`.

---

## 6. Auth, realtime, concurrency (kept from FA ADRs)

- Session at API edge; cookie credentials on HTTP and sockets
- On connect: join personal `user:{id}` room (expand rooms with product needs)
- Collaborative entities: whole-entity `version`; PATCH **409** → merge pending → retry
- Lists: prefer cursor sliding windows + stable sorts when live lists land

---

## 7. Seed and e2e

- Hybrid seed: hero JSON + faker (fixed seed); `SEED_MODE=minimal|full`
- E2e: Testcontainers Postgres → migrate → seed → spawn API → cookie-jar `api-client`
- Day-one smoke: health + sign-in/session

---

## 8. Deferred

- Artifact/Space/View product surfaces
- Extracting store packages until pressure exists
- Deployments
