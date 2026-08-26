# Conversation

**Status:** Active (UI prototype; domain rules in [ARTIFACTS-AND-SPACES.md](../ARTIFACTS-AND-SPACES.md))  
**Kind:** Capability UI (conversation artifact surface)  
**Density:** Calm–medium ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md))  
**Feature spec:** [FEATURE-SPECS.md — Conversation](../FEATURE-SPECS.md#conversation)  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)  
**Presentational (Vue):** `packages/app/src/features/conversation/presentationals/` (Storybook `pnpm storybook:app` → `features/conversation/*`; stories in `features/conversation/stories/`). No shell chrome on this surface.  
**Composer:** **MessageComposer** — derived from [rich-text-composer.md](./rich-text-composer.md) (engine only; this file owns send chrome).

---

## Intent

Persistent discussion among people who can access the conversation: read history, react, reply in threads, and author rich messages without leaving the flow.

The surface binds to a **Conversation artifact** opened as a **space tab** (regular) or from **Direct messages** (direct). There is **one default view** — no view-mode picker on this tab.

| Kind | Where opened | Listing | Access |
| ---- | ------------ | ------- | ------ |
| **Regular** | Space tab, This Space | This Space gallery | Space ACL (v1) |
| **Direct (DM)** | Direct messages nav | DM sidebar only | `conversation_member` |

Notification and header chrome may differ by kind (channel-style vs DM-style); the message surface is the same.

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
| **Header**                  | Orient: which channel, who is here, channel-level actions | Calm chrome; shared `h-surface-header` with Thread                                          |
| **Message scroller**        | Read and act on history                                   | Calm–medium; content-first                                                                         |
| **Thread pane** (when open) | Focused side conversation                                 | **Distinct elevated card**: `rounded-2xl`, `card` / elevated fill, shadow — not a flush split pane |
| **MessageComposer**         | Author and send / schedule                                | Derived composer; [below](#messagecomposer)                                                        |

Shared app shell (nav sidebar, space switcher) stays outside this surface; Conversation owns only the content column above. Theme / Toast are [theme.md](./theme.md) / [toast.md](./toast.md), not this surface.

---

## Sub-components

| Sub-component                                   | Role                                                                                                | Spec depth                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| **ChannelHeader**                               | Title, topic/description (if any), member/presence affordances, channel menu                        | Below                        |
| **ConversationIntro**                           | Start-of-history “channel beginning”: title, intro copy, edit description, add people               | Light                        |
| **Timeline** (`ConversationTimeline`)           | Windowed history (DS `MessageScroller`), **sticky** date separators, scroll-to-bottom / jump-to-latest | Below                     |
| **Message** (`ConversationMessage`)             | Rich body, attachments/embeds, reactions, hover/context menus (DS `Message` is layout only)         | Below                        |
| **MessageGroup** (`ConversationMessageGroup`)   | Same-author, near-in-time cluster: avatar + name/time once, slotted messages (≠ DS `MessageGroup`)  | Light                        |
| **ThreadPane**                                  | Parent summary + thread timeline + MessageComposer (thread)                                         | Below                        |
| **MessageComposer**                             | Channel / thread chrome over the shared editor                                                      | [Detailed](#messagecomposer) |
| **PermissionEmpty**                             | Replaces MessageComposer when user cannot post                                                      | States                       |

Design-system primitives (Button, Avatar, Bubble, MessageScroller UI kit, DS `Message` / `MessageGroup` layout, etc.) are implementation detail; this doc names **product** sub-components.

---

## Features

| Feature                      | Where it lives                                   | Notes                                                              |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| Read channel history         | Timeline                                         | Cursor/window load; stable order                                   |
| Jump to latest / unread      | Timeline + header or floating control            | TBD exact chrome                                                   |
| Post rich message            | MessageComposer (channel)                        | Send Layer 1                                                       |
| Format selection             | MessageComposer → RichTextSelectionMenu / slash  | [Standard formatting](./rich-text-composer.md#standard-formatting) |
| Mention / image / attachment | MessageComposer action row                       |                                                                    |
| Code block / poll            | MessageComposer action row                       | Poll phased                                                        |
| Screen recording / schedule  | MessageComposer action row                       | Phased; schedule → SchedulePopover                                 |
| React to message             | Message                                          |                                                                    |
| Edit / delete own message    | Message actions                                  | Permission rules in feature spec                                   |
| Open / reply in thread       | Message → ThreadPane + composer thread shape     |                                                                    |
| Presence (viewing / typing)  | Header and/or scroller                           | TBD v1                                                             |
| Search in channel            | Header or ambient                                | Likely Layer 2/3                                                   |

---

## Data (UI-facing)

UI consumes the Conversation feature model; it does not invent a second schema. Summary of what this surface binds:

| UI need             | Source objects / fields                                                          |
| ------------------- | -------------------------------------------------------------------------------- |
| Conversation title, id, kind | Conversation artifact (`regular` \| `direct`)                           |
| Message list        | Message (`id`, `author_id`, `body`, timestamps, `thread_id`, attachments/embeds) |
| Author display      | User (avatar, display name) via author id                                        |
| Reactions           | Reaction aggregates per message                                                  |
| Thread              | Messages with same `thread_id` + parent message                                  |
| Composer draft      | Local UI state until send/schedule succeeds                                      |
| Schedule            | ScheduledMessage (when phased)                                                   |
| Poll embed          | Poll (when phased)                                                               |
| Can read / can post | Space ACL (regular) or conversation_member (direct)                              |

Realtime: apply `message.*` / `reaction.*` (and schedule events if any) into the same replica the scroller reads — no divergent client cache. Details: feature spec.

---

## Visible vs hidden UI and navigation

Chrome layers follow [VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md) decision rules.

### Channel surface

| Layer             | Visible by default                                                                            | Progressive / overflow                                                                                                                                       | Ambient                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **1 Persistent**  | Header identity; message scroller; composer editor + Send; as many P1 composer actions as fit | —                                                                                                                                                            | —                                                             |
| **2 Progressive** | —                                                                                             | Channel menu (notifications, members, settings); message hover actions (edit, delete, pin TBD); thread open; composer **More** / schedule / selection bubble | —                                                             |
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

| Interaction                      | Result                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Open channel                     | Load permissioned history window; place scroller (latest or unread TBD); mount channel-shape composer if can post |
| Scroll up                        | Fetch older page/window; preserve anchor                                                                          |
| Hover / focus message            | Reveal message actions (reply in thread, react, edit/delete if allowed)                                           |
| React                            | Toggle reaction; optimistic UI gated by feature constraints                                                       |
| Reply in thread                  | Open ThreadPane; focus thread-shape composer                                                                      |
| Type / select in MessageComposer | Draft local; bubble + markers from infrastructure; Send when content (or allowed attachment-only)                 |
| Click action-row insert          | Run mention / upload / poll / recording / schedule flow                                                           |
| Narrow resize                    | Demote action-row icons to More by priority                                                                       |
| Send                             | Optimistic append or wait-for-ack (TBD); clear draft on success; keep draft + retry on failure                    |
| Schedule                         | Open SchedulePopover; commit creates ScheduledMessage; composer clears per rules                                  |
| No post permission               | Hide MessageComposer; show PermissionEmpty                                                                        |
| Offline                          | Queue or block send with clear copy (TBD with realtime)                                                           |

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
| Empty            | Placeholder; Send disabled or no-op                                      |
| Drafting         | Send enabled when allowed content                                        |
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
| Ready         | Scroller + composer as above                                                                 |
| Thread open   | Split or overlay ThreadPane; main scroller may dim or stay                                   |
| Error (load)  | Inline error + retry; don’t wipe a usable composer draft                                     |
| Forbidden     | Entire surface or read-only explanation; no message payloads                                 |

---

## Open questions

- Unread / jump-to-latest chrome: floating pill vs header only?
- Thread: split pane vs drawer vs full replace on small viewports?
- Message grouping rules and timestamp density.
- Typing indicators and presence in v1?
- Attachment-only / image-only send allowed?
- Poll, recording, recurrence: which ship in first messaging cut?
- DM header: show optional creation-context space label?

---

## Changelog

| Date       | Change                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| 2026-08-10 | Initial Conversation UI surface spec from guideline + prior MessageComposer draft.  |
| 2026-08-11 | Lock TipTap; thread keeps P1 inserts; sticky day separators.                        |
| 2026-08-11 | Composer chrome moved to `rich-text-composer.md`; Theme/Toast are sibling surfaces. |
| 2026-08-11 | MessageComposer owned here again; shared file is engine infrastructure only.        |
| 2026-08-26 | Conversation artifact model; regular vs direct kinds; single view per tab.          |
