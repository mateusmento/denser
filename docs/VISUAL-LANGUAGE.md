# Denser Visual Language

**Status:** Draft — open for review. Decisions marked **Locked** are agreed; everything else is a recommended starting point pending grilling.

**Audience:** Anyone designing or implementing UI in Denser (product, design, frontend).

**Related:** [PHILOSOPHY.md](./PHILOSOPHY.md) (why), [PRODUCT-MODEL.md](./PRODUCT-MODEL.md) (what), [UI-SURFACES.md](./UI-SURFACES.md) (Views / components inventory), [FEATURE-SPECS.md](./FEATURE-SPECS.md) (objects / behaviors), [FRONTEND-ARCHITECTURE.md](./FRONTEND-ARCHITECTURE.md) (packages). The old [DESIGN.md](./DESIGN.md) is a kanban-demo system and is **not** Denser's visual language.

---

## 1. Intent

Denser’s UI should make work feel continuous and light, even when the underlying artifact is dense with context.

Philosophy already says: *the software should disappear behind the work*, *consistency does not mean uniformity*, and *every context deserves its own interface*. This document turns that into visual and interaction rules.

The visual language exists so that:

- Documents and calm surfaces stay quiet by default.
- Planning Views (backlog, board, …) keep essentials on screen.
- Power stays within reach without turning every screen into a dashboard of controls.

---

## 2. Progressive density (**Locked**)

Denser is **calm by default** and **dense on demand**.

### 2.1 Default surface

Used for: documents, reading, light editing, overviews, conversation reading.

- Quiet chrome; strong sectioning; few persistent controls.
- Prefer anticipating the next useful action over exposing the full toolbox.
- Hierarchy comes from typography and spacing first; color and borders second.

### 2.2 Work surface

Used for: backlog, board, map (structured), calendar, and similar Views whose job is scanning, sorting, and acting.

- Essentials stay on-screen for that View’s job.
- Density is allowed; decoration is not.
- If a control is used routinely in that View, it belongs in that View’s chrome — not three menus deep.

### 2.3 Reach without clutter

- Hiding is for **de-emphasizing**, not **burying**.
- Every capability is at most a short, obvious path away: labeled section, clear entry point, context menu on the object, or a predictable command palette.
- A user should rarely feel “I know this exists but can’t find it” or “too many steps for something I do often.”
- **No false calm:** calm must not mean incomplete.

### 2.4 Sectioning over sprawl

Group related actions into labeled regions and progressive disclosure (collapsed sections, overflow menus, object-local context menus) so the screen stays scannable without teaching users that power features are “somewhere.”

---

## 3. Chrome model (draft)

Three layers of UI chrome. Most screens use all three; denser Views expose more of layer 1.

| Layer | Name | What lives here | Rule |
| --- | --- | --- | --- |
| 1 | **Persistent** | Navigation, View identity, primary create/filter for *this* View, selection affordances | Always visible when relevant to the current job |
| 2 | **Progressive** | Secondary filters, display options, bulk actions, less-common View tools | One obvious click/gesture away; labeled; not scavenger-hunt |
| 3 | **Ambient** | Command palette, keyboard shortcuts, object context menus, help | Global or object-local; never the only way to discover a *routine* action for the current View |

### Draft decision rules

1. Ask: *Would a regular user of this View need this in the first minute?* → Layer 1.
2. Ask: *Is this important but intermittent?* → Layer 2, with a visible entry (icon + label or “⋯” that reveals a named group).
3. Ask: *Is this rare, power-user, or cross-cutting?* → Layer 3.
4. If a Layer 3 action becomes common in support/feedback, promote it to Layer 2 or 1 for that View.
5. Prefer **object-local** actions on the artifact (context menu, inline) over global toolbars when the action applies to a selection.

**Open for review:** Exact Layer-1 sets for Board and Backlog (filters, group-by, assignees, WIP limits, etc.).

---

## 4. Surface types (draft)

| Surface | Density | Calm cues | Dense cues |
| --- | --- | --- | --- |
| Document | Calm | Wide measure, generous vertical rhythm, minimal sticky chrome | Formatting / insert appear on selection or focus |
| Channel / conversation | Calm–medium | Message flow dominates; composer persistent but quiet | Mentions, threads, reactions on the message |
| Backlog / list | Dense | Clear list rhythm; muted metadata | Filters, sort, bulk select, inline status on row |
| Board | Dense | Columns readable; cards not ornamental | Drag, quick status, assignees, WIP visible |
| Map | Medium–dense | Canvas is primary | Tool palette and inspectors progressive |
| Settings / admin | Calm | Sectioned forms | No dashboard chrome |

Shared shell (sidebar, top bar, space switcher) stays **consistent** across surfaces; only the *content region* changes density.

