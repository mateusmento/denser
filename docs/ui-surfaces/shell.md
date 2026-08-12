# App shell (chrome)

**Status:** Draft  
**Kind:** Shared app chrome (outside any single capability surface)  
**Density:** Calm  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)

Conversation, documents, and Views fill the **main** region. This file owns **navigation chrome** (sidebar, space switcher — TBD). Appearance and transient feedback are sibling specs:

| Concern                         | Spec                   |
| ------------------------------- | ---------------------- |
| Light / dark / system           | [theme.md](./theme.md) |
| Transient non-blocking feedback | [toast.md](./toast.md) |

The shell **mounts** ThemeSwitcher and Toaster. It does not re-specify their behavior here.

---

## Intent

Get the user to a Space, Artifact, or View without competing with the content column. Calm, consistent chrome across surfaces.

---

## Layout / sectioning

```text
┌─ Shell ─────────────────────────────────────────────┐
│ Sidebar │ Main (Conversation / Document / View)     │
└─────────────────────────────────────────────────────┘
```

Sidebar, top bar, and space switcher are **TBD** in this file. Product chrome is not Conversation’s or Document’s job.

---

## Open questions

- Sidebar IA: Spaces vs Artifacts vs Views.
- Space switcher placement.
- Where ThemeSwitcher lives (settings vs compact control) — decided in [theme.md](./theme.md) once shell IA exists.

---

## Changelog

| Date       | Change                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| 2026-08-11 | Theme + Toast ownership so Conversation prototype is not the product chrome.       |
| 2026-08-11 | Theme and Toast extracted to their own surface specs; shell keeps mount + nav TBD. |
