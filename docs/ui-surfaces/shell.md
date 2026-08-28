# App shell (chrome)

**Status:** Draft  
**Kind:** Shared app chrome (outside any single capability surface)  
**Density:** Calm  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)

Conversation, documents, and Views fill the **main** region. This file owns **navigation chrome** (sidebar, space switcher, space tab bar). Appearance and transient feedback are sibling specs:

| Concern                         | Spec                   |
| ------------------------------- | ---------------------- |
| Light / dark / system           | [theme.md](./theme.md) |
| Transient non-blocking feedback | [toast.md](./toast.md) |

The shell **mounts** ThemeSwitcher and Toaster. It does not re-specify their behavior here.

---

## Intent

Get the user to a Space, Artifact, or View without competing with the content column. Calm, consistent chrome across surfaces.

Within a space, the **tab bar** is part of shell chrome (see [ARTIFACTS-AND-SPACES.md](../ARTIFACTS-AND-SPACES.md#space-tabs)): **This Space** is always the first tab; users add artifact tabs or (later) backlog/board view tabs via **`+`**.

---

## Sidebar information architecture

| Section | Contents |
| ------- | -------- |
| **Home** | Shown on Personal home, public root folders, and root artifacts: public roots the user created, private roots they belong to, and root artifacts. Hidden inside a **private** workspace tree. |
| **In {space}** | When a space is active: nested child spaces, then artifacts (**documents + regular conversations** only). |
| **Direct messages** | **Direct** conversation artifacts for the **current private root** (workspace) where the user is a member. Not shown for public Home folders. Flat list — not nested under folders. Not duplicated in In {space}. |

DMs are **global within the workspace** (one thread per member set per private root). Switching nested spaces does not change the DM list.

The home button shows the current **workspace** name (private root) with a back-to-home hint; on Personal home and public folders it stays Home.

---

## Layout / sectioning

```text
┌─ Shell ─────────────────────────────────────────────────────────────┐
│ Sidebar │ Tab bar (This Space · … · +)                              │
│         │ Main (Conversation / Document / This Space / View)        │
└─────────────────────────────────────────────────────────────────────┘
```

Sidebar and tab bar are shell chrome. Capability surfaces (Conversation, Document) own only the main column below the tab bar.

---

## Open questions

- Space tab persistence (per-user vs shared across space members).
- Space switcher placement (sidebar header vs top bar).
- Where ThemeSwitcher lives (settings vs compact control) — decided in [theme.md](./theme.md) once shell IA is built out.
- Direct messages: compact list vs grouped unread (Slack-like).

---

## Changelog

| Date       | Change                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| 2026-08-11 | Theme + Toast ownership so Conversation prototype is not the product chrome.       |
| 2026-08-11 | Theme and Toast extracted to their own surface specs; shell keeps mount + nav TBD. |
| 2026-08-26 | Sidebar IA (Home / In space / Direct messages); space tab bar; link to domain model. |
| 2026-08-28 | Home section only outside private workspaces; DMs only on private roots. |