---

## 5. Design principles

1. **Spacing is more important than decoration.** Every element earns its place through position, not ornamentation. White space is a first-class design tool — it creates rhythm, groups related content, and gives the eye a place to rest.

2. **Hierarchy comes from typography, spacing, then contrast — in that order.** Before reaching for bold colors or backgrounds, establish meaning through font size/weight, then through spacing, and only then through contrast adjustments. (Calm surfaces tend toward more generous spacing; work surfaces may tighten spacing without abandoning this order.)

3. **Borders are optional structure, not the layout grid.** Hairlines may section the UI, but they are **not** part of the main layout flow (they don’t define track size or alignment). Prefer spacing and surface contrast first; add a separator only when the join is still ambiguous. When in doubt, remove the line.

4. **Avoid unnecessary shadows.** Shadows exist for one purpose: indicating elevation during interaction (drag, popover, modal). Static surfaces should not cast shadows by default. Elevated interaction states may.

5. **Prefer one accent color.** A single accent draws the eye to primary actions — nothing else should compete. Everything else is neutral (grays) or semantic (status / priority / danger). The concrete hue is provisional (see §6); the *one-accent* rule is not.

6. **Cards are for interaction or ownership, not decoration.** Default: no card chrome on calm document surfaces. On lists/boards and similar work surfaces, card/row chrome exists to support selection, drag, and scanning — not to look “designed.” An inset **card** / owned shell may also mark a region inside an otherwise borderless pane (e.g. composer) without requiring pane-level separators.

7. **One job per region.** Each labeled section has one purpose and one primary action cluster.

8. **Sibling edges align.** When regions sit as siblings in a row or column (channel + thread, list + inspector, split panes), shared structural edges must line up — especially header bottoms and footer tops. Prefer **matching track sizes** (shared heading / footer height tokens both sides know) over merging distinct sections into one parent band just for alignment. Distinct activities stay distinct components; alignment is a fine coupling via size contract, not ownership of each other’s DOM. **Alignment holds whether sectioning is bordered or borderless.**

9. **Separators divide; borders enclose; either may be omitted.**
   - **Separator** — hairline between stack/cross-axis siblings *when a line is chosen*.
   - **Border** — outer edge of a contained surface (popover, menu, input, composer/card shell).
   - **Omit** — when spacing, surface color, or an inset card already sections the UI (see §5.2).
   - Avoid double-painting the same adjoining edge. Prefer one owner per join when a line is used.

---

## 5.1 Structural alignment (layout chrome)

Applies whenever two or more **distinct** panes share a viewport band (side-by-side or stacked).

**Prefer:** each section owns its chrome; siblings agree on **shared heading height** (and footer height when both have footers) so edges line up — with or without visible separators.

**Avoid:** folding unrelated activities into one parent header/footer row solely so a line looks continuous — that erases section boundaries (e.g. conversation stream vs thread are no longer separable surfaces).

| Do | Don’t |
| --- | --- |
| Use a shared **fixed** track token (`--surface-header-height`, `--surface-footer-height`) on sibling headers/footers — not `min-height`, which still lets one pane grow and stagger the join | Merge channel + thread headers into one DOM row “for alignment” |
| Keep Conversation and Thread as separate sections with their own scrollers/composers | Make one section’s layout own the other’s header |
| Mirror footer **internal slots** when both have composers (shell + action row + hint row heights) so the shells line up, not only the band | Let unequal padding/line-count or missing hint rows stagger composer tops |
| Truncate or clamp header content to fit the shared height | Grow one header with extra lines and leave the sibling short |
| Rely on the height contract for alignment even when bands are borderless | Treat hairlines as the only way siblings “know” where the band ends |

**Conversation example:** Channel header and Thread header remain in their own sections. Both use the same heading height token so their bottom edges align. A vertical join may be a separator, a surface-color change, or neither — alignment still comes from the height contract.

---

## 5.2 Borderless sectioning

**Case:** structure the UI **without** pane-level hairlines when lines would fight alignment, clutter calm surfaces, or imply a harder split than the product needs.

Borders and separators remain valid (controls, popovers, optional joins). They are not banned — they are not the default language for every section boundary, and they are not how layout tracks are sized.

### Mechanisms (prefer in this order)

1. **Spacing** — larger gap between unrelated regions; tighter gap inside a region (principle 1).
2. **Surface color** — e.g. `background` vs `sidebar` / `muted` / `card` fill to mark shell vs content vs inset without a line.
3. **Typography / label** — section title and muted meta establish a band before any stroke.
4. **Inset card / owned shell** — composer, inspector block, or selected object sits on `card` (with or without its own enclosing border) inside an otherwise borderless pane.
5. **Separator (last)** — add a hairline only if the join is still unclear after 1–4.

