---
title: Design system primitives
impact: MEDIUM
description: >-
  Prefer @denser/design-system components over native HTML or ad-hoc scroll/tab
  chrome — ScrollArea, Tabs, Button, Select — unless the primitive imposes a
  real limitation.
tags: [design-system, scroll-area, tabs, button, select, layering]
---

## Trigger

App UI uses **native elements** or **hand-rolled chrome** where `@denser/design-system` already ships the primitive:

- `overflow-y-auto` / `overflow-auto` on a bounded list, menu, or panel
- `<button>` / `<select>` for interactive controls (not form autofill edge cases)
- Custom tab strips (`role="tablist"`, border-bottom toggles, manual `aria-selected`)
- Rebuilding dropdown / popover / dialog behavior (see [`handmade-interactivity.md`](handmade-interactivity.md))

Contract: [`references/folder-structure.md`](../references/folder-structure.md) (packages), [`handmade-interactivity.md`](handmade-interactivity.md) (widget decision tree).

## Rule

**Default to design-system primitives.** Map common cases:

| Need | Use | Not |
| --- | --- | --- |
| Scrollable region with styled scrollbar | `ScrollArea` | `overflow-y-auto` / `overflow-auto` on a wrapper |
| Tabbed surface | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Custom tab buttons + `v-show` |
| Clickable control | `Button` (variants/sizes) | Raw `<button class="…">` for app chrome |
| Option picker (menus, filters, property UI) | `Select` + `SelectTrigger` / `SelectContent` / `SelectItem` | Raw `<select>` or `NativeSelect` |
| Chat / message timeline scroll | `MessageScroller` family | Generic `ScrollArea` on message lists |

### `ScrollArea`

- Wrap scrollable **content** inside menus, sidebars, panels, and dropdowns.
- Give `ScrollArea` an explicit height cap (`h-56`, `max-h-64`, `h-full min-h-0` in flex layouts).
- Put `overflow-hidden` on the outer shell (e.g. `DropdownMenuContent`) when clipping rounded corners; scroll inside `ScrollArea`.

```vue
<!-- ✅ Overflow menu -->
<DropdownMenuContent class="w-56 overflow-hidden p-0">
  <ScrollArea class="max-h-64">
    <DropdownMenuItem v-for="item in items" :key="item.id">…</DropdownMenuItem>
  </ScrollArea>
</DropdownMenuContent>
```

### `Select` vs `NativeSelect`

- **`Select`** — default for app UI (keyboard, styling, truncation, portals).
- **`NativeSelect`** — only when native semantics are required (e.g. design-system internals like calendar month/year, or a deliberate native-form exception). Not for general product chrome.

### `Button`

- Use `Button` for actions, icon triggers, and menu triggers (`as-child` on triggers).
- Raw `<button>` is fine inside design-system itself or for non-interactive hacks — not in app presentationals.

## Exceptions (when not to force DS)

- **Another DS scroll primitive owns the region** — e.g. `MessageScroller` for conversation timelines; virtualized lists with their own scroll root.
- **ScrollArea cannot satisfy layout** — e.g. scroll must be on the same element as sticky headers inside a virtualizer; document why in a short comment.
- **Non-scroll `overflow-hidden`** — clipping masks, rounded corners, or preventing shadow bleed; not a substitute for `ScrollArea`.
- **Plain text inputs** — `<input>`, `<textarea>` remain native; use DS `Input` / composer wrappers when the pattern exists.
- **Theme preview / kit demos** under `packages/design-system` — may showcase `NativeSelect` intentionally.

## Leading word

**design-system primitive**
