# 33 — Drafts & scheduled outbox UX

**Chunk:** 7 (new)  
**Layer:** api + app  
**Domain:** [MESSAGE-DRAFTS.md](../../../docs/MESSAGE-DRAFTS.md) · [SCHEDULING.md](../../../docs/SCHEDULING.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** open  
**GitHub:** [#33](https://github.com/mateusmento/denser/issues/33)  
**Blocked by:** 22 — Drafts API; 23 — Drafts app; 25 — Schedule message API; 26 — Schedule app; 07 — Threads app; 15 — Conversation shell; **27a** — timezone infra; **27b** — recurrence API + reschedule dialog + time label formatters (scheduled tab can stub until 27b lands)  
**Specs:** [CHUNKS.md](../CHUNKS.md) · [COVERAGE.md](../COVERAGE.md)

Product decisions from grilling session (2026-09-06). Replaces header **Messages / Scheduled** tabs with workspace-level lists + per-channel side panel.

---

## Summary

Give users a personal **outbox** for in-progress drafts and pending scheduled messages:

- **Workspace sidebar:** two pinned nav rows — **Drafts** and **Scheduled** — each with its own route and badge count.
- **Per-channel:** ⋮ menu → **Drafts & scheduled** opens a right **side panel** (Drafts | Scheduled tabs), sharing the same column as **ThreadPane** (mutually exclusive).
- **Remove:** `ConversationPaneTabs` and auto-switch to schedules tab after scheduling.

Do **not** call this "inbox" — drafts and scheduled messages are compose state, not notifications.

---

## Navigation & layout

| Area | Decision |
| --- | --- |
| **Remove** | `ConversationPaneTabs` (Messages / Scheduled header tabs) |
| **Per-channel entry** | Channel ⋮ menu → **Drafts & scheduled** → right panel with **Drafts \| Scheduled** tabs |
| **Workspace sidebar** | Two pinned rows: **Drafts** and **Scheduled** (separate routes) |
| **Right column** | Thread pane and side panel **share one column**; opening one **closes** the other |
| **Mobile / narrow** | Side panel = **full-screen overlay** with back/close (match thread behavior) |

---

## Scope & data

| Area | Decision |
| --- | --- |
| **Drafts (per-channel panel)** | All **your** drafts in this conversation — main channel + every thread |
| **Scheduled (per-channel panel)** | **Yours only** in this conversation (`senderId = current user`) |
| **Workspace lists** | Personal outbox across all conversations/threads in `rootSpaceId` |
| **Empty drafts** | **Exclude** from lists and badge counts (no body and no attachments) |
| **Lost access** | Still show your draft/schedule rows; best-effort conversation label; fallback copy when `requireArtifactAccess` fails; jump may 404 — offer discard |

### API access model

Gate list endpoints with `requireSpaceAccess(userId, rootSpaceId)` (same pattern as unread summary).

Then filter by ownership — **no per-conversation membership join** on the list query:

| Resource | Query filter |
| --- | --- |
| Drafts | `root_space_id = ? AND author_id = ?` (+ non-empty filter) |
| Scheduled | `root_space_id = ? AND type = 'scheduled_message' AND payload->>'senderId' = ? AND processed = false` |

Enrichment (conversation title, DM peer name): best-effort join on `conversationId`; do not drop rows when access check fails — use fallback label.

**Note:** Current per-conversation `listScheduledMessages` returns all schedules in the channel. Per-channel panel and workspace list must filter to **current user only**. Consider updating the existing list endpoint or adding a `mine` query param.

---

## List row layout

Same row pattern in workspace pages and per-channel panel tabs.

### Drafts row

1. **Line 1 (inline):** destination + context — e.g. `#engineering · Thread` or `DM with Alex · Channel`
2. **Line 2:** truncated message body preview

### Scheduled row

1. **Line 1 (inline):** next send time + destination + thread indicator — e.g. `Tomorrow 9:00 AM · #engineering · Thread`
2. **Line 2:** truncated message body preview
3. **Trailing actions (icon buttons):** **Edit message** (`SquarePenIcon`) and **Reschedule** (`ClockIcon`) — see [Interactions](#interactions). **Cancel** stays in overflow menu (destructive).

Show recurrence hint on line 1 when applicable (e.g. `· Weekly`). Time/recurrence strings come from **27b** formatters (`formatScheduleWallTime`, `recurrenceLabel`) — workspace wall time primary; scheduler local time muted secondary when shown.

---

## Boundary with **27**

**#27** owns scheduling **primitives**; **#33** owns outbox **surfaces**. See [27-schedule-recurrence.md](./27-schedule-recurrence.md#boundary-with-33).

**Handled by #33 (not #27):**

- Remove `ConversationPaneTabs`, `ConversationSchedulesList`, schedules main-pane tab
- `ScheduledOutboxRow` + side panel / workspace **Scheduled** pages
- Row `SquarePenIcon` / `ClockIcon` / cancel overflow; row click → edit message
- Edit message navigation + composer **scheduled-edit mode** + edit banner
- Post-schedule toast + “View” → side panel Scheduled tab
- Workspace list/count APIs (`GET /root-spaces/:id/scheduled-messages`)
- Badges, deep links, mobile overlay

**Consumed from #27 (do not reimplement in #33):**

- **27a:** `user.timezone` / `workspace.timezone` for matrix + labels
- **27b:** `RescheduleScheduleDialog`, `SchedulePopover` recurrence fields, timing PATCH API
- **27b:** `formatScheduleWallTime` + recurrence summary for row line 1

**Parallel work:** #33 API (draft/scheduled list counts) and panel shell can start before **27b**; Scheduled tab rows should use placeholder labels until **27b** formatters land, or ship Scheduled tab after **27b**.

## Interactions

| Action | Behavior |
| --- | --- |
| **Click draft** (workspace list or panel) | Navigate to conversation → open thread if `threadId` → focus composer with draft loaded |
| **Click scheduled row** (workspace list or panel) | Same as **Edit message** (Slack-style): navigate to conversation with context restored |
| **Edit message** (`SquarePenIcon` on row) | Navigate to `conversationId` → **open thread pane** when `threadId` is set → **main timeline visible** (not schedules tab) → **composer in scheduled-edit mode**: body + attachments hydrated from the job; timing **unchanged**. Banner: e.g. `Editing scheduled message · sends {workspace wall time}`. Save → PATCH scheduled message payload only. See **27** for reschedule (timing/recurrence). |
| **Reschedule** (`ClockIcon` on row) | Open **reschedule dialog** in place (no navigation): time + recurrence via full `SchedulePopover` (+ member matrix from **27**). Does **not** edit body/attachments. Implemented in **27**; row button wired here. |
| **After scheduling from composer** | Stay on timeline → toast (`Message scheduled for …`) with **View** link → opens per-channel side panel on **Scheduled** tab |
| **Badges** | Workspace sidebar: count on **Drafts** and **Scheduled**; channel ⋮ menu: dot/count when this conversation has non-empty drafts or pending scheduled messages |

### Scheduled edit navigation (composer)

When opening a scheduled message for **Edit message** (row click or `SquarePenIcon`):

1. Route to the conversation (`conversationId` from list item).
2. If `threadId` is present, open **ThreadPane** for that thread; otherwise show main channel timeline.
3. Close drafts/scheduled side panel if open (mutually exclusive with thread — user lands on compose surface).
4. Hydrate **MessageComposer** in **scheduled-edit mode** (`scheduledJobId` + body + attachment tiles from job anchor).
5. Do **not** open the reschedule dialog or change `next_run_at` until user explicitly taps **Reschedule** (`ClockIcon`).

---

## Agent skills

**API:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md) — thin handlers, repository queries, tenancy gate.

**App:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md) — presentational/container split; wire existing presentationals; TanStack Query for lists.

---

## API (backend)

New routes (suggested shape — align with existing `read-state` root-space pattern):

- `GET /root-spaces/:rootSpaceId/drafts` — list non-empty drafts for user
- `GET /root-spaces/:rootSpaceId/drafts/count` — badge count (or include in list meta)
- `GET /root-spaces/:rootSpaceId/scheduled-messages` — list active scheduled messages for user
- `GET /root-spaces/:rootSpaceId/scheduled-messages/count` — badge count

DTO fields for list items (extend or wrap existing DTOs):

- `conversationId`, `threadId?`, `body` preview source
- Conversation display: `conversationTitle` or `conversationLabel` (enriched, nullable with fallback)
- `contextLabel`: `channel` | `thread`
- Scheduled: `dueAt`, `nextRunAt`, `recurrence` summary, `jobId`

Per-conversation scheduled list: filter to `senderId = userId` (update **25** list behavior or add query param).

- [ ] `listDraftsForUser(rootSpaceId, userId)` — non-empty only; exclude expired
- [ ] `countDraftsForUser(rootSpaceId, userId)` — same filter
- [ ] `listScheduledMessagesForUser(rootSpaceId, userId)` — unprocessed only
- [ ] `countScheduledMessagesForUser(rootSpaceId, userId)`
- [ ] `requireSpaceAccess` gate on all endpoints
- [ ] Contracts + OpenAPI/types in `@denser/contracts`
- [ ] Integration tests for access gate + ownership filter + empty-draft exclusion

**Owns:** list/count repositories + routes; per-conversation scheduled mine-only filter.

**Must not touch:** draft upsert/TTL (**22**); schedule fire/cancel (**25**); recurrence engine / `buildJobScheduleTiming` (**27**); `SchedulePopover` / reschedule dialog internals (**27b**).

**Consumes:** list/count APIs from this ticket's API half; existing draft sync (**23**); schedule timing + body PATCH APIs (**27b**); reschedule dialog (**27b**); thread pane (**07**).

---

## App (frontend)

### Remove / replace

- [ ] Remove `ConversationPaneTabs` from `ConversationContainer` and delete or deprecate component + stories
- [ ] Remove auto-switch to schedules tab after scheduling
- [ ] Remove schedules tab replacing timeline in main pane

### Per-channel side panel

- [ ] Extend `ConversationSurface` right column: `thread | drafts-scheduled | null` (mutually exclusive)
- [ ] New panel: **Drafts & scheduled** with tabs; reuse list row components
- [ ] Channel ⋮ menu item with badge when conversation has items
- [ ] Full-screen overlay on narrow viewports

### Workspace pages

- [ ] Routes: workspace **Drafts** page and **Scheduled** page (scoped to active `rootSpaceId`)
- [ ] Sidebar: two pinned nav rows with badge counts (`useWorkspaceNavSync` — mirror `directMessagesSection` pattern)
- [ ] Click row → navigate to conversation with context restore (deep link or route state: `conversationId`, `threadId?`, `draftId?` / `scheduledJobId?`)

### Composer integration

- [ ] Deep link / navigation restores thread + hydrates composer (draft or **scheduled-edit mode**)
- [ ] Scheduled-edit mode: load job body + attachments; save PATCHes payload only (timing untouched)
- [ ] Post-schedule toast with View → open side panel Scheduled tab

### Scheduled list rows

- [ ] Shared `ScheduledOutboxRow`: line 1 uses **27b** `formatScheduleWallTime` + recurrence summary
- [ ] Trailing icon buttons: `SquarePenIcon` (edit message), `ClockIcon` (reschedule → **27b** dialog)
- [ ] Row click = Edit message (same navigation as `SquarePenIcon`)
- [ ] Cancel in overflow menu (destructive)
- [ ] Deprecate / delete `ConversationSchedulesList` (do not extend in **27**)

### Contracts / cache

- [ ] Query keys for workspace drafts/scheduled lists + counts
- [ ] Invalidate on draft upsert/delete, schedule create/update/cancel (realtime events if available)

- [ ] Storybook stories for list rows and side panel
- [ ] Update `docs/ui-surfaces/conversation.md` and `docs/MESSAGE-DRAFTS.md` (deferred list/badge → implemented)

**Owns:** outbox UI, nav, panel, workspace pages, badges, toast, scheduled-edit composer navigation.

**Consumes:** list/count APIs from this ticket's API half; existing draft sync (**23**); schedule APIs (**27b**); thread pane (**07**).

---

## Suggested implementation order

1. API list/count endpoints + contracts
2. Remove tab-based pane switching
3. Per-channel side panel (Drafts | Scheduled tabs)
4. Workspace Drafts + Scheduled pages + sidebar nav
5. Badges, toast, mobile overlay, deep-link navigation

---

## PR

- [ ] `[messaging 33] Drafts & scheduled outbox UX` — [PR-POLICY.md](../PR-POLICY.md)

May split into `33a` API + `33b` app PRs if review size warrants it.
