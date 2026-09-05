# Messaging — domain coverage matrix

Maps **[CONVERSATIONS.md](../../docs/CONVERSATIONS.md)**, **[MESSAGE-DRAFTS.md](../../docs/MESSAGE-DRAFTS.md)**, **[ATTACHMENTS.md](../../docs/ATTACHMENTS.md)**, **[SCHEDULING.md](../../docs/SCHEDULING.md)** to agent tickets.

**Delivery chunks:** [CHUNKS.md](./CHUNKS.md) — product-sized groupings (what “done” means, parallel lanes, review batches).

**Task pack v2:** 29 tickets with explicit **api / app** layers. Supersedes the old 16-ticket pack — each issue has an **Updates (task pack v2)** section mapping archive numbers. No `issues/archive/` folder.

**Legend:** `api` = backend only · `app` = frontend only · `full` = both in one PR (small vertical slice)

**App/full tickets:** read [frontend-patterns](../../../.cursor/skills/frontend-patterns/SKILL.md) before implementing — wire existing presentationals under `packages/app/src/features/conversation/`, do not rebuild chrome.

**Api/full tickets:** read [codebase-design](../../../.cursor/skills/codebase-design/SKILL.md) before implementing — deep modules at ports/seams in [interfaces.md](./interfaces.md); keep HTTP handlers thin.

| # | Ticket | Chunk | Layer | Domain | Delivers (reviewer-visible) |
| --- | --- | --- | --- | --- |
| 01 | [scaffold](./issues/01-scaffold.md) | 0 | api | all | Contracts + schema + port stubs |
| **Conversations** |
| 02 | [messages-api](./issues/02-messages-api.md) | 1 | api | conv | List/send/edit/delete messages, sockets, ACL |
| 03 | [timeline-app](./issues/03-timeline-app.md) | 1 | app | conv | Virtualized timeline, optimism, groups, jump pill |
| 04 | [quotes-api](./issues/04-quotes-api.md) | 2 | api | conv | Quote preview DTO, `around` enrichment |
| 05 | [quotes-app](./issues/05-quotes-app.md) | 2 | app | conv | Quote card UI, click-to-jump |
| 06 | [threads-api](./issues/06-threads-api.md) | 2 | api | conv | Thread list + reply post |
| 07 | [threads-app](./issues/07-threads-app.md) | 2 | app | conv | ThreadPane split/full-replace, thread composer |
| 08 | [reactions](./issues/08-reactions.md) | 2 | full | conv | Toggle reaction API + message UI |
| 09 | [message-actions-app](./issues/09-message-actions-app.md) | 2 | app | conv | Hover menu, edit/delete, quote/thread actions |
| 10 | [typing-presence-api](./issues/10-typing-presence-api.md) | 2 | api | conv | Typing + presence socket events |
| 11 | [typing-presence-app](./issues/11-typing-presence-app.md) | 2 | app | conv | Typing banner, header avatars, green dots |
| 12 | [unread-api](./issues/12-unread-api.md) | 2 | api | conv | ReadState, unread summary |
| 13 | [unread-app](./issues/13-unread-app.md) | 2 | app | conv | Badges, New divider, open-at-unread, mark-read-on-open |
| 14 | [dm-peers-api](./issues/14-dm-peers-api.md) | 2 | api | conv | conversation_peer expand–contract, hide preference |
| 15 | [conversation-shell-app](./issues/15-conversation-shell-app.md) | 2 | app | conv | DM hide, soft-archive chrome (if not in shell) |
| **Attachments** |
| 16 | [blobstore-api](./issues/16-blobstore-api.md) | **3a** | api | att | S3 + R2 BlobStore adapters *(no UI)* |
| 17 | [attachment-refs-api](./issues/17-attachment-refs-api.md) | **3a** | api | att | Reference graph, reclaim, orphan sweep *(no UI)* |
| 18 | [upload-api](./issues/18-upload-api.md) | **3b** | api | att | Upload/abort HTTP, ensureDraft hook *(no UI)* |
| 19 | [composer-attachments-app](./issues/19-composer-attachments-app.md) | **3c** | app | att+draft | **Upload UI:** tiles, drop/paste, progress, cancel |
| 20 | [message-attachments-app](./issues/20-message-attachments-app.md) | **3d** | app | att | Inline images + file tiles in timeline |
| 21 | [files-pane](./issues/21-files-pane.md) | **3e** | full | att | Conversation files list + delete |
| **Drafts** |
| 22 | [drafts-api](./issues/22-drafts-api.md) | 4 | api | draft | Get/Upsert/Delete, version/409, purge |
| 23 | [drafts-app](./issues/23-drafts-app.md) | 4 | app | draft | Composer hydrate, debounce, clear on send |
| **Scheduling** |
| 24 | [scheduler-api](./issues/24-scheduler-api.md) | 5 | api | sched | Claim runner, handler registry, occurrence_key |
| 25 | [schedule-message-api](./issues/25-schedule-message-api.md) | 5 | api | sched | Schedule CRUD, fire → PostMessage, attachment joins |
| 26 | [schedule-app](./issues/26-schedule-app.md) | 5 | app | sched | SchedulePopover, schedules tab, edit, caption |
| 27 | [schedule-recurrence](./issues/27-schedule-recurrence.md) | 5 | full | sched | Presets + timezone + recompute next_run_at |
| **Later (in pack, lower priority)** |
| 28 | [polls](./issues/28-polls.md) | 6 | full | conv | Poll create/vote + composer + embed |
| 29 | [recording-attach](./issues/29-recording-attach.md) | **3f** | full | att | Screen record → upload → attach |
| 32 | [delete-message-attachment-release](./issues/32-delete-message-attachment-release.md) | **3d** | api | att+conv | `DeleteMessage` releases message attachment anchor for GC |

## Dependency graph (simplified)

```text
01 scaffold
  ├── 02 messages-api ──┬── 03 timeline-app
  │                     ├── 04 quotes-api → 05 quotes-app
  │                     ├── 06 threads-api → 07 threads-app
  │                     ├── 08 reactions
  │                     ├── 09 message-actions-app (needs 02)
  │                     ├── 10 typing-presence-api → 11 typing-presence-app
  │                     ├── 12 unread-api → 13 unread-app
  │                     └── 14 dm-peers-api
  ├── 16 blobstore-api → 18 upload-api → 19 composer-attachments-app
  ├── 17 attachment-refs-api ──┬── 20 message-attachments-app
  │                            ├── 21 files-pane
  │                            └── 25 schedule-message-api (with 24, 22)
  ├── 22 drafts-api → 23 drafts-app
  └── 24 scheduler-api → 25 schedule-message-api → 26 schedule-app
```

**Parallel after 01 merges:** 02, 16, 17, 22, 24 can start together. App tickets follow their API blockers.

## Out of scope (separate packs)

- Meetings `meeting_start` / `meeting_reminder` handlers → [MEETINGS.md](../../docs/MEETINGS.md)
- Drafts drawer / workspace list (MESSAGE-DRAFTS D5)
- Media library (ATTACHMENTS A5)
- Cross-conversation search

## PR policy

Every ticket → one PR. See [PR-POLICY.md](./PR-POLICY.md). Maintainer reviews before merge.
