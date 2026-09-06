# 36 — Pin spaces in sidebar

**Chunk:** 8 — Shell / navigation  
**Layer:** api + app  
**Domain:** spaces · shell · [PRODUCT-MODEL.md](../../../docs/PRODUCT-MODEL.md)  
**Status:** open  
**GitHub:** [#36](https://github.com/mateusmento/denser/issues/36)  
**Specs:** [CHUNKS.md](../CHUNKS.md) · [COVERAGE.md](../COVERAGE.md)

Product decisions from grilling session (2026-09-06).

---

## Summary

Let users **pin spaces to the sidebar** within a **root space** for persistent quick access — like **Direct messages**, but each pin is its **own sidebar section** listing that space's children (same as **In {space}**).

Also refactors **In {space}** and pinned sections to **share nav section components**, replaces **See all** gallery navigation with an **overflow dropdown**, adds per-section **Show** item limits, and wraps sidebar nav in **ScrollArea**.

---

## Model

| Concept | Behavior |
| --- | --- |
| **Pin** | Per-user preference: `userId` + `rootSpaceId` + `spaceId` + `pinnedAt` (order) |
| **Pinned section** | One `SidebarGroup` per pinned space — **not** a grouped "Pinned" list |
| **Section label** | `In ${space.title}` (same as contextual **In {space}**) |
| **Section content** | Child spaces + artifacts — **reuse same components** as **In {space}** |
| **Placement** | Below contextual **In {space}**, above **Direct messages** |
| **Order** | Most recently pinned section at **top** among pins |
| **Duplicate in tree** | Pinned space **remains** in its parent's normal **In {parent}** list |
| **Empty** | No pinned sections rendered when user has zero pins |
| **Access** | Pin only spaces user **can access** (public or private); cannot pin without access |
| **Cleanup** | Auto-remove pin when space **deleted** or user **loses access** |
| **Re-pin** | **Idempotent** — pin when already pinned is a **no-op** (no bump, no duplicate) |

---

## Pin / unpin UX

**Toggle** in space context menu and sidebar space rows:

- Not pinned → **Pin to sidebar**
- Pinned → **Unpin from sidebar**

**Pinned section label row** — ⋮ dropdown (right of label):

- **Show** → submenu: **5 / 7 / 15 / 30 / 50** items (current value + chevron); default **7**
- **Unpin from sidebar** → `confirm()` via `@/lib/dialog`

**In {space}** label row — ⋮ dropdown:

- **Show** submenu only (no Unpin)

Show limit is **per-user, per-section** (`spaceId`), server-persisted. Applies to pinned sections and contextual **In {space}**.

---

## See all overflow

Replace routing to space gallery on the **See all** row:

- **See all** row (or "See N more in …") opens a **dropdown to the right** listing overflow spaces + artifacts
- Shared for **In {space}** and pinned sections
- Refactor `truncateInSpaceNavItems` in `nav-section-items.ts` to return overflow items for dropdown instead of `seeAllLink.to` gallery route

---

## Sidebar scroll

Wrap `WorkspaceNav` content in **ScrollArea** — no cap on number of pinned sections.

---

## API (backend)

New preference storage (suggested — align with existing patterns):

**Pinned spaces**

- `GET /root-spaces/:rootSpaceId/sidebar-pins` — list pins with space summaries (filter inaccessible)
- `PUT /root-spaces/:rootSpaceId/sidebar-pins/:spaceId` — pin (idempotent no-op if exists)
- `DELETE /root-spaces/:rootSpaceId/sidebar-pins/:spaceId` — unpin

**Section display limits**

- `GET /root-spaces/:rootSpaceId/sidebar-section-preferences` — optional batch
- `PUT /root-spaces/:rootSpaceId/sidebar-section-preferences/:spaceId` — `{ itemLimit: 5|7|15|30|50 }`
- Default **7** when unset (`IN_SPACE_SIDEBAR_ITEM_LIMIT`)

Gate: `requireSpaceAccess(userId, rootSpaceId)`. Pin/unpin requires `canAccessSpace` / `requireArtifactAccess` equivalent for target space.

Purge pins when space deleted (cascade or job) and when membership revoked.

- [ ] Schema + migration for pin + section preference rows
- [ ] Contracts DTOs in `@denser/contracts`
- [ ] Pin CRUD with idempotent pin
- [ ] Section item-limit preference CRUD
- [ ] List endpoint resolves space children or defer to existing space detail APIs on app
- [ ] Integration tests: access gate, idempotent pin, auto-purge on delete

---

## App (frontend)

**Shared section component** (extract from `WorkspaceNav.vue` + `useWorkspaceNavSync`):

- [ ] `WorkspaceNavSpaceSection` (or similar) — label, ⋮ menu, items, See all dropdown
- [ ] Wired for **inSpaceSection** (contextual) and **pinnedSections[]**

**Pin wiring**

- [ ] `SpaceContextMenuContent` — Pin / Unpin toggle
- [ ] `WorkspaceNavMenuItem` space rows — Pin / Unpin in context menu
- [ ] `useWorkspaceNavSync` — fetch pins, build pinned section views (parallel queries per pin or batch)
- [ ] Pinned ⋮ — Show submenu + Unpin with `confirm()`

**Nav refactor**

- [ ] `ScrollArea` on sidebar content
- [ ] See all → overflow dropdown (remove gallery route from see-all row)
- [ ] Per-section Show limit from API preference

**Files (likely)**

- `packages/app/src/features/shell/presentationals/WorkspaceNav.vue`
- `packages/app/src/features/shell/composables/useWorkspaceNavSync.ts`
- `packages/app/src/features/shell/lib/nav-section-items.ts`
- `packages/app/src/features/shell/types.ts`
- `packages/app/src/modules/spaces/presentationals/SpaceContextMenuContent.vue`

- [ ] Storybook: pinned section, overflow dropdown, Show submenu
- [ ] Update shell/nav docs if present

**Must not touch:** DM list, drafts/scheduled outbox (#33).

---

## Suggested implementation order

1. API — pins + section preferences
2. Shared `WorkspaceNavSpaceSection` + See all dropdown refactor
3. Pin/unpin from context menus
4. Pinned sections in `useWorkspaceNavSync`
5. ScrollArea + polish

May split into `36a` API + `36b` app PRs if review size warrants it.

---

## PR

- [ ] `[shell 36] Pin spaces in sidebar` — [PR-POLICY.md](../PR-POLICY.md)
