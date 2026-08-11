---
title: Coding style
impact: LOW
description: >-
  FP vs procedural, Remeda vs native, VueUse for browser/DOM idioms, Pick/Omit
  projections, ReadonlyRefOrGetter params and toReadonlyRef.
tags: [typescript, fp, style, vueuse, readonly-ref]
---

# Coding style

TypeScript / Vue implementation habits for denser-style apps. Architecture seams stay in other references; this file owns **how code is written** at the leaves.

Leading words: **pure**, **reuse**, **native-first**, **vueuse**, **project**, **readonly-surface**.

Aligns with engineering principles: small pure pieces, compose upward, isolate side effects at boundaries.

---

## Prefer functional over procedural

- Prefer **pure functions** and **immutable updates** where practical.
- Isolate **side effects** (I/O, time, randomness, DOM) at boundaries — composable commands, adapters, containers.
- Prefer **expressions and pipelines** (`map` / `filter` / `reduce`, early returns, small helpers) over long mutable step-by-step blocks unless the domain truly needs a state machine.
- Keep Vue `setup` thin: behavior in named composables / pure helpers; SFCs compose.

Procedural loops and local mutation are fine when they are clearer than a forced pipeline (tight algorithms, performance-critical hot paths) — default still leans functional.

---

## Prefer reuse over reimplementing

Before writing a new algorithm or browser/DOM helper:

