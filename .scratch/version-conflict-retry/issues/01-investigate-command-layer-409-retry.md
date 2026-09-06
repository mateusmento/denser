# 01 — Investigate command-layer 409 retry policy

**Type:** research  
**Status:** resolved — implemented 2026-09-06  
**Effort map:** [map.md](../map.md)  
**Blocked by:** None — can start immediately

## Question

For **versioned artifact PATCH** outside in-editor sync composables, should the app bounded-retry on 409? If yes, what belongs in a shared helper vs staying bespoke in sync?

This is an **investigation + decision** ticket — not an implementation slice. Output is a short answer on the map (Decisions so far) and, if warranted, a follow-up implementation ticket with a concrete design.

## Why now (context)

Gallery **conversation move** landed with the same `while (attempt < 3)` loop already used in `renameArtifact`, copied from sync composables. That raised two smells:

1. **Duplication** — `moveArtifact` has two nearly identical loops (conversation + document); `renameArtifact` already unifies both kinds in one loop.
2. **Inconsistency** — other command-layer PATCH paths send `version` but do **not** retry.

Documented policy ([`conflict-version.md`](../../../.cursor/skills/frontend-patterns/references/conflict-version.md)) says versioned PATCH → 409 → merge pending fields → bounded retry. In practice, adoption is **tiered and uneven**.

## Current inventory (as of 2026-09)

| Call site | Operation | Sends `version`? | Retries on 409? | Notes |
| --- | --- | --- | --- | --- |
| `useDocumentSync.patchMutation` | Document autosave | Yes | Yes (3) | Field-aware `mergeDocumentConflict` |
| `useConversationSync.patchMutation` | Conversation title | Yes | Yes (3) | Bumps version from conflict body |
| `useArtifactCommands.renameArtifact` | Gallery rename | Yes | Yes (2) | `patchWithVersionRetry` |
| `useArtifactCommands.moveArtifact` | Gallery move | Yes | Yes (2) | `patchWithVersionRetry` |
| `useSpaceSync.moveDocument` | Backlog space change + order | Yes | Yes (2) | `patchWithVersionRetry` |
| `useSpaceSync.transitionDocument` | Board stage change + order | Yes | Yes (2) | `patchWithVersionRetry` |
| `useSpaceCommands.renameSpace` / `moveSpace` | Space tree | No | N/A | No entity version on `PatchSpaceInput` |

**Not in table (confirmed no version/retry path):** `patchDocumentType` in `useDocumentTypeSchema` — different entity, no artifact `version` gate.

**Trigger:** stale gallery tile `version` after realtime or another tab; orthogonal concurrent edit (e.g. rename while move).

## Hypothesis (preliminary — validate in investigation)

| Tier | Operations | Retry? | Merge strategy |
| --- | --- | --- | --- |
| Sync / autosave | In-editor PATCH streams | Yes | Full field merge (documents); version bump (conversations) |
| Command / one-shot | Gallery rename, gallery move, planning move/stage | Yes, bounded (1–2) | **Dumb merge:** server snapshot + re-apply only user-intended fields (`title`, `spaceId`, `stageId`, ordering) |
| Unversioned | Space PATCH | No | N/A |

Planning DnD already uses optimistic UI; a single retry would reduce silent failures without needing document-style same-field UX except for rare same-field fights (two moves to different spaces).

## Investigation tasks

- [x] Confirm inventory is complete (`grep` for `patchDocument`, `patchConversation`, `while (attempt < 3)` in `packages/app`) — see inventory table; no other retry loops found
- [x] Classify each call site: **sync stream** vs **one-shot command** vs **optimistic DnD command** — see Answer §2
- [x] For each one-shot command, sketch conflict scenarios — see Answer §3
- [x] Compare failure modes today and recommend one command-layer convention — see Answer §4
- [x] Prototype helper shape — see Answer §5
- [x] Decide: align `useSpaceSync` with gallery commands — see Answer §1 (yes, align)
- [x] Record decision on [map.md](../map.md) under **Decisions so far**
- [x] Spawn implementation ticket when ready to execute (see Answer §6) — implemented in same effort; no separate ticket

## Non-goals

- Implementing the helper in this ticket
- Changing server 409 contracts
- Refactoring `useDocumentSync` merge logic unless investigation shows clear shared surface

## Artifacts

- Answer below (desk review 2026-09-06)
- Map updated with one-line gist

---

## Answer

Desk review from conversation-move work + code read-through. Re-run grep before implementing in case new PATCH call sites landed.

### §1 — Should command-layer PATCH retry on 409?

**Yes — for all versioned artifact commands**, with a **simpler** retry than sync composables use.

The retry loop in `moveArtifact` is not arbitrary; it mirrors `renameArtifact` and the sync composables. The real problem is **uneven adoption**, not the idea of retrying:

| Tier | Should retry? | Rationale |
| --- | --- | --- |
| **Sync / autosave** (`useDocumentSync`, `useConversationSync`) | **Yes** (keep as-is) | High frequency; overlapping edits; document field merge is essential |
| **One-shot commands** (gallery rename/move, planning move/stage) | **Yes**, bounded (2 attempts) | Gallery tiles often hold **stale `version`**; the user's intent is a small field set (`title`, `spaceId`, `stageId`, ordering) that usually composes cleanly on top of a fresher server snapshot |
| **Spaces** (`patchSpace`) | **No** | No `version` on contract — 409 retry path doesn't exist |

