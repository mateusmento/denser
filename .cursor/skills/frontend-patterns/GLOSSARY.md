# Glossary

Shared terms for [`frontend-patterns`](SKILL.md). Load when a rule points here or when a heading below appears outside its home reference.

## View-model slice

A **typed object that groups related values for one UI section (or one call site)**, instead of a flat dump of sibling fields.

Applies wherever the same smell shows up:

- **Component props** — `pr: GithubPrView` instead of eight flat PR fields
- **Function parameters** — one options/context object instead of a long positional/flag list for one concern
- **Separate state refs** — one structured ref/reactive object instead of many parallel `ref`s for the same section

Group by **UI section / consumer concern**, not by API wire shape. Prefer **shared async view-model families** for repeated clusters (today: `AsyncDataView`, `PaginatedListView`, `AsyncMutationState`, … — **evolve** in `lib` when bidirectional/sliding windows need `hasNext`/`hasPrev` and `loadingNext`/`loadingPrev`, and must not fake forward-only `hasMore`). **Commands stay outside the slice** (events/callbacks) — do not embed `@search` / `@load-next` into the view-model.

See [`references/async-ux.md`](references/async-ux.md).

_Avoid_: god view-model (whole screen in one type), stuffing unrelated sections into one object, treating a drill-through bag the component does not render as a view-model (that is [`forwarding-props`](rules/forwarding-props.md) drill fuel)

## Source of truth (SoT)

The system **authoritative for the canonical value**. For synchronized domain data, usually the **backend**; the client cache is a replica. Full notes: [`references/presentational-container.md`](references/presentational-container.md).

## Synchronized state

Client-held data kept **coherent with an external SoT** (fetch/subscribe, cache, stale, refresh; invalidate or optimistic update after commands). Family resemblance — not every mechanism required. Not UI-local state or ambient-port reads. Full contract: [`references/presentational-container.md`](references/presentational-container.md).

## Ambient port

Adapter-backed composable for ambient identity/context (e.g. `useAuthUser`, `useCurrentWorkspace`) with **no** sync on the presentational path. App and Storybook bind different adapters. See [`references/presentational-container.md`](references/presentational-container.md).

## Presentational / Container

Layer split: presentational owns markup and controllable UI; container wires synchronized SoT into presentationals with no chrome of its own. See [`references/presentational-container.md`](references/presentational-container.md).

## Composable

Named function encapsulating a cohesive reactive state/behavior slice for a feature boundary — not an SFC. Buckets, sharing, Query/DB, schemas: [`references/composables.md`](references/composables.md).

## Sync composable

Composable in the **Sync** bucket: keeps client data coherent with an external SoT; may call network/Query/DB; **containers only** (not presentationals). Exposes **queries and commands**. See [`references/composables.md`](references/composables.md).

## State ownership

Exactly one authority for a piece of state’s canonical value. Typical owners: backend, URL, browser (UI), user preferences. See [`references/state-management.md`](references/state-management.md).

## Canonical / projection

**Canonical** — persisted/synced replica of SoT facts. **Projection** — derived view for a screen; prefer compute over persist. See [`references/state-management.md`](references/state-management.md).

## Consistency need

Product decision for how fresh a representation must stay: immediate (strong), briefly stale OK (eventual), or only when revisited (lazy). Stated before picking sync. See [`references/state-management.md`](references/state-management.md).

## Pressure

Architectural complexity that justifies the next stage (e.g. sync fan-out → normalize). Do not skip stages for taste. See [`references/state-management.md`](references/state-management.md).

## Normalize / TanStack DB

Entity-oriented **canonical client replica** of domain entities and relationships. Introduce under **pressure** (or denser’s early multi-entity default). See [`references/state-management.md`](references/state-management.md), [`rules/normalization-pressure.md`](rules/normalization-pressure.md).

## Feature / module vertical slices

**Feature** — product/route vertical slice (owns containers; may hold private colocated infra). **Module** — reusable domain presentationals + composables (no containers; multi-consumer). Features **compose**; modules **reuse**. See [`references/folder-structure.md`](references/folder-structure.md).

## Reusability promotion

Move a **colocated** artifact into a **shared reusable home** when a second consumer (or shared reason-to-change / cross-boundary import urge) appears — not because it “feels cleaner.” Destinations include `modules/`, `lib/` / `lib/types`, **`design-system`**, **`contracts`**, **`api-client`**. Containers never promote into modules. See [`references/folder-structure.md`](references/folder-structure.md).

## Version / 409 merge-retry

Whole-entity monotonic `version` on PATCH; on conflict, merge pending fields into the server snapshot and retry. Same-field conflicts need UX or explicit overwrite. See [`references/conflict-version.md`](references/conflict-version.md).
