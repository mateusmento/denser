# Theme

**Status:** Draft  
**Kind:** Shared app chrome (appearance)  
**Density:** Calm  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)  
**Look / motion / contrast:** [VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md) §10  
**Owner chrome:** [shell.md](./shell.md) (sidebar / space switcher TBD; this file owns appearance)

---

## Intent

One appearance for the whole app. Light and dark must both be usable; first visit follows the OS until the user overrides. Capability surfaces (Conversation, Document, …) consume tokens — they do not own the mode.

---

## Layout / sectioning

Theme is not a main-region surface. The **control** lives in shell chrome (settings or a compact switcher). The **effect** is global: `html.dark` + CSS tokens on `:root`.

Prototype Theme buttons on Conversation are demos only.

---

## Sub-components

| Sub-component | Role |
| --- | --- |
| **ThemeSwitcher** | Light / Dark / System. Shell chrome, not a feature banner. |
| **Color-mode owner** | One VueUse `useDark` / `useColorMode` (or `createGlobalState` wrapper). Sets `html.dark` before paint. |

Design-system tokens (`background`, `foreground`, `card`, …) are implementation; this spec names the product control and the owner.

---

## Features

| Feature | Where | Notes |
| --- | --- | --- |
| Follow system | Owner composable | `prefers-color-scheme` until overridden |
| Manual light / dark | ThemeSwitcher | Persist override |
| Return to system | ThemeSwitcher | Clear override |
| Crossfade | Tokens / CSS | 300ms; [VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md) §9–10 |
| No FOUC | Owner + boot | Class on `<html>` before first paint |

---

## Data (UI-facing)

| UI need | Source |
| --- | --- |
| Current mode | `html.dark` / VueUse color mode |
| User override | `localStorage` (VueUse persistence) |
| System preference | `prefers-color-scheme` |

No server entity. Do not store theme on User until a later sync requirement exists.

---

## Visible vs hidden UI and navigation

| Layer | Visible by default | Progressive | Ambient |
| --- | --- | --- | --- |
| **1 Persistent** | Correct theme on every paint | — | — |
| **2 Progressive** | — | ThemeSwitcher in shell (settings or compact control) | — |
| **3 Ambient** | — | — | Optional shortcut to cycle modes |

Do not put a theme toggle on Conversation / Document chrome.

---

## Interactions

| Interaction | Result |
| --- | --- |
| First visit | Follow system; no forced dark-as-brand |
| Choose Light / Dark | Persist override; `html.dark` matches; 300ms crossfade |
| Choose System | Clear override; follow OS; update if OS changes |
| OS preference changes | Apply only when mode is System |
| Capability presentational mounts | Must not toggle `document.documentElement.classList` |

Mechanism: VueUse `useDark` / `useColorMode` (or the shell owner composable). Not handmade `classList` from a feature.

---

## Surface states

| State | UI |
| --- | --- |
| System | Control shows System; tokens match OS |
| Light override | Control shows Light; `html` without `dark` |
| Dark override | Control shows Dark; `html.dark` |
| Boot | Class set before paint so the first frame is not the wrong theme |

---

## Open questions

- System-first vs dark-first as brand default ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md) §10).
- Switcher placement: settings only vs compact control in shell chrome.
- Sync theme to the user account later, or keep device-local.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-08-11 | Extract Theme from shell.md into its own surface spec. |
