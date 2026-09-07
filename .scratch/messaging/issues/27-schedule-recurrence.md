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

Recurrence presets (once/daily/weekly) + timezone on job; recompute `next_run_at` on create/update/after fire; recurring jobs **keep** scheduled attachment joins; workspace + user timezone storage and minimal settings UI.

**Owns:** recurrence compute + `SchedulePopover` / reschedule dialog; timezone columns + API + settings surfaces; schedules list labels (workspace primary, user secondary).

**Must not touch:** meeting jobs (MEETINGS pack); claim SQL core (**24**); outbox list/nav (**33** — consumes reschedule dialog from here).

**Consumes:** scheduling module from **24**; schedule product from **25**.

## Product decisions (grilling 2026-09-06)

### Timezone (Option A — in scope)

| Field | Rule |
| --- | --- |
| `job.timezone` | Always **workspace** IANA zone (private root) |
| Recurrence expansion | Workspace wall clock (`timeOfDay` + weekday in workspace TZ) |
| Schedule picker display | **User profile** timezone (Slack-like); label workspace TZ explicitly |
| `workspace.timezone` | Admin-set; default at private-root creation = owner profile TZ |
| `user.timezone` | Profile preference; client PATCH on session/focus when `Intl` zone changes |

Member time matrix (toggle): regular conversation → space members with access; DM → peers; once → next fire per member; recurring → **next 3 fires** per member.

### Edit vs reschedule (two actions)

| Action | Surface | Changes |
| --- | --- | --- |
| **Edit message** | Composer in conversation (**33** owns navigation) | Body + attachments only |
| **Reschedule** | Schedule dialog (`ScheduledMessageEditSheet` → reschedule-only) | Time + recurrence; recompute `next_run_at` |

**Edit message navigation** is specified in **33** (thread open when `threadId`, composer scheduled-edit mode). **27** owns the reschedule dialog and list time labels.

Scheduled row actions (**33** row layout, **27** reschedule handler): trailing icon buttons — `SquarePenIcon` (edit message), `ClockIcon` (reschedule).

### Weekly recurrence (Option B — multi-day)

When recurrence = **weekly**, show an **inline row of weekday toggle buttons** (e.g. `S M T W T F S` or locale-short labels). User may select **one or more** days.

| Rule | Detail |
| --- | --- |
| UI | Toggle buttons in `SchedulePopover` + reschedule dialog; not derived silently from first pick |
| Storage | `recurrence.weekdays: number[]` (0=Sun … 6=Sat) in workspace TZ semantics |
| Default on first weekly select | Pre-select weekday of chosen date/time **in user picker TZ** (user can add/remove toggles) |
| Validation | At least one weekday selected before commit |
| List label | e.g. `Weekly · Mon, Wed, Fri` (workspace wall time on line 1 per **33**) |

Engine already supports `weekdays[]` in `scheduling-recurrence.ts`; extend `ScheduleCommitPayload` + schedule API input to pass `weekdays` when `recurrence === "weekly"`.

## Updates (task pack v2)

- **Split from** archive **11** follow-on (archive noted “recurrence can be follow-up PR still under 11” — now explicit **27**).

## API (backend)

- [x] Recurrence presets + timezone on `ScheduledJob` (scheduling module + contracts)
- [x] Recompute `next_run_at` on create/update/after fire (scheduling module — **not** wired from schedule-message create/update)
- [x] Recurring keeps scheduled attachment joins (no release until cancel)

## App (frontend)

- [x] Recurrence picker in `SchedulePopover`
- [ ] Workspace + user timezone settings surfaces (minimal)
- [ ] Reschedule dialog: time + recurrence only (replace body-editing `ScheduledMessageEditSheet`)
- [ ] Schedules list: workspace wall time primary; scheduler local time muted secondary
- [ ] Pass recurrence + timezone (+ `weekdays` when weekly) from app → schedule API on create/update
- [ ] Weekly: inline weekday toggle buttons in `SchedulePopover` / reschedule dialog
- [ ] Wire **Reschedule** (`ClockIcon`) from outbox rows (**33**) to reschedule dialog

## PR

- [x] `[messaging 27] Schedule recurrence + timezone` — [#29](https://github.com/mateusmento/denser/pull/29)

## Comments

**Audit 2026-09-06:** Infrastructure merged (`scheduling-recurrence.ts`, `buildJobScheduleTiming`, after-fire advance). **Gap:** `scheduled-messages/service.ts` still passes `recurrence: null, timezone: null`; `ConversationContainer` `onSchedule` ignores popover recurrence/timezone. Remaining work listed above.
