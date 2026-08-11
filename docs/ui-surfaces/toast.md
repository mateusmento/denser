# Toast

**Status:** Draft  
**Kind:** Shared app chrome (transient feedback)  
**Density:** Calm  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)  
**Owner chrome:** [shell.md](./shell.md)

---

## Intent

Transient, non-blocking confirmation that something happened. Toasts must not be the place the user goes to recover from a failure they can still act on.

---

## Layout / sectioning

Not a main-region surface. One **Toaster** overlay, mounted once in app chrome (and Storybook preview / prototype root). Capability UIs call `toast()`; they do not render their own timed banner.

---

## Sub-components

| Sub-component | Role |
| --- | --- |
| **Toaster** | `@denser/design-system` `Toaster` (vue-sonner). Single mount. |
| **toast()** | Design-system re-export. Features call this; they do not wrap a `setTimeout` + `div`. |

---

## Features

| Feature | Notes |
| --- | --- |
| Success / info | Scheduled, stub actions, short confirmations |
| Error (optional) | Only when there is **no** inline control to retry. Prefer inline on composer / scroller / form. |
| Auto-dismiss | Default sonner duration; do not invent a second timer |
| Stacking | Library default; do not hand-roll a queue |

---

## Data (UI-facing)

Toasts are ephemeral UI. No domain object. Copy is passed at the call site.

---

## Visible vs hidden UI and navigation

| Layer | Visible by default | Progressive | Ambient |
| --- | --- | --- | --- |
| **1 Persistent** | — | — | — |
| **2 Progressive** | — | Toast appears after an action, then leaves | — |
| **3 Ambient** | — | — | — |

Toasts are Layer 2 feedback, never Layer 1 chrome.

### Use vs not

| Use toast | Keep inline |
| --- | --- |
| Action succeeded and the user is not staring at the result (schedule committed, stub “coming soon”) | Composer send **Failed** + Retry |
| Non-blocking “that ran” after a menu action | Channel / document **load** error + retry |
| | Form field validation |
| | Permission empty / forbidden |

---

## Interactions

| Interaction | Result |
| --- | --- |
| Feature calls `toast(message)` | Toaster shows; auto-dismisses |
| User clicks toast (if actionable) | Optional; default is informational only |
| Rapid successive calls | Stack / replace per sonner; still one Toaster |

Call `toast()` from `@denser/design-system`. Do not hand-roll a timed `div`.

---

## Surface states

| State | UI |
| --- | --- |
| Idle | Toaster mounted, nothing shown |
| Showing | One or more toasts |
| Dismissed | Gone; no leftover placeholder |

---

## Open questions

- Error toasts at all in v1, or success/info only?
- Actionable toasts (Undo) vs copy-only.
- Position: sonner default vs explicit corner for Denser.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-08-11 | Extract Toast from shell.md into its own surface spec. |
