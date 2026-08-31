# Rich-text composer (infrastructure)

**Status:** Draft  
**Kind:** Shared infrastructure (not a View)  
**Density:** Host-owned ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md))  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)  
**Presentational (Vue):** `packages/app/src/modules/rich-text/` (Storybook `pnpm storybook:app` → `modules/rich-text/*`).

Capability Views derive their own composers from this infrastructure. They do not share one product composer.

| Derived composer     | Host View    | Spec                                 |
| -------------------- | ------------ | ------------------------------------ |
| **DocumentComposer** | Document     | [document.md](./document.md)         |
| **MessageComposer**  | Conversation | [conversation.md](./conversation.md) |

This file does **not** specify send, schedule, action rows, channel/thread shapes, or page title chrome.

---

## Intent

One rich-text engine, one ProseMirror JSON document, and one visual language for nodes — so **RichTextComposer** (edit) and **RichTextPreview** (read) look the same.

Hosts wrap this with their own chrome (page vs message, persist vs send). Reuse TipTap extensions; do not hand-roll menus, highlighting, or `execCommand`.

---

## Layout / sectioning

```text
┌─ RichTextComposer ──────────────────────────────────┐
│ ProseMirror document                                 │
│ RichTextSelectionMenu   (text selection → marks)     │
│ RichTextSlashMenu       (`/` → commands)             │
│ RichTextMentionMenu     (`@` → people)               │
└──────────────────────────────────────────────────────┘

┌─ RichTextPreview ───────────────────────────────────┐
│ RichTextSubtree (JSONContent root)                   │
└──────────────────────────────────────────────────────┘
```

Where this sits (page body, message footer, thread footer, message item) is the host View’s layout.

---

## Sub-components

| Component                  | Role                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **RichTextComposer**       | Editable TipTap editor. Marks and inserts are TipTap commands / extensions — not `document.execCommand`.                                    |
| **RichTextSelectionMenu**  | Vue `BubbleMenu` from `@tiptap/vue-3/menus`. Marks + block-type when there is a **text selection**. BubbleMenu **owns** show/hide/position. |
| **RichTextSlashMenu**      | `@tiptap/suggestion` with `char: '/'` + **RichTextSuggestionMenu** positioned with **`@floating-ui/dom`**.                                  |
| **RichTextMentionMenu**    | `@tiptap/extension-mention` (`char: '@'`) + the same suggestion list + Floating UI.                                                         |
| **RichTextSuggestionMenu** | Shared list chrome (items, highlight, keyboard). Suggestion does **not** ship this popover — we render it and position it.                  |
| **RichTextCodeBlock**      | Code-block **NodeView**: highlighted body + language dropdown (composer). Preview is highlight + language label, no dropdown.               |
| **RichTextSubtree**        | Recursive renderer of one `JSONContent` node (and children). Owns every node/mark type in this schema.                                      |
| **RichTextPreview**        | Read-only document: `RichTextSubtree` on the root `JSONContent`. No editor, no menus. Never `v-html` of a string.                           |

Host chrome (Send, More, SchedulePopover, title field) is **not** this infrastructure. Mention **candidates** (who can be @’d) and image **upload** are host ports; the node types and menus are here.

---

## TipTap plugins (reuse, don’t replace)

| Need                        | Use                                                                                  | Do not                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Editor                      | `@tiptap/vue-3` + StarterKit (minus default code-block if replaced)                  | Handmade contenteditable                                                   |
| Selection marks menu        | Vue **BubbleMenu** (`@tiptap/vue-3/menus`) → **RichTextSelectionMenu**               | Timed `div` over `getBoundingClientRect`                                   |
| Slash / mention **logic**   | **Suggestion** (`@tiptap/suggestion`) and **Mention** (`@tiptap/extension-mention`)  | BubbleMenu; parsing `/` or `@` by hand                                     |
| Slash / mention **popover** | **`@floating-ui/dom`** via Suggestion `props.mount(el)` → **RichTextSuggestionMenu** | Tippy; handmade `getBoundingClientRect`; TipTap **FloatingMenu** extension |
| Empty-line insert strip     | TipTap **FloatingMenu** only if we add that chrome later                             | BubbleMenu on empty caret                                                  |
| Link                        | `@tiptap/extension-link` (StarterKit / Link)                                         |                                                                            |
| Blockquote                  | `@tiptap/extension-blockquote` (StarterKit)                                          |                                                                            |
| Lists / tasks               | StarterKit lists + `@tiptap/extension-task-list` / `task-item`                       |                                                                            |
| Code + highlight            | `@tiptap/extension-code-block-lowlight` + **lowlight**                               | `v-html` of highlighted HTML; a second highlighter in Preview              |
| Image node                  | `@tiptap/extension-image`                                                            |                                                                            |
| Drop / paste files          | `@tiptap/extension-file-handler`; host performs upload                               |                                                                            |
| Placeholder                 | `@tiptap/extension-placeholder` (copy is host-owned)                                 |                                                                            |

