# Conversation

**Status:** Draft  
**Kind:** Capability UI (channel / conversation surface)  
**Density:** Calm–medium ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md))  
**Feature spec:** [FEATURE-SPECS.md — Conversation](../FEATURE-SPECS.md#conversation-draft)  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)  
**Prototype (throwaway HTML):** [prototype-conversation.html](./prototype-conversation.html) — open in a browser (no build).  
**Presentational (Vue):** `packages/app/src/features/conversation/presentationals/` — full screen: `ConversationPrototype` (Storybook `pnpm storybook:app` → `features/conversation/ConversationPrototype`; stories in `features/conversation/stories/`).

---

## Intent

Persistent discussion among people who can access the channel: read history, react, reply in threads, and author rich messages without leaving the flow.

The surface should feel **calm by default** (message stream dominates) while keeping **posting essentials** on screen. Power inserts stay reachable; container width drives how many action-row controls are visible, not whether they exist.

---

## Layout / sectioning

```text
┌─ Conversation surface (canvas) ──────────────────┬─ Thread card ─┐
│ Header                                           │ Header        │
│ Message scroller                                 │ Messages      │
│ MessageComposer (inset card)                     │ Reply composer│
└──────────────────────────────────────────────────┴───────────────┘
```

| Region | Job | Density |
| --- | --- | --- |
| **Header** | Orient: which channel, who is here, channel-level actions | Calm chrome; shared `--surface-header-height` with Thread |
| **Message scroller** | Read and act on history | Calm–medium; content-first |
| **Thread pane** (when open) | Focused side conversation | **Distinct elevated card**: `rounded-2xl`, `card` / elevated fill, shadow — not a flush split pane |
| **MessageComposer** | Author and send / schedule | Quiet chrome; essentials persistent; outer **border** on composer shell |

Shared app shell (nav sidebar, space switcher) stays outside this surface; Conversation owns only the content column above.

---

## Sub-components

| Sub-component | Role | Spec depth |
| --- | --- | --- |
| **ChannelHeader** | Title, topic/description (if any), member/presence affordances, channel menu | Below |
| **MessageScroller** | Virtualized/windowed list, sticky date separators, scroll-to-bottom / jump-to-latest | Below |
| **MessageItem** | Author, timestamp, rich body, attachments/embeds, reactions, hover/focus actions | Below |
| **MessageGroup** | Consecutive messages from same author (collapsed chrome) | Light |
| **ThreadPane** | Parent summary + thread scroller + composer (thread shape) | Below |
| **MessageComposer** | Rich editor + action row + bubble menu; multiple shapes | [Detailed](#messagecomposer) |
| **SchedulePopover** | Presets, custom time, recurrence (opened from composer) | Under composer |
| **MoreOverflowMenu** | Action-row controls that don’t fit | Under composer |
| **PermissionEmpty** | Replaces composer when user cannot post | States |

Design-system primitives (Button, Avatar, Bubble, MessageScroller UI kit, etc.) are implementation detail; this doc names **product** sub-components.

---

## Features

| Feature | Where it lives | Notes |
| --- | --- | --- |
| Read channel history | MessageScroller | Cursor/window load; stable order |
| Jump to latest / unread | Scroller + header or floating control | TBD exact chrome |
| Post rich message | MessageComposer (channel shape) | Send Layer 1 |
| Format selection | Composer bubble menu | Bold, italic, strike, blockquote, link, … |
| Mention | Composer action row + in-field complete | |
| Image / attachment | Composer action row | |
| Code block | Composer action row | |
| Poll | Composer → poll flow | Phased in feature spec |
| Screen recording | Composer action row | Phased; permissioned |
| Schedule message | Composer → SchedulePopover | Presets + custom + recurrence |
| React to message | MessageItem | |
| Edit / delete own message | MessageItem actions | Permission rules in feature spec |
| Open / reply in thread | MessageItem → ThreadPane + composer thread shape | |
| Presence (viewing / typing) | Header and/or scroller | TBD v1 |
| Search in channel | Header or ambient | Likely Layer 2/3 |

---

## Data (UI-facing)

UI consumes the Conversation feature model; it does not invent a second schema. Summary of what this surface binds:

| UI need | Source objects / fields |
| --- | --- |
| Channel title, id | Channel |
| Message list | Message (`id`, `author_id`, `body`, timestamps, `thread_id`, attachments/embeds) |
| Author display | User (avatar, display name) via author id |
| Reactions | Reaction aggregates per message |
| Thread | Messages with same `thread_id` + parent message |
| Composer draft | Local UI state until send/schedule succeeds |
| Schedule | ScheduledMessage (when phased) |
| Poll embed | Poll (when phased) |
| Can read / can post | Membership / permission |

Realtime: apply `message.*` / `reaction.*` (and schedule events if any) into the same replica the scroller reads — no divergent client cache. Details: feature spec.

---

## Visible vs hidden UI and navigation

Chrome layers follow [VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md) decision rules.

### Channel surface

| Layer | Visible by default | Progressive / overflow | Ambient |
| --- | --- | --- | --- |
| **1 Persistent** | Header identity; message scroller; composer editor + Send; as many P1 composer actions as fit | — | — |
| **2 Progressive** | — | Channel menu (notifications, members, settings); message hover actions (edit, delete, pin TBD); thread open; composer **More** overflow; schedule panel; selection bubble when text selected | — |
| **3 Ambient** | — | — | Shortcuts, command palette jumps, slash inserts into composer |

### MessageComposer action-row priority (space-driven)

Always **available**; visibility depends on composer **container width**. Hide lowest priority first into **More**. Growing reveals in reverse. Prefer one action row + overflow — do not wrap into multiple icon rows.

| Priority | Control | Overflow? |
| --- | --- | --- |
| P0 | Rich text editor + **Send** | Never |
| P1 | Mention · Insert image · Insert attachment | Last among P1 |
| P2 | Insert code block · Insert poll | Yes |
| P3 | Screen recording · Schedule message | First to hide |

**Resize rule:** container width drives **visibility**, not **capability**. More must remain a labeled trail.

### Selection bubble (intent-driven, not resize-driven)

Shown only when the editor has a text selection. Not part of the permanent action row. Dismiss on clear selection / blur.

Markers (extend carefully): bold, italic, strike, blockquote, link, …

---

## Interactions

| Interaction | Result |
| --- | --- |
| Open channel | Load permissioned history window; place scroller (latest or unread TBD); mount channel-shape composer if can post |
| Scroll up | Fetch older page/window; preserve anchor |
| Hover / focus message | Reveal message actions (reply in thread, react, edit/delete if allowed) |
| React | Toggle reaction; optimistic UI gated by feature constraints |
| Reply in thread | Open ThreadPane; focus thread-shape composer |
| Type in composer | Draft local; enable Send when content (or allowed attachment-only) |
| Select text in composer | Show bubble menu; apply markers to selection |
| Click action-row insert | Run insert/mention/upload/poll/recording/schedule flow |
| Narrow resize | Demote action-row icons to More by priority |
| Send | Optimistic append or wait-for-ack (TBD); clear draft on success; keep draft + retry on failure |
| Schedule | Open SchedulePopover; commit creates ScheduledMessage; composer clears per rules |
| No post permission | Hide active composer; show PermissionEmpty |
| Offline | Queue or block send with clear copy (TBD with realtime) |

---

## MessageComposer

| Field | Value |
| --- | --- |
| Kind | Shared sub-component (multiple **shapes**) |
| Primary job | Author rich content and send or schedule without leaving conversation flow |

### Shapes

Same rich-text engine; shape selects chrome and insert set.

| Shape | Context | Notes |
| --- | --- | --- |
| **Channel message** | Footer of main scroller | Full insert priority table; Send + schedule |
| **Thread reply** | Thread pane footer | Narrower; may drop P3 / some P2 earlier |
| **Artifact comment** (later) | Outside Conversation surface | Smaller insert set; separate surface spec later |

### Layout (channel shape)

- Bottom-anchored under the scroller.
- Regions: **editor** · **action row** (inserts + Send / schedule entry) · **selection bubble** (ephemeral).
- Must stay compact — not a second app toolbar.

### Composer states

| State | Behavior |
| --- | --- |
| Empty | Placeholder; Send disabled or no-op |
| Drafting | Send enabled when allowed content |
| Selection active | Bubble menu visible |
| Narrow | Lower-priority actions in More |
| Sending | Prevent double-send; keep draft until ack |
| Scheduling | SchedulePopover open; commit path is schedule |
| Failed | Keep draft; show retry |
| No permission | Replaced by PermissionEmpty |
| Offline | Queue or block (TBD) |

### Decision-rule notes

- First minute: type + Send are non-negotiable Layer 1.
- Markers on **selection**, not a permanent formatting strip.
- Inserts always available via action row + More, not selection-only.
- Ambient shortcuts must not be the only path to Send, mention, or attach.

---

## Surface states

| State | UI |
| --- | --- |
| Loading | Scroller skeletons / muted placeholder; composer deferred or disabled until permission known |
| Empty channel | Friendly empty + composer ready (if allowed) |
| Ready | Scroller + composer as above |
| Thread open | Split or overlay ThreadPane; main scroller may dim or stay |
| Error (load) | Inline error + retry; don’t wipe a usable composer draft |
| Forbidden | Entire surface or read-only explanation; no message payloads |

---

## Open questions

- Unread / jump-to-latest chrome: floating pill vs header only?
- Thread: split pane vs drawer vs full replace on small viewports?
- Message grouping rules and timestamp density.
- Exact bubble marker set (lists, headings in bubble vs slash only).
- Attachment-only / image-only send allowed?
- Poll, recording, recurrence: which ship in first Conversation cut?
- Typing indicators and presence in v1?
- Channel vs Artifact under [ARTIFACTS-AND-SPACES.md](../ARTIFACTS-AND-SPACES.md) (product model — affects header/navigation, not only data).

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-08-10 | Initial Conversation UI surface spec from guideline + prior MessageComposer draft. |
