# 26 — Schedule message UI

**Chunk:** 5  
**Layer:** app  
**Domain:** [SCHEDULING.md](../../../docs/SCHEDULING.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** claimed  
**PR:** [#31](https://github.com/mateusmento/denser/pull/31) (open — mergeable; E2E needs **#25** API)  
**Blocked by:** 25 — Schedule message API; 03 — Timeline app; 19 — Composer attachments  
**Branch:** `agent/messaging-26-schedule-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Wire **SchedulePopover** + composer schedule action; conversation schedules list (list/edit/cancel); optional muted “scheduled” caption; scheduled rows show attachment tiles from API.

**Owns:** SchedulePopover + schedules tab UI.

**Must not touch:** recurrence picker (**27**); claim SQL (**24**).

**Consumes:** schedule APIs from **25**; attachment tiles pattern from **19**.

## Updates (task pack v2)

- **Split from** archive **11**: UI half (archive bundled minimal schedules list with API).

## API (backend)

_N/A_

## App (frontend)

- [ ] Wire `SchedulePopover` (presets + custom time — once-only OK until **27**)
- [ ] Composer schedule action + scheduling state
- [ ] Conversation schedules list/tab (list/edit/cancel)
- [ ] Optional muted “scheduled” caption on timeline
- [ ] Scheduled row shows attachment tiles from API

## PR

- [x] `[messaging 26] Schedule message UI` — [#31](https://github.com/mateusmento/denser/pull/31)
