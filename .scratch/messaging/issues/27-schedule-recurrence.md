# 27 — Schedule recurrence + timezone

**Chunk:** 5  
**Layer:** full  
**Domain:** [SCHEDULING.md](../../../docs/SCHEDULING.md)  
**Status:** claimed  
**PR:** [#29](https://github.com/mateusmento/denser/pull/29) (open — mergeable; stack after **#25** / **#26**)  
**Blocked by:** 25 — Schedule message API; 26 — Schedule app  
**Branch:** `agent/messaging-27-schedule-recurrence`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

### API work (backend)

**Required before API criteria:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md) — deep modules at ports/seams per [interfaces.md](../interfaces.md); thin handlers; test through the interface.



## What to build

Recurrence presets (once/daily/weekly) + timezone on job; recompute `next_run_at` on create/update/after fire; recurring jobs **keep** scheduled attachment joins.

**Owns:** recurrence compute + SchedulePopover recurrence UI.

**Must not touch:** meeting jobs (MEETINGS pack); claim SQL core (**24**).

**Consumes:** scheduling module from **24**; schedule product from **25**.

## Updates (task pack v2)

- **Split from** archive **11** follow-on (archive noted “recurrence can be follow-up PR still under 11” — now explicit **27**).

## API (backend)

- [ ] Recurrence presets + timezone on `ScheduledJob`
- [ ] Recompute `next_run_at` on create/update/after fire
- [ ] Recurring keeps scheduled attachment joins (no release until cancel)

## App (frontend)

- [ ] Recurrence picker in `SchedulePopover`
- [ ] Display local wall time in schedules list

## PR

- [x] `[messaging 27] Schedule recurrence + timezone` — [#29](https://github.com/mateusmento/denser/pull/29)