### Menus: BubbleMenu vs Suggestion vs Floating UI

Three different jobs. Do not collapse them into one component.

| Job                           | Package                                    | What it gives you                                               | What it does **not** give you              |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------ |
| Marks on a **text selection** | Vue **BubbleMenu** (`@tiptap/vue-3/menus`) | Show/hide + position of **RichTextSelectionMenu**               | Slash / `@` query, item lists              |
| `/` and `@` **query**         | **Suggestion** + **Mention**               | Trigger char, query, `items`, keyboard, `command`, `clientRect` | A Vue floating popover (unlike BubbleMenu) |
| Position the suggestion list  | **`@floating-ui/dom`**                     | `computePosition` / `autoUpdate` / flip / offset / shift        | Trigger detection                          |

**BubbleMenu** is selection-only. `shouldShow` only filters that. Do not reuse it for slash or mentions.

**Suggestion / Mention** are the logic layer. Mention is Suggestion with `char: '@'` and a mention node. Slash is Suggestion with `char: '/'` wrapping commands (no first-party Slash package — wrap Suggestion). They expose `render()` hooks and a cursor rect; they do **not** implement a floating menu the way BubbleMenu does.

**Positioner:** `@floating-ui/dom` (same library BubbleMenu already uses). Lock:

1. Install `@floating-ui/dom` next to TipTap Vue menus.
2. In Suggestion `render`, mount **RichTextSuggestionMenu** and call **`props.mount(element)`** — TipTap then positions with Floating UI (`placement`, `offset`, `flip`, `autoUpdate`). Extra middleware (`shift`, `size`) via Suggestion `floatingUi.middleware` imported from `@floating-ui/dom` (see `suggestionFloating.ts`).
3. Call the returned `unmount` in `onExit`.
4. Manual `computePosition(reference, el, props.floatingUi)` only as an escape hatch (no scroll following unless we add `autoUpdate` ourselves). Denser does **not** use the hand-rolled loop (that pattern was needed before TipTap Suggestion `mount` in 3.27).

Do **not**: Tippy, a second VueUse `useFloating` loop beside `mount()`, or TipTap’s **FloatingMenu** extension (that is empty-line insert chrome, not `/` / `@`). Out of v1 unless a host wants empty-line chips.

---

## Shared node styles

**RichTextComposer** (TipTap DOM) and **RichTextSubtree** (preview DOM) must use the **same CSS classes** per node/mark type.

- One stylesheet (e.g. `rich-text.css`). Selectors are the `rt-*` classes below.
- Tailwind **`@apply`** in that stylesheet — not duplicated utility strings on every Vue node.
- TipTap extensions set `HTMLAttributes.class` to the same `rt-*` class **RichTextSubtree** puts on the matching element.
- Theme tokens (`foreground`, `muted`, `border`, …) only — no one-off hex in this layer ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md)).

| `JSONContent.type` / mark                 | Class                                                        | Notes                                                              |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `doc`                                     | —                                                            | Fragment wrapper                                                   |
| `paragraph`                               | `rt-paragraph`                                               |                                                                    |
| `heading` (`attrs.level` 1–3)             | `rt-heading-1` … `rt-heading-3`                              |                                                                    |
| `bulletList` / `orderedList` / `listItem` | `rt-bullet-list` / `rt-ordered-list` / `rt-list-item`        |                                                                    |
| `taskList` / `taskItem`                   | `rt-task-list` / `rt-task-item`                              |                                                                    |
| `blockquote`                              | `rt-blockquote`                                              | Left rule + muted inset                                            |
| `codeBlock`                               | `rt-code-block` + `rt-code-token-*`                          | Chrome + language control in composer; token spans, never `hljs-*` |
| `horizontalRule`                          | `rt-hr`                                                      |                                                                    |
| `image`                                   | `rt-image`                                                   |                                                                    |
| `mention`                                 | `rt-mention`                                                 |                                                                    |
| `hardBreak`                               | —                                                            | `<br>`                                                             |
| `text` + marks                            | `rt-bold` `rt-italic` `rt-strike` `rt-inline-code` `rt-link` | Marks wrap text                                                    |

Unknown `type`: render children as text only — never pass the node through `v-html`.

---

## Features