1. Check **stdlib / modern ECMAScript** (below).
2. Check **[VueUse](https://vueuse.org/)** for reactive browser / DOM / permission / media / storage idioms (below).
3. Check **Remeda** (or existing app/`lib` helpers) for data transforms.
4. Check **already-owned domain helpers** in the feature/module.

Reimplement only when no fit exists, or when a thin wrapper clarifies domain vocabulary. Duplicate near-identical transforms → extract once (SRP: same reason to change).

---

## Remeda vs native ECMAScript

**Remeda is allowed.** Prefer **modern native** APIs when they are equivalent in clarity and coverage:

| Prefer native when… | Prefer Remeda when… |
| --- | --- |
| `map` / `filter` / `find` / `flatMap` / `Object.groupBy` / `structuredClone` / etc. suffice | Pipe-friendly composition, nullish-safe helpers, or a transform native APIs do not express cleanly |
| One-liner is obvious without imports | Chaining would otherwise nest awkwardly |

Do not pull Remeda for what `Array.prototype` already does well. Do not reimplement Remeda’s non-trivial helpers by hand.

---

## VueUse (preferred for browser / DOM → Vue)

**VueUse is a denser default** for turning imperative browser APIs into reactive Vue idioms. Prefer it over hand-rolled `addEventListener` / `URL.createObjectURL` / `localStorage` / `ResizeObserver` / permission prompts / media element wiring when a VueUse composable already covers the concern.

Why: lifecycle-safe subscribe/teardown, SSR-aware guards, consistent `Ref` / getter surfaces, and fewer one-off bugs (leaked listeners, unrevoked object URLs, missed disconnects).

### Prefer VueUse when the problem is…

| Concern | Reach for (examples) |
| --- | --- |
| Persist UI prefs / drafts locally | `useStorage`, `useLocalStorage`, `useSessionStorage` |
| Blob / file preview URLs | `useObjectUrl` (create + revoke with lifecycle) |
| Pointer / drag interactions | `useDraggable`, `useMouseInElement`, `usePointer` |
| Media element control | `useMediaControls` |
| Browser permissions | `usePermission`, `useDevicesList` |
| Visibility / layout observation | `useIntersectionObserver`, `useResizeObserver`, `useElementSize`, `useElementBounding` |
| Motion / reduced-motion | `useMotion` / motion helpers; respect `usePreferredReducedMotion` where relevant |
| Shared instance lifetime | `createSharedComposable`, `createGlobalState` — see [`composables.md`](composables.md) |

Scan [VueUse functions](https://vueuse.org/functions.html) before inventing a `useX` that only wraps a DOM API.

### How it fits the stack

| Layer | VueUse role |
| --- | --- |
| **UI / local composables** | Primary home — browser chrome, editors, staging previews, observers |
| **Presentationals** | May call VueUse for local UI (size, hover-in-element, object URL) — still **no** network SoT sync |
| **Sync composables** | May use sharing helpers (`createSharedComposable`); do **not** replace Query/DB/entity sync with `useStorage` as the server SoT |

`useStorage` is for **browser-owned** state (prefs, offline mirrors). Server-owned entities still go through sync composables + Query/DB ([`state-management.md`](state-management.md)). A local draft mirror beside a versioned server draft is fine when ownership is explicit (dual-write) — VueUse can own the local half.

### When not VueUse

- Pure data transforms → native / Remeda / `lib` (no DOM).
- Domain SoT sync, HTTP, sockets → sync stack ([`composables.md`](composables.md)), not a VueUse substitute.
- Product-specific gesture/DnD that VueUse cannot express — then a focused lib (e.g. dnd-kit) or a thin custom composable; still prefer VueUse for the boring adjacent pieces (resize, object URL, permissions).

Hand-rolling what VueUse already provides is a **smell** (below), not a taste call.

---

## Projection types: `Pick` / `Omit` (and kin)

Derive view / API / DTO **projections** from existing types — do not redefine parallel interfaces that drift.

```ts
type IssueRow = Pick<Issue, "id" | "title" | "version">;
type IssuePatch = Omit<Issue, "id" | "createdAt">;
```

Also useful: `Partial`, `Required`, `Readonly`, `Record`, mapped types. Prefer **named aliases** at the call site over inline `Pick<…>` soup when the projection is reused.

Wire/API vocabulary still comes from Zod/`contracts` ([`composables.md`](composables.md)); frontend projections live next to use or in `lib/types` on **reusability promotion** ([`folder-structure.md`](folder-structure.md)).

---

## Composable parameters: `ReadonlyRef` / `ReadonlyRefOrGetter`

Define shared aliases (e.g. in app `lib` / Vue utilities). Use them for **composable parameters** that are only read:

```ts
import { toRef, type Ref } from "vue";

/** Readable reactive cell — the composable must not assign `.value`. */
export type ReadonlyRef<T> = Readonly<Ref<T>>;

/** Parameter the composable only reads: readonly ref or getter. */
export type ReadonlyRefOrGetter<T> = ReadonlyRef<T> | (() => T);

/** Normalize a readonly param to a `ReadonlyRef` for the rest of the composable. */
export function toReadonlyRef<T>(value: ReadonlyRefOrGetter<T>): ReadonlyRef<T> {
  return toRef(value);
}
```

At the top of the composable, normalize getter-or-ref params once:

```ts
function useChannelTypingPulse({
  channelId,
  editor,
}: {
  channelId: ReadonlyRefOrGetter<number | undefined>;
  editor: ReadonlyRefOrGetter<Editor | null | undefined>;
}) {
  const channelIdRef = toReadonlyRef(channelId);
  const editorRef = toReadonlyRef(editor);
  // read channelIdRef.value / editorRef.value below — do not assign
}
```

**Rules of thumb:**

| Parameter need | Type |
| --- | --- |
| Composable only reads the value | `ReadonlyRef` or `ReadonlyRefOrGetter` |
| Normalize getter-or-ref for local use | `toReadonlyRef(...)` |
| Composable must assign / mutate that ref | `Ref` (document why) |
| Internal cell owned by this composable | `Ref` inside is fine |

Default to readonly params. Take a mutable `Ref` only when mutation of **that** ref is part of the composable’s contract — not as a habit for every reactive argument.

Ownership of domain writes still goes through **commands** where SoT applies ([`state-management.md`](state-management.md)).

---

## Smells (in-reference)

| Smell | Meaning |
| --- | --- |
| Procedural soup | Long mutable blocks where a pure helper / pipeline would clarify |
| Reinvented algorithm | Hand-rolled what native/Remeda/`lib` already does |
| **Reinvented VueUse** | Custom `useX` / raw DOM listeners for storage, object URLs, observers, drag, media, permissions, etc. when VueUse already covers it |
| Remeda for natives | Importing Remeda solely for `map`/`filter` equivalents |
| Parallel projection types | Hand-written interfaces that drift from `Pick`/`Omit` of the source |
| Writable param `Ref` | Composable takes `Ref` but never mutates it — use `ReadonlyRef` / `ReadonlyRefOrGetter` |
| VueUse as SoT | `useStorage` (or similar) treated as the server entity replica instead of sync/Query/DB |

No separate rule files unless a distinct recognition+remedy pair emerges beyond this contract.

---

## Related

| Topic | Where |
| --- | --- |
| Composable buckets / Query·command / sharing | [`composables.md`](composables.md) |
| Types homes / reusability promotion | [`folder-structure.md`](folder-structure.md) |
| Ownership of writes | [`state-management.md`](state-management.md) |
| Pure helper wrapped as `useX` | [`../rules/pure-helper-as-composable.md`](../rules/pure-helper-as-composable.md) |
| Handmade widget JS / DS promotion | [`../rules/handmade-interactivity.md`](../rules/handmade-interactivity.md) |
| `innerHTML` / `v-html` of unsanitized strings | [`../rules/unsafe-html.md`](../rules/unsafe-html.md) |
