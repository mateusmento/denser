# 29 — Screen recording → attach (Loom-style)

**Chunk:** 3f — Recording  
**Layer:** full (app-heavy; reuses upload API)  
**Domain:** [SCREEN-RECORDING.md](../../../docs/SCREEN-RECORDING.md) · [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md)  
**Status:** resolved  
**PR:** [#27](https://github.com/mateusmento/denser/pull/27) (open — mergeable)  
**Blocked by:** 19 — Composer upload UI  
**Branch:** `agent/messaging-29-recording-attach`  
**Specs:** [SCREEN-RECORDING.md](../../../docs/SCREEN-RECORDING.md) · [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

### API work (backend)

**Required before API criteria:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md) — deep modules at ports/seams per [interfaces.md](../interfaces.md); thin handlers; test through the interface.



## What to build

**Loom-like** screen recording from the composer: screen + **circular webcam baked into the video**, with a **pre-record setup UI** where the user **drags the camera circle** on a live preview (WYSIWYG). On stop, hand `video/webm` to the **same upload pipeline as ticket 19** — plain message attachment for v1. **No Recording artifact** yet (deferred).

**Reference (compositing only):** epicstory `app/src/core/screen-recording.ts` — port canvas + audio mix; **do not** copy download-on-stop or fixed rect UX.

**Owns:** `ScreenRecordingSetupDialog`, compositing modules, composer `record` action wiring, blob handoff to upload client.

**Must not touch:** BlobStore adapters (16); upload HTTP routes (18 internals); meeting LiveKit recording (MEETINGS M3); Recording artifact entity (future).

## Updates (task pack v2)

- **Renumbered** from archive **16** (recording attach).
- **Expanded:** Loom-style pre-record draggable camera — [SCREEN-RECORDING.md](../../../docs/SCREEN-RECORDING.md) (archive was “upload not download” only).

## API (backend)

- [x] Reuse upload API (18) — `video/webm` as normal attachment; no new routes

## App (frontend)

### Setup (before record)

- [x] Composer **Record screen** → modal/overlay (not instant record)
- [x] `getDisplayMedia` screen preview full-bleed
- [x] Webcam as **draggable circle** on preview; clamp inside frame
- [x] Shared `compositeFrame()` for preview rAF **and** export canvas (WYSIWYG)
- [x] Toggles: webcam, mic, system audio (degrade gracefully)
- [x] Cancel releases all tracks

### Record

- [x] Start → `MediaRecorder` on `canvas.captureStream(30)` + mixed audio (VP9 → VP8 fallback)
- [x] Recording UI: timer, Stop
- [x] Stop → finalize blob → pass to upload client from 19 (tile, progress, cancel)

### Out of scope (do not build)

- Recording artifact / share link / viewer page
- Trim, chapters, server transcode
- Meeting room recording

## Reviewer notes

**First PR with record UX:** you should drag the camera circle, record, and see a **video attachment tile** upload — not a file download. Playback in timeline is ticket **20**.

## PR

- [x] `[messaging 29] Screen recording (Loom-style attach)` — [#27](https://github.com/mateusmento/denser/pull/27)

## Comments

**Audit 2026-09-06:** Merged on `main`. Dialog-before-record UX rework is **34** (open), not this ticket.