| Feature             | Notes                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| Edit document       | Canonical body is TipTap / ProseMirror `JSONContent`, not an HTML string |
| Standard formatting | One schema — [below](#standard-formatting)                               |
| Format selection    | **RichTextSelectionMenu** (BubbleMenu)                                   |
| Slash commands      | **RichTextSlashMenu** (Suggestion `/`)                                   |
| Mentions            | **RichTextMentionMenu** (Mention `@`); host supplies `items`             |
| Images              | Image node + slash / drop / paste; host upload                           |
| Code blocks         | Lowlight highlight + language dropdown (composer)                        |
| Read-only render    | **RichTextPreview** → **RichTextSubtree**                                |
| History             | Undo / redo                                                              |

---

## Standard formatting

Every derived composer and every **RichTextSubtree** **must** understand this vocabulary. Hosts may add slash items and action-row entry points. They must not fork a smaller or larger _schema_ for the same document.

Still host-owned (not nodes here): poll, screen recording, generic file attachment (non-image).

### Marks (inline)

Toggle on the selection (or at the caret for the next typed characters).

| Mark            | Selection menu | Shortcut    | TipTap                                                                             |
| --------------- | -------------- | ----------- | ---------------------------------------------------------------------------------- |
| **Bold**        | Yes            | Mod+B       | StarterKit                                                                         |
| **Italic**      | Yes            | Mod+I       | StarterKit                                                                         |
| **Strike**      | Yes            | Mod+Shift+S | StarterKit                                                                         |
| **Inline code** | Yes            | Mod+E       | StarterKit                                                                         |
| **Link**        | Yes            | Mod+K       | Link. URL field in the selection menu; unlink when the selection is already a link |

No underline (collides with links). No font color, highlight, or size marks — hierarchy is headings + weight, not a palette.

### Blocks and complex nodes

Default block is a **paragraph**. Nested lists: Tab / Shift+Tab.

| Node             | Slash             | Selection menu | Shortcut     | TipTap / UI                                                   |
| ---------------- | ----------------- | -------------- | ------------ | ------------------------------------------------------------- |
| **Paragraph**    | `/text`           | Block-type     |              | StarterKit                                                    |
| **Heading 1–3**  | `/h1` `/h2` `/h3` | Block-type     | Mod+Alt+1..3 | StarterKit. No H4–H6                                          |
| **Bullet list**  | `/bullet` `/ul`   | Block-type     | Mod+Shift+8  | StarterKit                                                    |
| **Ordered list** | `/number` `/ol`   | Block-type     | Mod+Shift+7  | StarterKit                                                    |
| **Task list**    | `/todo` `/task`   | Block-type     |              | TaskList / TaskItem. Checkbox toggles in composer and preview |
| **Blockquote**   | `/quote`          | Block-type     | Mod+Shift+B  | Blockquote. Nested quotes allowed; `rt-blockquote`            |
| **Code block**   | `/code`           | Block-type     | Mod+Alt+C    | [Code block](#code-block)                                     |
| **Image**        | `/image`          | —              |              | [Image](#image)                                               |
| **Mention**      | —                 | —              | `@`          | [Mention](#mention)                                           |
| **Divider**      | `/divider` `/hr`  | —              |              | HorizontalRule; slash only                                    |
| **Hard break**   | —                 | —              | Shift+Enter  | Enter is host-owned (send vs newline)                         |

### Code block

- Extension: **CodeBlockLowlight** + shared **lowlight** instance (same languages in composer and preview).
- `attrs.language` on the node. Fence shortcut: ` ```ts ` sets language.
- **Composer:** **RichTextCodeBlock** NodeView — highlighted editable region + **language dropdown** (lowlight’s registered languages + plaintext). Changing the dropdown sets `language` and re-highlights.
- **Preview:** **RichTextSubtree** highlights with the same lowlight; show language as a label, not a dropdown.
- Highlight output is a token tree rendered as spans (`rt-code-block` + token classes). Do **not** `v-html` lowlight/HTML strings ([unsafe-html](../../.cursor/skills/frontend-patterns/rules/unsafe-html.md)).
- Tab indentation: `enableTabIndentation: true` inside code blocks.

### Image

- Extension: **Image** (`@tiptap/extension-image`). Block-level (`inline: false`). `allowBase64: false`.
- `attrs`: `src`, `alt`, `title`. `src` is a host-served URL after upload — not a data URL.
- Insert: slash `/image`, paste, drop (**FileHandler**). Host port: `upload(file) → url`.
- **RichTextSubtree**: `<img class="rt-image">` from attrs. No editor NodeView required for v1; resize handles later (`Image.configure({ resize })`).

### Mention

- Extension: **Mention**. Suggestion `char: '@'`. Node attrs: `id`, `label`.
- **RichTextMentionMenu** renders via **RichTextSuggestionMenu**. Host `items({ query })` returns permissioned people.
- Inserted node is atomic; **RichTextSubtree** renders `rt-mention` from `label` (not a raw `@id` string).
- Invalid / unknown id: muted label; do not drop the node.

### How chrome maps to commands

| Entry         | When                                                       | Component                              | What it exposes                                                             |
| ------------- | ---------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| **Selection** | Non-empty text selection (hide inside code blocks)         | **RichTextSelectionMenu** (BubbleMenu) | Marks + block-type (not divider, not image)                                 |
| **Slash**     | `/` query (allow at block start; filter as the user types) | **RichTextSlashMenu** (Suggestion)     | All blocks including divider + image. Hosts append extras after a separator |
| **Mention**   | `@` query                                                  | **RichTextMentionMenu** (Mention)      | People from the host port                                                   |
| **Keyboard**  | Editor focused                                             | —                                      | Shortcuts above + Mod+Z / Mod+Shift+Z                                       |

Marks and block type live on **selection / slash**, not a permanent formatting strip. Hosts may also put insert buttons on an action row.

### Out of this schema (v1)

Tables, text align, indent-as-style (use lists), subscript/superscript, highlight, color, embed widgets, generic file chips.

---

## Data (UI-facing)

| UI need                      | Source                         |
| ---------------------------- | ------------------------------ |
| Document                     | `JSONContent` (`@tiptap/core`) |
| Selection / suggestion range | Editor state (ephemeral)       |
| Mention items                | Host port                      |
| Image `src`                  | Host upload result             |

No Message, Channel, Artifact, or ScheduledMessage types here.

---

## Visible vs hidden UI and navigation

| Layer             | This infrastructure                                                    | Hosts add                           |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| **1 Persistent**  | RichTextComposer / RichTextPreview                                     | Send, title, page body, …           |
| **2 Progressive** | RichTextSelectionMenu; slash / mention menus while the query is active | Action rows, More                   |
| **3 Ambient**     | Formatting shortcuts                                                   | Command palette (app-wide, not `/`) |

---

## Interactions

| Interaction                       | Result                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| Type                              | Update the document                                         |
| Select text                       | Show **RichTextSelectionMenu**; marks + block-type          |
| Type `/`                          | Open **RichTextSlashMenu**; filter; Enter runs the command  |
| Type `@`                          | Open **RichTextMentionMenu**; filter; Enter inserts mention |
| Escape                            | Dismiss the active suggestion or selection menu             |
| Language dropdown on a code block | Set `attrs.language`; re-highlight                          |
| Drop / paste image                | Host upload → `setImage({ src })`                           |
| Tab / Shift+Tab in a list         | Nest / lift                                                 |
| Shift+Enter                       | Hard break                                                  |
| Clear selection / blur            | Hide selection menu                                         |

---

## Editor states

| State                  | Behavior                                                |
| ---------------------- | ------------------------------------------------------- |
| Empty                  | Placeholder (copy is host-owned)                        |
| Drafting               | Document non-empty                                      |
| Selection active       | RichTextSelectionMenu visible                           |
| Slash / mention active | Matching suggestion menu visible; selection menu hidden |
| Read-only              | RichTextPreview; no menus                               |
| Disabled               | No input (host: sending, loading, no permission)        |

Failed send, scheduling, autosave, and permission empty are **host** states.

---

## Derived composers

A derived composer = **RichTextComposer** + host chrome + host slash extras + host persist/send + host mention/upload ports.

| Must stay here                                      | Must stay on the host                             |
| --------------------------------------------------- | ------------------------------------------------- |
| Schema, `rt-*` styles, RichTextSubtree              | Layout in the View                                |
| Selection / slash / mention menus                   | Which **host** inserts are P0–P3                  |
| Code highlight + language, image node, mention node | Send vs persist, schedule, retry, Enter-to-send   |
| RichTextPreview                                     | Mention `items`, image `upload`, permission empty |

Do not fork a second editor (`textarea`, handmade contenteditable) inside a View. Do not render bodies with `v-html`.

---

## Open questions

- Slash query aliases (`/todo` vs `/task`) — copy only; schema is fixed.
- Enter in a list: new item vs host send (MessageComposer — TBD on the host).
- Image resize handles in v1 vs later.
- Default code language: plaintext vs lowlight auto-detect (`defaultLanguage`).

---

## Changelog

| Date       | Change                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-11 | Extract from conversation.md; lock TipTap.                                                                                       |
| 2026-08-11 | Decouple from MessageComposer: this file is engine + document + bubble only.                                                     |
| 2026-08-11 | Lock standard formatting: marks, H1–H3, lists, quote, code, divider, slash + bubble.                                             |
| 2026-08-11 | Name RichTextComposer / SelectionMenu / Preview / Subtree; shared `rt-*` styles; code+image+mention; BubbleMenu ≠ Suggestion.    |
| 2026-08-11 | Lock Suggestion + Mention for `/` `@`; `@floating-ui/dom` via `props.mount` for the list popover (Suggestion is not BubbleMenu). |