### When to prefer borderless

- Sibling panes that share a heading/footer track: per-pane hairlines can exaggerate misalignment or double the join; height tokens + spacing/color keep sections distinct without the line.
- Calm conversation / document reading: message flow should dominate; underlines under every chrome band add noise.
- Nested regions inside one section where a card or muted well already marks ownership.

### When a line is still right

- Floating/elevated UI (popover, menu, dialog) — border (and shadow on elevate) encloses.
- Form controls and composer/input shells that need a clear hit-target edge.
- Dense work surfaces where many parallel columns need a crisp join and spacing alone fails.

### Pairing with alignment

Borderless sectioning **does not relax** §5.1. Sibling headers/footers still share fixed heights. The aligned edge may be invisible (only spacing and surface change mark the band) or may carry a single optional separator.

---

## 6. Color (provisional — matches current `@denser/design-system`)

**Implementation today** (`packages/design-system/src/styles.css`): Linear-adjacent purple primary `#5e6ad2`, near-white / near-black neutrals, Geist sans, light + dark tokens, status/priority semantic colors.

**Draft recommendation:** Keep the **role structure** (background, foreground, primary, muted, destructive, sidebar, status_*, priority_*). Treat the specific purple as **provisional** until brand grilling lands — avoid locking marketing identity to “another purple productivity app” without an explicit decision.

| Role | Usage |
| --- | --- |
| `background` / `foreground` | App canvas and primary text |
| `card` / `popover` | Elevated surfaces |
| `primary` | Primary actions, key focus |
| `muted` / `muted-foreground` | De-emphasized text and fills |
| `destructive` | Irreversible / danger |
| `border` / `input` / `ring` | Structure and focus |
| `status-*` / `priority-*` | Workflow semantics only — not decoration |

### Rules

- Status and priority colors appear on **metadata chips / dots**, not as large background washes.
- Do not introduce a second accent family for marketing moments inside the app shell.
- Ensure every color choice has a semantic reason.

### Gradient rules

Gradients are **functional, not decorative**. Allowed uses are interaction feedback only (for example expanding shadow/fade during drag).

Never use gradients for: page backgrounds, static cards, buttons, or decorative chrome.

**Open for review:** Keep `#5e6ad2`, shift hue, or define a Denser-specific accent.

---

## 7. Typography (provisional)

**Today:** Geist via `--font-sans` / `--font-heading`.

**Draft recommendation:**

- One UI sans for shell + Views (current Geist is fine until brand decides otherwise).
- Document body may later use a dedicated reading size/measure; do not invent a second display font for app chrome.
- Monospace (when needed) is for identifiers, timestamps, and code — not for general UI copy.
- Prefer **three text sizes** in a given View region. Hierarchy is achieved through weight and color, not size proliferation. More sizes only when a specialized View proves the need.

### Type roles (max 3 sizes in a region)

| Role | Typical Tailwind | Weight | Usage |
| --- | --- | --- | --- |
| Meta | `text-xs` | 400/500 | Labels, metadata, ids |
| Body | `text-sm` | 400/500 | Body text, list primary labels, descriptions |
| Title | `text-base` | 500/600 | View names, section titles, document title in chrome |

### Line heights

- `leading-tight` (1.25) — headings / titles
- `leading-normal` (1.5) — body text
- `leading-relaxed` (1.625) — longer reading / descriptions

---

## 8. Spacing & density

Use Tailwind’s spacing scale. Base unit: `4px`.

### Density modes

| Mode | Padding / gap feel | When |
| --- | --- | --- |
| Calm | Comfortable vertical rhythm; fewer columns of chrome | Documents, settings, empty/overview |
| Dense | Compact rows/cards; tighter meta; more information per viewport | Backlog, board, dense tables |

Do not mix modes inside one region. A dense board/list region beside a document pane keeps each region in its own mode.

### Spacing rules

- Related items are closer. Unrelated items have more space between them.
- White space groups meaning; do not replace missing structure with borders or fills.
- On calm surfaces, if it feels tight, add space rather than ornament.
- On dense surfaces, tighten gaps deliberately so scanning stays possible — density is intentional compression, not clutter.

---

## 9. Motion

Motion is **functional feedback**, not decoration. Every animation communicates a state change. Consistent timing creates rhythm.

### Timing

| Token | Duration | Easing | Usage |
| --- | --- | --- | --- |
| `fast` | 100ms | `ease-out` | Hover states, color transitions |
| `normal` | 200ms | `ease-in-out` | Panels, menus, settle after move |
| `slow` | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | View transitions, modal open, theme crossfade |
| `spring` | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Release / drop feedback on work surfaces only |

### Micro-interactions