**Align `useSpaceSync.moveDocument` and `transitionDocument` with gallery commands.** Today the same product moves a document in two ways: gallery (`moveArtifact`, retries) vs backlog/board (`moveDocument`, no retry). Planning DnD is already optimistic; one bounded retry would make more gestures succeed without the user noticing, and still roll back + toast on exhaustion.

**Do not** copy the full `mergeDocumentConflict` machinery into commands. Wrong tool for one-shot gestures.

### §2 — Call-site classification

| Call site | Class | Retry policy |
| --- | --- | --- |
| `useDocumentSync.patchMutation` | Sync stream | Rich merge + retry (3) |
| `useConversationSync.patchMutation` | Sync stream | Version bump + retry (3) |
| `useArtifactCommands.renameArtifact` | One-shot command | Dumb merge + retry (2) — `patchWithVersionRetry` |
| `useArtifactCommands.moveArtifact` | One-shot command | Dumb merge + retry (2) — `patchWithVersionRetry` |
| `useSpaceSync.moveDocument` | Optimistic DnD command | Dumb merge + retry (2) — `patchWithVersionRetry` |
| `useSpaceSync.transitionDocument` | Optimistic DnD command | Dumb merge + retry (2) — `patchWithVersionRetry` |
| `useSpaceCommands.*` | Unversioned command | No retry |

### §3 — Conflict scenarios (one-shot commands)

**Stale version only (common)**  
Another tab, realtime, or autosave bumped `version` without touching the field you're changing.  
→ **Auto-retry:** take conflict body's snapshot, re-apply your intended patch fields, PATCH with `current.version`.

**Orthogonal concurrent edit (common)**  
You move while someone renames (or vice versa). Different fields.  
→ **Auto-retry:** same dumb merge — your `spaceId` on their newer row is correct.

**Same-field clash (rare)**  
Two users move the same artifact to different spaces simultaneously.  
→ **After bounded retries, stop and surface error** (toast + invalidate). Do not silent last-write-wins without UX — matches `conflict-version.md` rule 6. Acceptable to defer explicit "pick destination" UX until product pressure.

**Planning DnD rollback**  
Optimistic placement already reverts on failure. Retry before giving up reduces how often users see that rollback.

### §4 — Failure-mode convention (commands)

Today `useArtifactCommands` is inconsistent even with itself:

- `renameArtifact` / conversation `moveArtifact`: 3rd conflict → **throw**
- document `moveArtifact`: 3rd conflict → **toast**, no throw
- `useSpaceSync`: any error → **toast** + invalidate, optimistic rollback

**Recommended command-layer convention:**

1. Bounded retry (2 attempts total, or 3 if matching sync — prefer **2** for commands; stale-version cases usually resolve on first retry).
2. On exhaustion or non-conflict error: **toast** + **invalidate** affected projections (space/home/artifact).
3. **Do not throw** to callers for gallery commands (`void moveArtifact(...)`). Planning DnD can keep `return false` after toast + invalidate.
4. On 409: always **upsert conflict snapshot** into `artifactsCollection` / `documentsCollection` before retry (same as sync).

### §5 — Helper shape (implemented)

**Location:** `packages/app/src/lib/patch-with-version-retry.ts` + `packages/app/src/lib/artifact-patch-conflict.ts`

**Keep sync composables separate** — `useDocumentSync` needs `mergeDocumentConflict`; sharing would over-couple.

**Surface:**

```ts
// patch-with-version-retry.ts
export async function patchWithVersionRetry<T>(input: {
  maxAttempts?: number; // default 2
  version: number;
  patch: (version: number) => Promise<T>;
  onConflict: (error: unknown) => number | null;
  onFailure?: (error: unknown) => void;
}): Promise<T | null>;

// artifact-patch-conflict.ts
export function applyArtifactPatch(artifact: ArtifactSummary): void;
export function artifactPatchConflictVersion(error: unknown): number | null;
```

**Wired through:**

1. `useArtifactCommands.renameArtifact` + `moveArtifact`
2. `useSpaceSync.moveDocument` + `transitionDocument`

### §6 — Implementation (done 2026-09-06)

- [x] Shared `patchWithVersionRetry` helper with default `maxAttempts: 2` for commands
- [x] `renameArtifact` and `moveArtifact` deduplicated; consistent toast-on-failure
- [x] `useSpaceSync.moveDocument` and `transitionDocument` retry on 409
- [x] No change to `useDocumentSync` / `useConversationSync` merge behavior (still `while (attempt < 3)` with field merge)
- [x] `pnpm typecheck` green
- [x] Unit tests: `packages/app/src/lib/patch-with-version-retry.test.ts`

### §7 — Open questions (closed for v1)

- **2 vs 3 attempts for commands** — **2** for command layer; sync keeps 3.
- **Same-field move UX** — toast-only for v1; explicit picker deferred.
- **Sync composable sharing** — not pursued; conversation/document sync loops stay as-is.
