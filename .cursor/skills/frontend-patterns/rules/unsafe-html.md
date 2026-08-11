---
title: Unsafe HTML
impact: HIGH
description: >-
  Assigning HTML strings into the DOM — use structured documents or text.
tags: [xss, html, security, tiptap]
---

## Trigger

User-visible or composer-owned content is injected as an HTML string: `el.innerHTML =`, `v-html`, `document.execCommand('insertHTML')`, or concatenating markup from a draft/API into the DOM.

```ts
// ❌
editor.innerHTML = props.modelValue
item.innerHTML = message.body
```

## Rule

Canonical rich bodies are **structured documents** (TipTap / ProseMirror JSON — see stack locks). Render through the editor or a dedicated renderer. Plain strings go through text (`textContent`, mustache interpolation). If HTML must cross a boundary, sanitize at **one named adapter** — never in a presentational.

Strip-tags-then-show is not a substitute for a structured body: it both drops richness and still parsed HTML on the way in.

## When not

- Static class names / Vue templates (not runtime HTML strings).
- Trusted snippets inside design-system stories that never take user input.
- The sanitizer/adapter itself (the one named boundary).

## Leading word

**unsafe html**
