# Messaging — delivery chunks

Logical **product chunks** (what “done” means for you as reviewer). Each chunk may be **several PRs** (api then app). Parallel lanes must respect blockers in [COVERAGE.md](./COVERAGE.md).

---

## Chunk 0 — Scaffold

| Tickets | Layer | Reviewer sees |
| --- | --- | --- |
| **01** | api | Nothing in UI yet — types, tables, port stubs compile |

**Done when:** `pnpm typecheck`; migration applies; contracts match [interfaces.md](./interfaces.md).

---

## Chunk 1 — Core messaging (text only)

| Tickets | Layer | Reviewer sees |
| --- | --- | --- |
| **02** → **03** | api → app | Open conversation → **real messages**, send, scroll, jump pill, day/author groups |

**Done when:** You can chat with TipTap text (no files yet). Presentational timeline/composer **wired to API**.

**Parallel after 01:** starts **02** (same time as attachment lane B below).

---

## Chunk 2 — Conversation features (parallel sub-chunks)

Each sub-chunk is independently reviewable after Chunk 1.

| Sub-chunk | Tickets | UI? |
| --- | --- | --- |
| Quotes | **04** api → **05** app | Quote cards + jump |
| Threads | **06** api → **07** app | Thread pane + reply |
| Reactions | **08** full | Emoji on messages |
| Message actions | **09** app | Hover menu edit/delete/quote/thread |
| Typing + presence | **10** api → **11** app | Banner + avatars + dots |
| Unread | **12** api → **13** app | Badges + New divider |
| DM peers + shell | **14** api → **15** app | Hide DM, archive (thin) |

---

## Chunk 3 — Attachments & upload (your question)

This implements [ATTACHMENTS.md](../../docs/ATTACHMENTS.md) A0–A3 + composer/timeline UI.

### Is there UI for uploading?

**Yes — ticket 19** (`composer-attachments-app`) is explicitly the **upload UX**: tiles, progress bar, cancel, drop/paste, attach-only send.  
Tickets **16–18** are **backend only** (no visible upload UI).  
Ticket **20** shows attachments **after** send in the timeline.

### Sub-chunks (recommended merge order for review)

| Sub | Tickets | Layer | What you review |
| --- | --- | --- | --- |
| **3a Storage** | **16** ∥ **17** | api ∥ api | S3/R2 + reference graph + reclaim (invisible) |
| **3b Upload API** | **18** | api | HTTP upload/abort; draft join on server (Postman/curl OK) |
| **3c Compose & upload** | **19** | **app** | **Pick file → progress → tile → send** in MessageComposer |
| **3d In timeline** | **20** | app | Images + file chips on delivered messages |
| **3e Files pane** | **21** | full | Slack-like “files in this conversation” + delete |
| **3f Recording** | **29** | full | **Loom-style:** pre-record draggable cam circle → WebM attach ([SCREEN-RECORDING.md](../../docs/SCREEN-RECORDING.md)) |

### “Attachments complete” definition (v1, excluding schedule)

Chunk 3 is **complete for messaging** when **3a + 3b + 3c + 3d** are merged:

- Upload from composer with cancel
- Send message with files / image-only
- See attachments on messages
- (3e files pane is polish; 3f recording is optional tail)

Schedule + files uses **Chunk 5** (25 attaches scheduled joins; 26 shows tiles on scheduled rows).

### Parallel lanes (after 01)

```text
Lane B — attachments (backend first):
  16 blobstore  ──┐
  17 refs       ──┼── parallel
  22 drafts api ──┘   (needed for ensureDraft on upload)
        │
        ▼
       18 upload API
        │
        ├── needs 03 timeline (send) + 23 drafts app (hydrate)
        ▼
       19 composer upload UI  ◄── main upload UI PR
        │
        ▼
       20 message attachment render

  21 files pane — after 17 (can parallel with 19/20 if careful)

Lane A — text chat:
  02 → 03  (should merge before or with 19 for E2E attach send)
```

**Practical parallel after 01:** `02`, `16`, `17`, `22`, `24` all at once.  
**First UI you can upload in:** after **03 + 18 + 19** (and **23** for draft restore).

### Cross-deps (drafts)

Upload staging uses **draft anchor** ([MESSAGE-DRAFTS.md](../../docs/MESSAGE-DRAFTS.md)):

- **18** calls `ensureDraft` + sync joins (needs **22** api)
- **19** needs **18** + composer from **03**; **23** for full draft debounce (can ship upload before 23 with empty-draft hydrate only)

---

## Chunk 4 — Drafts

| Tickets | Layer | Reviewer sees |
| --- | --- | --- |
| **22** → **23** | api → app | Close/reopen composer → **text restored**; debounced save |

Does not include drafts drawer/badge (deferred).

---

## Chunk 5 — Scheduling

| Tickets | Layer | Reviewer sees |
| --- | --- | --- |
| **24** | api | Runner only (invisible) |
| **25** | api | Schedule fires → message appears |
| **26** | app | Schedule popover + schedules list |
| **27** | full | Recurrence + timezone UI |

Scheduled messages **with attachments** need **25 + 19** (upload) + **26** (schedule UI).

---

## Chunk 6 — Later

| Tickets | Notes |
| --- | --- |
| **28** polls | Full-stack |
| **29** recording | Reuses Chunk 3 upload pipeline |

---

## Suggested review batches (fewer PRs to click)

If you prefer **fewer, larger reviews** over max parallel:

| Batch | Tickets | You get |
| --- | --- | --- |
| A | 01 | Scaffold |
| B | 02 + 03 | Text chat E2E |
| C | 16 + 17 + 18 | Attachment backend ready |
| D | 22 + 23 | Drafts |
| E | 19 + 20 | **Upload + display** (main attachment UI batch) |
| F | 21 | Files pane |
| G | 04–15 | Conversation polish (or split by sub-chunk) |
| H | 24–27 | Scheduling |

Agents still open **one PR per ticket** unless you explicitly ask to batch.
