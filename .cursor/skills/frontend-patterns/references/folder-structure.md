---
title: Folder structure
impact: MEDIUM
description: >-
  Feature vs module vertical slices, reusability promotion, types homes, packages, zero module→module.
tags: [folders, feature, module, promotion, packages]
---

# Folder structure

Feature vertical slices vs reusable domain modules. Layer behavior (P/C, composables): [`presentational-container.md`](presentational-container.md), [`composables.md`](composables.md). Packages: **`design-system`**, **`contracts`**, **`api-client`**.

Leading words: **feature**, **module**, **reusability promotion**.

---

## Semantics

| Kind | Meaning |
| --- | --- |
| **Feature** | A **product / route vertical slice**. Owns **containers** (composition roots) and may hold **feature-local** (colocated) presentationals and composables until **reusability promotion**. Depends on **modules**, `lib/`, and packages — or keeps infra private when only this feature needs it. |
| **Module** | A **reusable domain capability** used from **more than one place** (multiple features). Holds presentationals + composables for that domain. **Not** a route; **no containers**. |

Features **compose**; modules **reuse**.

---

## Tree

```text
packages/
  design-system/          # domain-agnostic UI
  contracts/              # Zod + API/backend-shared vocabulary (wire SoT types)
  api-client/             # HTTP clients / request mappers over contracts → domain call shapes

app/   # or src/ — names flexible
  features/<feature>/
    containers/           # all containers live here
    presentationals/      # optional — feature-only UI
    stories/              # sibling — presentational Storybook (*.stories.vue); not inside presentationals/
    composables/          # optional — feature-only until reusability promotion
  modules/<domain>/
    presentationals/
    stories/              # sibling — same Storybook rule as features
    composables/
    index.ts              # public barrel — only import surface from outside
  views/                  # routes; thin → feature containers
  lib/                    # cross-cutting pure helpers + shared async view-models
    types/                # optional — types reused across features/modules/views
```

Story files are **not** colocated next to presentational SFCs. They live in the feature/module **`stories/`** sibling folder and import from `../presentationals/`. Prefer Vue CSF (`*.stories.vue` / `sb-addon-vue-csf`) in `@denser/app`.
---

## Types (where they live)

**Not everything belongs in `contracts`.** Colocate by use; apply **reusability promotion** on reuse pressure (same rule as code).

| Kind | Home |
| --- | --- |
| API / backend-shared vocabulary (Zod + `z.infer`) | **`contracts` package** |
| Types owned by one composable / small cluster | **Colocate** — same file as the composable, or sibling `*.types.ts` / `types.ts` next to it when many types |
| Types reused across features, modules, and/or views | app **`lib/types`** (or `lib/<area>/` with the helpers) |
| Presentational-only view-models | Colocate with the presentational (or feature/module until shared) |

Infer wire types from Zod in `contracts`. Do not redefine parallel interfaces that drift ([`ad-hoc-domain-types`](../rules/ad-hoc-domain-types.md)).

---

## Packages

| Package | Role |
| --- | --- |
| **`contracts`** | Zod schemas + inferred types for API/backend-shared domain vocabulary |
| **`api-client`** | Exports **domain-facing request/response helpers** that map to HTTP using `contracts` — call shapes sync composables use; not Vue SFCs |
| **`design-system`** | Domain-agnostic UI |

`api-client` depends on `contracts`. App modules/features depend on `api-client` + `contracts` as needed — prefer talking to the API through **`api-client`**, not ad-hoc `fetch` in composables.

---

## Dependency rules

| From → To | Allowed |
| --- | --- |
| Feature → modules (barrel), `lib/`, packages | Yes |
| Feature → another feature’s internals | **No** — **reusability promotion** or compose via shared module/`lib` |
| Module → `lib/`, packages | Yes |
| Module → another module | **No** (zero module→module) |
| Module → feature | **No** |
| Module → containers | N/A — modules have none |
| `api-client` → `contracts` | Yes |
| `contracts` → app / `api-client` | **No** |

If two modules need the same code: extract to **`lib/`** or a **third module**; let **features** compose both modules.

---

## Containers

Containers are **feature slices**: they wire composables to presentationals, may **compose several modules**, and own **composition** (slots, compounds from modules). They are **not** required to be 1:1 with a single presentational.

Still follow presentational/container chrome rules: prefer composing module presentationals over owning layout styling in the container ([`presentational-container.md`](presentational-container.md), [`container-owns-markup`](../rules/container-owns-markup.md)).

---

## Layouts / app chrome

A **layout** is a **structural shell with section slots** (nav / main / aside, …) that defines regions of a screen. Collapse, section view-switch, etc. are **UI·local** behavior on that shell — not a separate top-level folder type.

| Case | Home |
| --- | --- |
| Dumb region shell (slots + optional UI·local chrome behavior) | **Presentational** — feature-local until **reusability promotion**; or design-system if fully domain-agnostic |
| App chrome that **composes several modules** (e.g. sidebar listing teams, projects, channels) | A **feature** (e.g. `features/shell` / `features/workspace-frame`) — containers fill layout slots with module pieces |
| Used by only one product area | Stay under that **feature** |

**No** dedicated app `layouts/` tree — it becomes a junk drawer. Prefer **feature** for chrome that spans modules, **presentational** for pure regional structure.

---

## Reusability promotion

**Default:** new artifacts start **colocated** with their first consumer (feature-local presentational/composable/type/helper, or next to a single module use).

**Promote when** any of:

1. **Second consumer** — another feature, module, or package needs it for real  
2. **Same reason to change** — two copies would churn together  
3. **Cross-boundary import urge** — about to deep-import another feature’s private files, or couple modules → promote instead  

**Do not promote** for a single consumer or aesthetic architecture.

| Colocated artifact | Reusable home |
| --- | --- |
| Domain UI / compounds | `modules/<domain>/presentationals/` |
| Sync or UI·local composable (multi-feature) | `modules/<domain>/composables/` |
| Pure helper / shared async view-model | app `lib/` |
| Types reused across features/modules/views | app `lib/types` (or area under `lib/`) |
| Domain-agnostic UI | **`design-system`** package |
| API/backend Zod + types | **`contracts`** package |
| HTTP mapping / domain request objects | **`api-client`** package |

Move code; export from the module **barrel** or package public API; point consumers at that surface; remove the old colocated copy (no permanent shim). **Containers never promote into modules.**

Same pressure test applies whether the artifact started in a feature, a module, or beside a single call site.

---

## Smells (in-reference)

| Smell | Meaning |
| --- | --- |
| Cross-feature deep import | Importing another feature’s private files instead of **reusability promotion** |
| Module→module import | Mesh between modules; extract to `lib/` or a third module |
| Container in a module | Containers are feature composition roots only |
| Premature promotion | Shared home with a single consumer “for reuse later” |
| Types dumped in `contracts` | Frontend-only / composable-local types in the wire package |
| Ad-hoc fetch in composables | Bypassing `api-client` for the same HTTP surface |
| `layouts/` junk drawer | Top-level layouts folder instead of feature chrome / presentational shells |
| Stories inside `presentationals/` | Storybook files must live in the sibling `stories/` folder |

---

## Related

| Topic | Where |
| --- | --- |
| P/C, Storybook | [`presentational-container.md`](presentational-container.md) |
| Composable buckets / Query/DB | [`composables.md`](composables.md) |
| God store / ownership homes | [`state-management.md`](state-management.md) |
| Ad-hoc domain types | [`../rules/ad-hoc-domain-types.md`](../rules/ad-hoc-domain-types.md) |
