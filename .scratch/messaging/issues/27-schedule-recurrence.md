# 27 — Schedule recurrence + timezone

**Chunk:** 5  
**Layer:** full  
**Domain:** [SCHEDULING.md](../../../docs/SCHEDULING.md)  
**Status:** claimed — partial on `main` (engine + UI picker; API/app wire-up remaining)  
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

- [x] Recurrence presets + timezone on `ScheduledJob` (scheduling module + contracts)
- [x] Recompute `next_run_at` on create/update/after fire (scheduling module — **not** wired from schedule-message create/update)
- [x] Recurring keeps scheduled attachment joins (no release until cancel)

## App (frontend)

- [x] Recurrence picker in `SchedulePopover`
- [ ] Display local wall time in schedules list
- [ ] Pass recurrence + timezone from app → schedule API on create/update

## PR

- [x] `[messaging 27] Schedule recurrence + timezone` — [#29](https://github.com/mateusmento/denser/pull/29)

## Comments

**Audit 2026-09-06:** Infrastructure merged (`scheduling-recurrence.ts`, `buildJobScheduleTiming`, after-fire advance). **Gap:** `scheduled-messages/service.ts` still passes `recurrence: null, timezone: null`; `ConversationContainer` `onSchedule` ignores popover recurrence/timezone. Remaining work listed above.