- **Hover:** border or background shift, 100ms
- **Popover / menu open:** scale from `0.95` → `1`, opacity `0` → `1`, 200ms
- **Theme toggle:** crossfade between themes, 300ms

### What not to animate

- Font size changes (use different elements; don’t animate size)
- Layout shifts (prefer `transform` over `width` / `height`)
- Text color as the primary transition cue (transition background / border instead)

Calm document surfaces should almost never use springy motion. Prefer `transform` / opacity over layout animation.

---

## 10. Light / dark (draft)

**Today:** Both themes defined; dark canvas is near-black (`#010102`).

**Draft recommendation:**

- **System-first:** detect `prefers-color-scheme` on load; persist manual override in `localStorage`.
- Default for first visit: **follow system** (do not force dark-as-brand unless we later decide Denser is dark-first).
- Theme toggle: smooth 300ms crossfade; no flash of wrong theme on load (set class before paint).
- **Contrast:** foreground on background meets WCAG AA (4.5:1 minimum) in both themes. Primary accent on interactive elements must remain sufficiently contrasted. Muted text may be lower contrast but must stay legible.

**Open for review:** System-first vs dark-first.

**Ownership:** the Theme *control* and `html.dark` owner live in [ui-surfaces/theme.md](./ui-surfaces/theme.md). This section owns look, motion, and contrast only.

---

## 11. Navigation & discovery (draft)

These rules exist so progressive density does not become feature hide-and-seek.

1. **Labeled sections** beat icon-only toolbars for Layer 2 groups.
2. **Predictable places:** create actions near the View title; filters near the list/board; object actions on the object.
3. **Command palette** is an accelerator and safety net — not the primary IA for routine View actions.
4. **Empty states** teach the next action (one primary CTA), not a grid of features.
5. **Feature hiding** must leave a **discoverable trail** (menu label, overflow “View options”, docs link in empty state). If a feature has no trail, it is buried — fix the IA, don’t add another icon.

---

## 12. Do / Don’t

### Do

- Default to calm; escalate density with the View’s job.
- Prefer borderless sectioning (spacing, surface color, inset cards) for pane joins; keep hairlines subtle when used.
- Let spacing create hierarchy.
- Use three text sizes maximum in a region.
- Use the single accent for primary actions; semantic color only for meaning.
- Keep routine View actions in Layer 1 or a clearly labeled Layer 2.
- Section related controls; name the groups.
- Match shell patterns across Views so the mental model stays one product.
- Ensure every color choice has a semantic reason.
- Align sibling headers/footers with fixed height tokens whether or not a hairline is drawn.

### Don’t

- Ship a calm screen that hides essentials for that context.
- Ship a dense screen that paints every capability as a primary button.
- Center dashboards or use giant hero sections inside the authenticated app.
- Use gradients for decoration.
- Mix filled and outlined icons without a system reason.
- Put every action in a button.
- Nest cards inside cards.
- Add shadows everywhere.
- Use more than three text sizes in a region.
- Let sibling pane headers/footers stagger because heights weren’t contracted.
- Merge distinct sections into one parent band only to force a continuous line.
- Require a hairline on every section join; don’t let borders become the layout grid.
- Rely on purple glow, pill clusters, or stat strips to “make it look premium.”
- Make command palette the only path to a common action.

---

## 13. Relationship to implementation

| Source of truth | Owns |
| --- | --- |
| This doc | Visual language decisions |
| `@denser/design-system` | Tokens (`styles.css`), primitives, Storybook |
| App features / Views | Density mode choice + Layer 1/2 composition per View |

When tokens and this doc disagree, **update one of them deliberately** — do not silently drift.

---

## 14. Open questions (for follow-up grilling)

1. Accent / brand color: keep provisional purple, or redefine?
2. First-visit theme: system vs dark-first?
3. Board and Backlog Layer-1 control inventories.
4. Document typography: same Geist size scale vs dedicated reading measure.
5. How far command palette goes as discovery vs accelerator.
6. Whether marketing/landing visual language is in-scope here or a separate brand doc.

---

## 15. Changelog

| Date | Change |
| --- | --- |
| 2026-08-10 | Initial draft; **progressive density** locked from product grilling. |
| 2026-08-10 | Integrated descriptive design principles, spacing, type roles, motion, theme, and do/don’t from the kanban DESIGN.md — without board-specific recipes; left hue, type stack, and system-first theme as current draft decisions. |
| 2026-08-10 | Added sibling alignment + separator-vs-border rules (§5.8–5.9, §5.1). |
| 2026-08-10 | Alignment via shared heading-height contract; do not merge distinct sections into parent bands. |
| 2026-08-10 | Borderless sectioning case (§5.2); borders optional / not layout-flow; alignment independent of hairlines. |
