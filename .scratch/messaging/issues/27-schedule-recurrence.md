# 27 — Schedule recurrence + timezone

**Chunk:** 5  
**Layer:** full  
**Domain:** [SCHEDULING.md](../../../docs/SCHEDULING.md)  
**Status:** claimed — partial on `main` (engine + UI picker; API/app wire-up remaining)  
**PR:** [#29](https://github.com/mateusmento/denser/pull/29) (open — mergeable; stack after **#25** / **#26**)  
**Blocked by:** 25 — Schedule message API; 26 — Schedule app  
**Blocks:** **33** scheduled outbox polish (reschedule dialog, recurrence/time labels — see [Boundary with **33**](#boundary-with-33))  
**Branch:** `agent/messaging-27-schedule-recurrence`  
**Specs:** [CHUNKS.md](../CHUNKS.md)

**Delivery split (Option B):**

| Sub-ticket | Scope | PR suggestion |
| --- | --- | --- |
| **27a** | Timezone infra — `spaces.timezone` (private only), resolver, API, settings, client user TZ sync | `[messaging 27a] Space + user timezone` |
| **27b** | Schedule product — recurrence API wire-up, `SchedulePopover` / reschedule dialog, formatters, composer `onSchedule` | `[messaging 27b] Schedule recurrence + timezone` (stack on 27a) |


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

### API work (backend)

**Required before API criteria:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md) — deep modules at ports/seams per [interfaces.md](../interfaces.md); thin handlers; test through the interface.



## What to build

Recurrence presets (once/daily/weekly) + timezone on job; recompute `next_run_at` on create/update/after fire; recurring jobs **keep** scheduled attachment joins; **private space** + user timezone storage and minimal settings UI.

**Owns:** recurrence compute + `SchedulePopover` / **reschedule dialog**; timezone columns + API + settings surfaces; **schedule time label formatters** (consumed by **33** rows).

**Must not touch:** meeting jobs (MEETINGS pack); claim SQL core (**24**); outbox nav/panel/rows (**33**); `ConversationSchedulesList` / header tabs (**33** removes — do not extend).

**Consumes:** scheduling module from **24**; schedule product from **25**.

## Boundary with **33**

**#33** replaces the in-conversation **Scheduled** tab with outbox UI (side panel + workspace pages). Avoid duplicate list work.

| Concern | **27** (27a / 27b) | **33** |
| --- | --- | --- |
| Remove `ConversationPaneTabs` / `ConversationSchedulesList` | — | **33** |
| Scheduled **list row** component (`ScheduledOutboxRow`) | — | **33** |
| Row icon buttons (`SquarePen`, `Clock`) + cancel overflow | — | **33** wires; **Clock** opens dialog from **27b** |
| **Edit message** → navigate + composer scheduled-edit mode | API: body-only PATCH (**27b**) | **33** navigation + composer mode |
| **Reschedule** dialog (time + recurrence + matrix) | **27b** builds `RescheduleScheduleDialog` | **33** opens it from row `ClockIcon` (in-place, no nav) |
| Schedule from **composer** (`onSchedule`) | **27b** passes recurrence/timezone to API | **33** post-schedule toast + “View” → side panel |
| List line 1 time + recurrence text | **27b** `formatScheduleWallTime` + `recurrenceLabel` helpers | **33** rows **consume** helpers; workspace primary + user secondary |
| Workspace `/scheduled-messages` list API | — | **33** API (mine-only across workspace) |
| Per-conversation scheduled list (`mine` filter) | **27b** if needed for composer; else **33** | **33** owns filter for panel |
| Member time matrix | **27b** inside popover / reschedule dialog | — |
| `spaces.timezone` + `user.timezone` storage | **27a** (private `spaces.timezone` + user profile) | reads for matrix labels only |
| Extend `ScheduleMessageInput` / timing PATCH | **27b** | calls APIs |

**Rule:** **27** ships **primitives** (API, popover, dialog, formatters). **33** ships **surfaces** that compose them. Do not polish `ConversationSchedulesList` in **27** — it is deleted in **33**.

## Product decisions (grilling 2026-09-06)

### Space timezone model (grilling 2026-09-06)

Linear maps **team → timezone**. Denser maps **private space → timezone** (teams/projects/sealed rooms are spaces). Public folders do not own a timezone.

#### Storage

| Space visibility | `spaces.timezone` | Settings UI |
| --- | --- | --- |
| **Private** (root or nested) | **Required** IANA string. **`null` rejected** on create and PATCH. | `SpaceSettingsDialog` → **General** (`canManage`) |
| **Public** | **No column value** (no setting) | No timezone control |

#### Create private space

**No timezone field on create** — server always sets `timezone` silently:

| Create case | Server sets `timezone` to |
| --- | --- |
| **Private root** (workspace) | Owner’s **profile timezone** at create |
| **Nested private** | **`resolveScheduleTimezone(parentId)`** at create moment |

Value is stored explicitly on the row (snapshot). Admins may change it later in **Space settings → General** (private spaces only).

#### Resolver — `resolveScheduleTimezone(spaceId)`

Walk **up** the space tree from `spaceId` toward root:

1. At each node: if **private**, return that space’s `timezone` (always set).
2. If **public**, continue to parent.
3. If root reached without a private node → error (should not occur under a workspace tree).

**Anchors for scheduling:**

| Conversation | Start walk at |
| --- | --- |
| **Regular** | `conversation.space_id` |
| **Direct (DM)** | **`root_space_id`** (private workspace root; `space_id` is context-only) |

`job.timezone` = result of resolver at **create / reschedule**; recurrence expands in that wall clock.

#### Independence vs inheritance

- Each **private** space stores its **own** timezone string (copied at create or edited later).
- Changing a **parent** private space TZ does **not** rewrite stored TZ on **child** private spaces.
- **Public** descendants always resolve to the **closest private ancestor** at read/schedule time (no stored value on public nodes).

#### On private space timezone change (Option C — recompute + notify)

When a **private** space’s `timezone` is PATCHed:

1. Recompute `next_run_at` for active `scheduled_message` jobs whose conversations **resolve to that space** (conversation’s walk hits this space as the **first** private ancestor — includes public folders under it, excludes nested private subtrees with their own TZ).
2. Keep `timeOfDay` / `weekdays` in the **new** wall clock.
3. Notify affected schedulers (in-app): “Timezone for {space} changed; your scheduled messages were adjusted.”

#### User timezone (picker display)

| Field | Rule |
| --- | --- |
| **Picker display** | **User profile** timezone (Slack-like) |
| **Schedule label** | Show resolved **space** timezone explicitly, e.g. `9:00 AM · Engineering (space)` |
| `user.timezone` | Silent client PATCH + **Preferences** override (`timezone_source`: `auto` \| `manual`) |

**Linear analogy:** private nested space ≈ team; private root ≈ workspace default for public folders under it.

### Settings surfaces (27a)

| Setting | Surface | Notes |
| --- | --- | --- |
| **Private space timezone** | `SpaceSettingsDialog` → **General** (private spaces only, **edit** — not create) | Required IANA dropdown; `canManage`; **no null / clear** |
| **Create private space** | — | **Hidden** — server copies parent resolved TZ (nested) or owner profile TZ (root) |
| **Public space** | — | No timezone field |
| **User timezone** | Shell user menu → **Preferences** | IANA dropdown + “Also updates automatically when you travel” |
| **User timezone (silent)** | App bootstrap + `document` focus | PATCH when `Intl` changes; respect `timezone_source: manual` |

Member time matrix (toggle “See member times” in schedule / reschedule dialog):

| Context | Roster source |
| --- | --- |
| Regular conversation | Members with access to conversation |
| DM | Peer(s); peer row prominent |

| Recurrence | Columns per member |
| --- | --- |
| Once | Next fire only |
| Recurring | **Next 3 fires** (DST preview) |

**Roster cap (Option B):** show **scheduler first**, then up to **7 others** (8 rows total) sorted by display name; if more eligible members, footer `+N others`. Matrix is client-computed from cached member list + `user.timezone` per member (no new matrix API in v1).

### Edit vs reschedule (two actions)

| Action | Surface | Changes |
| --- | --- | --- |
| **Edit message** | Composer in conversation (**33** owns navigation) | Body + attachments only |
| **Reschedule** | Schedule dialog (`RescheduleScheduleDialog`) | Time + recurrence; recompute `next_run_at` |

**Edit message navigation** is specified in **33** (thread open when `threadId`, composer scheduled-edit mode). **27** owns the reschedule dialog and list time labels.

Scheduled row actions (**33** row layout, **27** reschedule handler): trailing icon buttons — `SquarePenIcon` (edit message), `ClockIcon` (reschedule).

### Weekly recurrence (Option B — multi-day)

When recurrence = **weekly**, show an **inline row of weekday toggle buttons** (e.g. `S M T W T F S` or locale-short labels). User may select **one or more** days.

| Rule | Detail |
| --- | --- |
| UI | Toggle buttons in `SchedulePopover` + reschedule dialog; not derived silently from first pick |
| Storage | `recurrence.weekdays: number[]` (0=Sun … 6=Sat) in **schedule** TZ semantics |
| Default on first weekly select | Pre-select weekday of chosen date/time **in user picker TZ** (user can add/remove toggles) |
| Validation | At least one weekday selected before commit |
| List label | e.g. `Weekly · Mon, Wed, Fri` (workspace wall time on line 1 per **33**) |

Engine already supports `weekdays[]` in `scheduling-recurrence.ts`; extend `ScheduleCommitPayload` + schedule API input to pass `weekdays` when `recurrence === "weekly"`.

### Schedule API input (Option A — picker instant + preset)

Client sends what the user picked; server derives normalized `RecurrenceRule` + `job.timezone` (resolved schedule IANA).

**Create / reschedule request fields** (extend `ScheduleMessageInput` / timing-only update):

| Field | Required | Notes |
| --- | --- | --- |
| `dueAt` | yes (timing paths) | UTC ISO from user-TZ date/time picker |
| `recurrence` | yes (timing paths) | `once` \| `daily` \| `weekly` |
| `weekdays` | when `weekly` | `number[]` 0=Sun…6=Sat; min 1; from toggle UI |
| `until` | optional, recurring only | End date; omit = repeat until cancelled |
| `body`, `attachmentIds`, … | create / edit-message only | unchanged from **25** |

**Server (`scheduled-messages/service.ts`):**

1. `scheduleTz = resolveScheduleTimezone(conversation)` — tree walk from `space_id` (DM → `root_space_id`).
2. Build recurrence via `recurrenceFromPreset(preset, dueAt, scheduleTz, { weekdays, until })`.
3. Call `buildJobScheduleTiming({ dueAt, recurrence, timezone: scheduleTz })`.
4. Persist `dueAt`, `nextRunAt`, `timezone`, `recurrence` on job.

Client does **not** send `timeOfDay`, normalized rule, or timezone id — display TZ is user profile only; schedule TZ is server-resolved.

**Edit message** (body/attachments, **33**): PATCH payload **excludes** `dueAt` / `recurrence` / `weekdays` — timing untouched.

**Reschedule** (**27**): PATCH (or dedicated timing sub-route) with `dueAt` + `recurrence` + `weekdays?` only — body untouched.

### Recurrence end date (Option B — optional `until`)

When recurrence is **daily** or **weekly**, show an **optional end date** in the schedule / reschedule dialog.

| Rule | Detail |
| --- | --- |
| UI | Optional date picker (e.g. “Ends” with clear / none = repeat until cancelled) |
| Storage | `recurrence.until` ISO datetime on job when set |
| Semantics | Last eligible fire is on or before end date in **schedule** wall-clock (same TZ as recurrence expansion) |
| API (Option A) | Client sends `until?: string` (UTC ISO of user’s end-date pick, end of that calendar day in **user picker TZ**); server normalizes to schedule rule boundary |
| List label | Append when set, e.g. `Weekly · Mon, Wed · until Mar 15` |
| Once | No end-date control |

## Updates (task pack v2)

- **Split from** archive **11** follow-on (archive noted “recurrence can be follow-up PR still under 11” — now explicit **27**).

## API (backend)

### 27a — timezone infra

- [ ] `spaces.timezone` — **NOT NULL on private spaces only**; no value on public; reject null PATCH
- [ ] `resolveScheduleTimezone(spaceId)` — tree walk to closest private ancestor
- [ ] On **create private space**: server-set `timezone` only (no create UI); nested → `resolveScheduleTimezone(parentId)`; root → owner profile TZ
- [ ] `user.timezone` + `user.timezone_source` (`auto` \| `manual`)
- [ ] PATCH space/user timezone APIs
- [ ] On private space TZ change: recompute jobs that resolve to that space + notify schedulers (Option C) — **notify → [#37](./37-scheduler-tz-change-notification.md)**
- [ ] Integration tests: resolver (public under private, nested private, DM → root), create defaults, recompute scope, null rejected

### 27b — schedule recurrence (shared with **25** update paths)

- [x] Recurrence presets + timezone on `ScheduledJob` (scheduling module + contracts)
- [x] Recompute `next_run_at` on create/update/after fire (scheduling module — **not** wired from schedule-message create/update)
- [x] Recurring keeps scheduled attachment joins (no release until cancel)
- [ ] Extend `ScheduleMessageInput` + update path: `recurrence`, `weekdays?`, `until?`; server derives rule via `buildJobScheduleTiming` + `resolveScheduleTimezone` (**27a**)
- [ ] Extend `recurrenceFromPreset` for multi-day `weekdays` override + `until`
- [ ] Split update semantics: body-only PATCH vs timing-only reschedule (no cross-field bleed)

## App (frontend)

### 27a — timezone infra

- [ ] **Private** space settings (edit only): required timezone dropdown — **not** on create-space flow
- [ ] **Create private space**: no timezone field; server copies parent (or owner profile for root)
- [ ] Shell user menu → **Preferences**: user timezone dropdown + auto-update note
- [ ] Client PATCH `user.timezone` on session/focus (respect `timezone_source: manual`)

### 27b — schedule product

- [x] Recurrence picker in `SchedulePopover`
- [x] Reschedule dialog: time + recurrence only (`RescheduleScheduleDialog`; no body preview)
- [ ] `formatScheduleWallTime` + view-model helpers: schedule TZ primary / user TZ secondary (**33** rows consume)
- [ ] Pass recurrence + `weekdays` + `until` from composer `onSchedule` → schedule API
- [ ] Weekly: inline weekday toggle buttons in `SchedulePopover` / reschedule dialog
- [ ] Optional end date (`until`) for daily/weekly
- [ ] Member time matrix toggle with capped roster (8 rows + “+N others”)
- [ ] Storybook for popover, reschedule dialog, formatters

**Not in 27:** outbox row layout, icon button wiring, composer scheduled-edit navigation, remove header tabs — all **33**.

## PR

- [x] `[messaging 27] Schedule recurrence + timezone` — [#29](https://github.com/mateusmento/denser/pull/29)

## Comments

**Audit 2026-09-06:** Infrastructure merged (`scheduling-recurrence.ts`, `buildJobScheduleTiming`, after-fire advance). **Gap:** `scheduled-messages/service.ts` still passes `recurrence: null, timezone: null`; `ConversationContainer` `onSchedule` ignores popover recurrence/timezone. Remaining work listed above.
