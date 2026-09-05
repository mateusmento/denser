# Conversation

**Status:** Active (UI prototype; domain rules in [ARTIFACTS-AND-SPACES.md](../ARTIFACTS-AND-SPACES.md))  
**Kind:** Capability UI (conversation artifact surface)  
**Density:** Calm–medium ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md))  
**Feature spec:** [CONVERSATIONS.md](../CONVERSATIONS.md) (domain); index: [FEATURE-SPECS.md — Conversation](../FEATURE-SPECS.md#conversation)  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)  
**Presentational (Vue):** `packages/app/src/features/conversation/presentationals/` (Storybook `pnpm storybook:app` → `features/conversation/*`; stories in `features/conversation/stories/`). No shell chrome on this surface.  
**Composer:** **MessageComposer** — derived from [rich-text-composer.md](./rich-text-composer.md) (engine only; this file owns send chrome).

---

## Intent

Persistent discussion among people who can access the conversation: read a **virtualized** history, **quote** messages (jump to anchor), **reply in threads**, react, and author rich messages without leaving the flow.

The surface binds to a **Conversation artifact** opened as a **space tab** (regular) or from **Direct messages** (direct). There is **one default view** — no view-mode picker on this tab.

| Kind            | Where opened          | Listing            | Access                |
| --------------- | --------------------- | ------------------ | --------------------- |
| **Regular**     | Space tab, This Space | This Space gallery | Space ACL (v1)        |
| **Direct (DM)** | Direct messages nav   | DM sidebar only    | `conversation_peer` ∩ workspace |

Notification and header chrome may differ by kind (channel-style vs DM-style); the message surface is the same.

**Quotes and threads both ship** and are not alternatives:

| Affordance | Role |
| --- | --- |
| **Quote** | Inline reference (`quotes_id`) in the **main** stream; click jumps / recenters the timeline around that message |
| **Thread** | Side conversation (`thread_id`) in **ThreadPane**; does not replace the main scroller |

The surface should feel **calm by default** (message stream dominates) while keeping **posting essentials** on screen. Power inserts stay reachable; container width drives how many action-row controls are visible, not whether they exist.

---

## Layout / sectioning

```text
┌─ Conversation surface (canvas) ─────────────┬─ Thread card ────────────┐
│ Header                                      │ Header                   │
│ Message scroller                            │ Messages                 │
│ MessageComposer (channel)                   │ MessageComposer (thread) │
└─────────────────────────────────────────────┴──────────────────────────┘
```

| Region                      | Job                                                       | Density                                                                                            |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Header**                  | Orient: which channel, who is here, channel-level actions | Calm chrome; shared `h-surface-header` with Thread                                                 |
| **Message scroller**        | Read and act on history                                   | Calm–medium; content-first                                                                         |
| **Thread pane** (when open) | Focused side conversation                                 | Desktop: **split pane** (resize + fade-in). Small: **full replace** + fade-in. Elevated card chrome OK inside the pane |
| **MessageComposer**         | Author and send / schedule                                | Derived composer; [below](#messagecomposer)                                                        |

Shared app shell (nav sidebar, space switcher) stays outside this surface; Conversation owns only the content column above. Theme / Toast are [theme.md](./theme.md) / [toast.md](./toast.md), not this surface.

---

## Sub-components

| Sub-component                                 | Role                                                                                                   | Spec depth                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- |
| **ChannelHeader**                             | Title, topic/description (if any), **conversation-presence avatar stack**, channel menu                | [Presence](#presence)        |
| **ConversationIntro**                         | Start-of-history “channel beginning”: title, intro copy, edit description, add people                  | Light                        |
| **Timeline** (`ConversationTimeline`)         | **Virtualized** sliding window; sticky **day** separators; **same-author time groups**; jump controls | [Below](#timeline) |
| **Message** (`ConversationMessage`)           | Rich body, quote preview, attachments/embeds, reactions, hover/context menus (DS `Message` is layout only)            | Below                        |
| **MessageGroup** (`ConversationMessageGroup`) | Same-author cluster within the time window: avatar + name + **group timestamp once**; slotted messages | [Grouping](#message-grouping) |
| **ThreadPane**                                | Parent summary + thread timeline + MessageComposer (thread)                                            | Below                        |
| **MessageComposer**                           | Channel / thread chrome over the shared editor                                                         | [Detailed](#messagecomposer) |
| **PermissionEmpty**                           | Replaces MessageComposer when user cannot post                                                         | States                       |

Design-system primitives (Button, Avatar, Bubble, MessageScroller UI kit, DS `Message` / `MessageGroup` layout, etc.) are implementation detail; this doc names **product** sub-components.

---

## Features

| Feature                      | Where it lives                                  | Notes                                                                 |
| ---------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Read channel history         | Timeline                                        | Bidirectional cursor pages; **virtualized** sliding window            |
| Jump to quoted message       | Message quote chrome → Timeline                 | `around` load + recenter; then older/newer scroll                     |
| Jump to latest               | **Floating pill** over timeline (Floating UI)   | Shown when viewport is off the live tip / `hasMoreNewer`              |
| Unread                       | Sidebar / header **badge** + timeline **New divider** (Slack-like) | `last_read`; **mark-read to latest on open**; see [Unread](#unread) |
| Quote while composing        | Message actions → composer                      | Sets outgoing `quotes_id`; TipTap blockquote ≠ this product quote     |
| Post rich message            | MessageComposer (channel)                       | Send Layer 1; optional `client_id` for optimism                       |
| Attachment- / image-only send | MessageComposer                                | Allowed when staged attachment(s) / image(s) present (empty TipTap OK) |
| Format selection             | MessageComposer → RichTextSelectionMenu / slash | [Standard formatting](./rich-text-composer.md#standard-formatting)    |
| Mention / image / attachment | MessageComposer action row                      |                                                                       |
| Code block (expand/collapse) | Message / composer rich text                    | Long blocks peek; **floating Collapse** (Floating UI) — [below](#code-blocks-in-timeline) |
| Poll insert                  | MessageComposer action row                      | Messaging cut (separate task)                                 |
| Screen recording / schedule  | MessageComposer action row                      | Both in messaging cut (separate tasks); recording must **attach**, not download-only |
| React to message             | Message                                         |                                                                       |
| Edit / delete own message    | Message actions                                 | Permission rules in feature spec                                      |
| Open / reply in thread       | Message → ThreadPane                            | Desktop **split pane**; small viewports **full replace** — [below](#thread-layout) |
| Typing indicators            | Banner near composer                            | v1; pulse while drafting; TTL prune                                   |
| Conversation presence        | ChannelHeader avatar stack                      | Users currently **viewing this conversation**                         |
| Workspace presence (elsewhere) | DM list / space members                       | Green dot — [shell.md](./shell.md); not shown as header stack here    |
| Search in channel            | Header or ambient                               | Likely Layer 2/3                                                      |

---

## Timeline

**Requirement:** the main stream is a **virtualized** list over a **bounded sliding window** of server pages — not an unbounded DOM of every loaded message. Pattern proven in the architecture demo (cursor + `maxPages` + TanStack Virtual); denser should reuse the same ideas ([FEATURE-SPECS.md — Conversation](../FEATURE-SPECS.md#conversation), [FRONTEND-ARCHITECTURE.md](../FRONTEND-ARCHITECTURE.md)).

| Concern | Behavior |
| --- | --- |
| Default open | Fetch newest page; **pin** viewport to bottom (latest) |
| Scroll toward older | Load `direction=next`; preserve visual anchor row |
| Scroll toward newer (after jump) | Load `direction=prev` |
| Quote / deep-link jump | `around=messageId`; replace/recenter window; **around-focus owns scroll** (skip stick-to-bottom until user returns to live edge) |
| Stick to latest | While near bottom and not in around-focus, keep pinned as new messages arrive |
| Jump to latest | **Floating pill** (Floating UI), clipped to the timeline scrollport; shown when off the live tip |
| Edge loading | Hysteresis near/leave thresholds to avoid fetch storms with virtualization + eviction |
| Date separators | Sticky **day** markers; messages never share a group across calendar days |
| Message groups | Same author + contiguous + within **5 minutes** → one `ConversationMessageGroup` |
| Thread pane | Separate list (may also virtualize when long); does not share the main window’s around-focus |

### Message grouping

Two nesting levels (already reflected in `ConversationTimeline` → sticky day → `ConversationMessageGroup` → messages):

```text
Day (StickyMarker)
  └─ MessageGroup (same author, contiguous, gap < 5 min)
       └─ Message…
```

| Rule | Behavior |
| --- | --- |
| **Day bucket** | Partition by local calendar day of `created_at`. Sticky day chip label (e.g. `Thu, Sep 4`). |
| **Author + time window** | Within a day, consecutive messages from the **same author** stay in one group while each next message is within **`MESSAGE_GROUP_WINDOW_MS` = 5 minutes** of the **previous** message in that group (Slack-like). |
| **Break group** | Different author, gap ≥ 5 minutes, or day boundary → new `ConversationMessageGroup`. |
| **Group chrome** | Avatar + display name + **one** timestamp (`createdAtLabel` of the **first** message in the group). |
| **Per-message time** | Default: no timestamp on each body (calm density). Optional hover/focus absolute time on the individual message later — not required for v1 chrome. |
| **Order** | Groups follow timeline order (oldest→newest in the DOM for bottom-anchored scroll). |

Implementation: `packages/app/src/features/conversation/messageGrouping.ts` (`conversationDayGroups` / `conversationMessageGroups`).

### Presence

| Kind | Where | UI |
| --- | --- | --- |
| **Conversation presence** | This surface’s **ChannelHeader** | Stack of avatars for users currently **viewing** this conversation (exclude or de-emphasize self as product prefers). |
| **Workspace presence** | Shell: **1:1 DM list** + **space members** roster | Small **green dot** when that user is online in the **current workspace**. **Multi-peer (group) DM rows: no presence chrome** (mirror Slack). |

Both ship in v1. They are independent signals (viewing this channel ≠ online in workspace, and vice versa).

### Unread

Nav/header **badges** (counts) and a Slack-like **New** horizontal divider in the timeline are **both** in scope — not badge-only.

| Concern | Behavior |
| --- | --- |
| Badge | Unread count on conversation in sidebar / DM list / header as applicable |
| Divider | Slack-like **New** seam between last-read and first unread |
| Open | With unread: land near divider (`around` first unread). Caught up: pin latest |
| Mark-read | **On open**, advance `last_read` to **latest** (Slack common default); badge clears without scrolling the whole backlog |
| Window | If unread boundary outside window, load via `around` |

“Badge-only” (rejected) would have meant counts in nav **without** any New line in the scroller.

### Thread layout

| Viewport | Behavior |
| --- | --- |
| **Comfortable / desktop** | **Split pane**: ThreadPane opens beside the main stream with **resize** handle + **fade-in** transition |
| **Small viewports** | **Full replace**: ThreadPane covers the conversation canvas with **fade-in**; back control returns to main stream |

Quotes stay in the main stream (jump/`around`). Threads always use ThreadPane — never compete with quote chrome.

### Code blocks in timeline

Long fenced code in a message (or composer) uses an **expand/collapse card** (lesson from Epicstory):

- Collapsed: peek first N lines + expand control.
- Expanded: full block. If the block is taller than the timeline viewport, a **Collapse** control floats via **Floating UI**:
  - Teleported / fixed against the **timeline scrollport** (not the window).
  - While the code card’s top is above the viewport and its bottom is still below the viewport bottom, the button sticks to the **bottom of the scrollport**.
  - As the user scrolls so the card’s bottom enters view, the button **sticks to the bottom of the code card**.
  - Scrolling back up re-floats at the scrollport bottom until the card’s top returns.
- Goal: collapse a huge code block without scrolling to its end to regain the conversation.

Same Floating UI stack as jump-to-latest pill (allowed dependency).

### Quote preview chrome

On a message with `quotes_id`, render the joined **`quoted` preview DTO** ([CONVERSATIONS.md — QuotedPreview](../CONVERSATIONS.md#quotedpreview-join-dto--not-persisted-as-sot)):

| Concern | Behavior |
| --- | --- |
| Body | **RichTextPreview** on TipTap `body` (images already stripped server-side) — not `displayContent` |
| Wire | ~**1000** text-node chars + JSON byte ceiling; strip images; heavy code → peek |
| Clip | Fixed **`max-h-40`**; `overflow: hidden` |
| Fade | Bottom **gradient** when **rendered height > max-h** |
| Inbox / notifications | Use plain **`displayContent`** (ellipsis/`truncate` OK on the string) |
| Empty / media | `hasAttachment` / “Attachment” when no text left |
| Missing | `quoted == null` → omit chrome |
| Activate | Click → `around` |

No server line budgets. No `line-clamp` on the rich quote card. Inbox may truncate the plain string.

---

## Data (UI-facing)

UI consumes the Conversation feature model; it does not invent a second schema. Summary of what this surface binds:

| UI need                      | Source objects / fields                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Conversation title, id, kind | Conversation artifact (`regular` \| `direct`)                                                                    |
| Message list                 | Message (`id`, `author_id`, `body`, timestamps, `thread_id`, `quotes_id`, `client_id`, attachments/embeds)       |
| Quote preview                | Joined **`quoted`**: TipTap `body` (no images; 1000 chars + 8 KiB) + **`displayContent`** (≤160) for Inbox; card **`max-h-40` + gradient** |
| Author display               | User (avatar, display name) via author id                                                                        |
| Reactions                    | Reaction aggregates per message                                                                                  |
| Thread                       | Messages with same `thread_id` + parent message                                                                  |
| Composer draft               | **[MESSAGE-DRAFTS.md](../MESSAGE-DRAFTS.md)** — server-authoritative hydrate + debounce upsert; clear on send/schedule |
| Schedule                     | ScheduledMessage (when phased)                                                                                   |
| Poll embed                   | Poll (when phased)                                                                                               |
| Can read / can post          | Space ACL (regular) or conversation_peer ∩ workspace (direct)                                                     |

Realtime: apply `message.*` / `reaction.*` (and schedule events if any) into the **same** replica the virtualized scroller reads — reconcile optimistic rows by `client_id`. Details: feature spec.

---

## Visible vs hidden UI and navigation

Chrome layers follow [VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md) decision rules.

### Channel surface

| Layer             | Visible by default                                                                            | Progressive / overflow                                                                                                                                       | Ambient                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **1 Persistent**  | Header identity; message scroller; composer editor + Send; as many P1 composer actions as fit | —                                                                                                                                                            | —                                                             |
| **2 Progressive** | —                                                                                             | Channel menu (notifications, members, settings); message hover actions (quote, reply in thread, edit, delete, pin TBD); composer **More** / schedule / selection bubble | —                                                             |
| **3 Ambient**     | —                                                                                             | —                                                                                                                                                            | Shortcuts, command palette jumps, slash inserts into composer |

### MessageComposer action-row priority (space-driven)

Always **available**; visibility depends on composer **container width**. Hide lowest priority first into **More**. Growing reveals in reverse. Prefer one action row + overflow — do not wrap into multiple icon rows.

| Priority | Control                                    | Overflow?     |
| -------- | ------------------------------------------ | ------------- |
| P0       | Rich text editor + **Send**                | Never         |
| P1       | Mention · Insert image · Insert attachment | Last among P1 |
| P2       | Insert code block · Insert poll            | Yes           |
| P3       | Screen recording · Schedule message        | First to hide |

**Resize rule:** container width drives **visibility**, not **capability**. More must remain a labeled trail.

Selection bubble: [rich-text-composer.md](./rich-text-composer.md) (shared). Insert set and Send row: this View.

---

## Interactions

| Interaction                      | Result                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Open channel                     | Load newest cursor page; **pin** virtualized scroller to latest (or unread TBD); mount channel-shape composer if can post           |
| Scroll toward older              | Fetch `next` page/window; preserve anchor row                                                                                       |
| Scroll toward newer (after jump) | Fetch `prev` page/window                                                                                                            |
| Click quote preview              | `around` that message id; recenter; show around-focus until user returns to live edge                                               |
| Jump to latest (floating pill)   | Reload/pin to live tip; hide pill when at bottom                                                                                    |
| Hover / focus message            | Reveal actions: **quote**, reply in thread, react, edit/delete if allowed                                                           |
| Quote message                    | Arm composer with `quotes_id`; send posts with that pointer                                                                         |
| React                            | Toggle reaction; optimistic UI gated by feature constraints                                                                         |
| Reply in thread                  | Open ThreadPane (split + fade, or full-replace + fade on small viewports); focus thread-shape composer                              |
| Typing                           | Emit typing pulse while focused non-empty composer; peers show typing banner (TTL); stop on blur/empty/send                         |
| Presence                         | Header shows online peers for this conversation / workspace strip                                                                   |
| Type / select in MessageComposer | Draft via [MESSAGE-DRAFTS.md](../MESSAGE-DRAFTS.md); bubble + markers from infrastructure; Send when content **or** staged image/attachment |
| Click action-row insert          | Run mention / upload / poll / recording / schedule flow                                                                             |
| Narrow resize                    | Demote action-row icons to More by priority                                                                                         |
| Send                             | Optimistic append with `client_id`; reconcile on HTTP/`message.created`; clear draft on success; keep draft + inline retry on fail |
| Schedule                         | Open SchedulePopover; commit creates ScheduledMessage; composer clears per rules                                                    |
| No post permission               | Hide MessageComposer; show PermissionEmpty                                                                                          |
| Offline                          | Queue or block send with clear copy (TBD with realtime)                                                                             |

---

## MessageComposer

Derived from [rich-text-composer.md](./rich-text-composer.md). Conversation owns chrome, insert set, send/schedule, and shapes. Document owns a separate **DocumentComposer** — do not reuse this component as the page body.

| Field       | Value                                                             |
| ----------- | ----------------------------------------------------------------- |
| Kind        | Conversation-derived composer (multiple **shapes**)               |
| Primary job | Author a message and send or schedule without leaving the channel |
| Engine      | Shared TipTap infrastructure                                      |

### Shapes

Same engine; shape selects chrome and insert set.

| Shape               | Context                 | Notes                                                                    |
| ------------------- | ----------------------- | ------------------------------------------------------------------------ |
| **Channel message** | Footer of main scroller | Full insert priority table; Send + schedule                              |
| **Thread reply**    | Thread pane footer      | Narrower; drop P3 first, then some P2. Keep P1 (mention, image, attach). |

### Layout (channel shape)

- Bottom-anchored under the scroller.
- Regions: **RichTextComposer** · **action row** (inserts + Send / schedule) · **RichTextSelectionMenu** (ephemeral). Slash `/` and `@` from infrastructure.
- Quiet chrome; outer **border** on the composer shell. Must stay compact — not a second app toolbar.

### Composer states

| State            | Behavior                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| Empty            | Placeholder; Send enabled only if staged image/attachment exists                 |
| Drafting         | Send enabled when TipTap has content **or** staged image/attachment              |
| Selection active | Bubble visible (infrastructure)                                          |
| Narrow           | Lower-priority actions in More                                           |
| Sending          | Prevent double-send; keep draft until ack                                |
| Scheduling       | SchedulePopover open; commit path is schedule                            |
| Failed           | Keep draft; show retry **inline** (not a toast — [toast.md](./toast.md)) |
| No permission    | Replaced by PermissionEmpty                                              |
| Offline          | Queue or block (TBD)                                                     |

Message bodies use **RichTextPreview** (`RichTextSubtree` over `JSONContent`), never `v-html` of a string.

### Decision-rule notes

- First minute: type + Send are non-negotiable Layer 1.
- Markers on **selection**, not a permanent formatting strip.
- Inserts always available via action row + More, not selection-only.
- Ambient shortcuts must not be the only path to Send, mention, or attach.

---

## Surface states

| State         | UI                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------- |
| Loading       | Scroller skeletons / muted placeholder; composer deferred or disabled until permission known |
| Empty channel | Friendly empty + composer ready (if allowed)                                                 |
| Ready         | Virtualized scroller + composer as above                                                     |
| Around focus  | Timeline recentered on jumped message; stick-to-bottom paused until back at live edge        |
| Thread open   | Split pane (desktop, resize + fade-in) or full-replace (small, fade-in)                      |
| Error (load)  | Inline error + retry; don’t wipe a usable composer draft                                     |
| Forbidden     | Entire surface or read-only explanation; no message payloads                                 |

---

## Messaging cut (task sequencing)

Ship the full composer insert set, but **separate implementation tasks** (order flexible after core list/send):

1. Core messaging + virtualized window + quotes jump + threads layout  
2. Typing + presence  
3. Attachments / images (incl. attachment-only send)  
4. Polls  
5. Schedule (+ recurrence as follow-on within schedule)  
6. Screen recording → **upload/attach** into the conversation (not download-only)  
7. Unread badges + **New divider** + floating jump-to-latest polish  

---

## Resolved decisions

| Question | Decision |
| --- | --- |
| Jump-to-latest chrome | **Floating pill** (Floating UI), clipped to timeline |
| Thread chrome | **Split pane** + resize + fade-in; **full replace** + fade-in on small viewports |
| Typing / presence in v1 | **Yes** — conversation viewers; workspace green dots on **1:1** DMs + members (**not** group DM rows) |
| Attachment-/image-only send | **Yes** |
| Poll / recording / schedule | **In messaging cut**, separate tasks; recording must attach |
| DM header “creation-context space label” | **Omit for v1** — see note below |
| Message grouping / timestamp density | **Day** sticky + **same-author / 5 min** groups; one timestamp per group |
| Quote preview outside window | Join-on-read: TipTap `body` (strip images; 1000 chars + 8 KiB) + plain **`displayContent`** (≤160); UI **`max-h-40` + gradient** |
| Unread | Slack-like **New divider** in timeline **plus** nav badges (not badge-only) |
| Multi-peer DM presence | **No** green dot on group DM rows (1:1 + member lists only) |

**DM creation-context space label:** DMs may store optional `space_id` as “where this DM was started” (filing context only — not ACL). Showing that space’s title in the DM header (e.g. “from Core Platform”) was the open question. **v1: do not show it** — DM identity is the participant set; optional context can wait.

---

## Open questions

- Mentions invalid-id UX; upload size/type limits (numbers) — also [ATTACHMENTS.md](../ATTACHMENTS.md).
- Soft-archive: who can archive a DM vs regular (peers vs canManage).
- Draft TTL / offline cache — [MESSAGE-DRAFTS.md](../MESSAGE-DRAFTS.md).

### Note: join-on-read vs snapshot vs sliding window

List/get joins TipTap **`body`** (images stripped; 1000 chars + 8 KiB) plus plain **`displayContent`** (≤160) for Inbox. SoT stays `quotes_id`. Timeline fade is **`max-h-40` overflow + gradient**. Jump uses `around=Q`; preview ≠ window membership. Socket payloads use the same DTO shape.

---

## Lessons from Epicstory (prototype) vs denser target

Epicstory (`app` channels + `api` channel) was a full Slack-like prototype. Use it for product affordances and a few UI gems; use **frontend-architecture** for list/window correctness.

### Port / specify in denser (Epicstory had; denser specs were thin or missing)

| Area | Epicstory lesson | Denser target |
| --- | --- | --- |
| Typing | Pulse composable + banner TTL | **v1** — locked above |
| Presence | Workspace presence + channel viewers | **Both** — header avatars (conversation) + green dots (workspace) |
| Jump to latest | Floating control over scroller | **Floating pill** + Floating UI |
| Threads | Drawer-style thread | **Split + resize + fade**; **full replace** on small |
| Drafts | Local + server dual-write / purge | **[MESSAGE-DRAFTS.md](../MESSAGE-DRAFTS.md)** — server-authoritative v1; defer dual-write + drawer |
| Attachments | Stage + multi-parent refs + reclaim cron | **[ATTACHMENTS.md](../ATTACHMENTS.md)** — workspace pool + joins; schedule via [SCHEDULING.md](../SCHEDULING.md) |
| Polls / schedule | Full services + reactions | Messaging cut; schedule → [SCHEDULING.md](../SCHEDULING.md) |
| Recording | Mostly download stub | Must **attach** into conversation |
| Code blocks | Peek/expand + floating Collapse in scrollport | Spec’d in rich-text + timeline |
| Unread | Counts + mark-read + **New divider** (Slack-like) | Locked |
| Meetings | Channel-embedded / always-on meeting channels; PeerJS mesh in epicstory | **[MEETINGS.md](../MEETINGS.md)** — room artifact + instances; SFU |

### Improve in denser beyond Epicstory

| Area | Epicstory weakness | Denser / FA improvement |
| --- | --- | --- |
| Message window | Weaker sliding-window / eviction story | FA `next`/`prev`/`around` + bounded pages + virtualization |
| Optimism | Less explicit `client_id` reconcile | Required `client_id` on optimistic send |
| Domain model | Channel-centric entity | Conversation **artifact** (regular \| direct) + space ACL / DM **peers** |
| Meetings | Channel-embedded call rooms; PeerJS mesh; always-on meeting channels | Meeting **room** artifact + Meeting instances; SFU; ≤1 live per room |
| Quotes vs threads | Present but easier to conflate | Explicitly complementary (`quotes_id` ∥ `thread_id`) |
| TipTap | Rich text present | TipTap JSON as SoT; no `v-html` highlight strings |
| Recording | Download-only feel | Attach as first-class message media |
| Thread chrome | Drawer default | Responsive split vs full-replace with motion |

Reference implementations: Epicstory `CodeBlockCard.vue` / `code-block-card-model.ts`; FA `list-messages` + activity window; denser docs above.

---

## Changelog

| Date       | Change                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| 2026-09-04 | Message drafts → MESSAGE-DRAFTS.md (server-authoritative; defer dual-write). |
| 2026-09-04 | Grill sync: peers not members; unread mark-read-on-open; quote constants; blob port. |
| 2026-09-04 | Quote preview: ~1k text chars + byte ceiling; strip images; `displayContent` for Inbox. |
| 2026-09-04 | Quote preview: wire size-cap + UI max-h/gradient (drop line budgets). |
| 2026-09-04 | Quote preview DTO: truncated TipTap JSON, smart line budget, bottom gradient. |
| 2026-09-04 | Lock quote join-on-read; Slack-like unread divider; no presence on group DM rows.   |
| 2026-09-04 | Presence both scopes; message grouping (day + 5 min author); Meeting room ≠ Conversation. |
| 2026-09-04 | Lock jump pill, thread split/full-replace, typing/presence, attach-only send; code-block floating collapse; messaging-cut task split. |
| 2026-09-04 | Virtualized sliding window; quotes + jump/`around`; `client_id` optimism; quotes ∥ threads. |
| 2026-08-10 | Initial Conversation UI surface spec from guideline + prior MessageComposer draft.  |
| 2026-08-11 | Lock TipTap; thread keeps P1 inserts; sticky day separators.                        |
| 2026-08-11 | Composer chrome moved to `rich-text-composer.md`; Theme/Toast are sibling surfaces. |
| 2026-08-11 | MessageComposer owned here again; shared file is engine infrastructure only.        |
| 2026-08-26 | Conversation artifact model; regular vs direct kinds; single view per tab.          |
