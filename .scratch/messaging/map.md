# Messaging effort — map

**Effort:** messaging (conversations + attachments + drafts + scheduling foundation)  
**Specs (SoT):** [CONVERSATIONS.md](../../docs/CONVERSATIONS.md) · [ATTACHMENTS.md](../../docs/ATTACHMENTS.md) · [MESSAGE-DRAFTS.md](../../docs/MESSAGE-DRAFTS.md) · [SCHEDULING.md](../../docs/SCHEDULING.md) · [ui-surfaces/conversation.md](../../docs/ui-surfaces/conversation.md)  
**Interfaces:** [interfaces.md](./interfaces.md) — **scaffold fills these; parallel tickets consume them**  
**Tracker:** local markdown under `.scratch/messaging/issues/`

## Goal

Ship tracer-bullet work so **multiple agents can open PRs in parallel** after a thin **interface scaffold** lands. Prefer contracts/ports/schema seams over shared mutable implementation files.

## Waves

| Wave | Tickets | Parallel? |
| --- | --- | --- |
| **0 — Scaffold** | 01 → 02 | Sequential (02 after 01) |
| **1 — Parallel** | 03–09 | Yes — only blocked by 02 |
| **2 — Integration** | 10–13 | After listed blockers |
| **3 — Later** | 14+ | After wave 2 / product phasing |

## Agent workflow (every ticket)

1. **Claim** — set `Status: claimed` on the issue file (first writer wins). Do not claim blocked tickets.
2. **Branch** — from the latest default branch that already contains merged blockers:  
   `git checkout -b agent/messaging-<NN>-<slug>`
3. **Implement** — only this ticket’s acceptance criteria. Respect **Owns / Must not touch** below and in the issue.
4. **Verify** — typecheck + targeted tests; full suite if feasible.
5. **Commit** on the feature branch (user/agent may commit when asked).
6. **Push + PR** — `git push -u origin HEAD` then `gh pr create` with:
   - title: `[messaging <NN>] <ticket title>`
   - body: link to `.scratch/messaging/issues/<file>`, checklist of acceptance criteria, note blockers already merged
7. **Resolve** — after PR merge, set `Status: resolved` and append a one-line pointer under **Decisions-so-far** here.

Do **not** edit other open tickets’ owned paths. Do **not** “helpfully” expand scope into a sibling ticket.

## Ownership (conflict avoidance)

| Area | Owner ticket(s) |
| --- | --- |
| `@denser/contracts` messaging modules | **01** (discriminated ScheduledJob payloads + factories + parse) |
| `packages/api` drizzle messaging schema + migrations | **02** |
| `BlobStore` port + S3/R2 adapters | **06** |
| `AttachmentReferences` service + reclaim | **07** |
| Message list/send/window API + timeline sync | **03** |
| Quote preview join + jump | **04** |
| Threads API + ThreadPane wiring | **05** |
| Message drafts API + composer hydrate | **08** |
| ScheduledJob runner (claim/`next_run_at`) | **09** |
| Typing + presence sockets/UI | **10** (wave 2) |
| Schedule message product (fire → PostMessage) | **11** |
| Unread divider + mark-read-on-open | **12** |
| `conversation_member` → `conversation_peer` | **13** |

If two tickets must touch the same file, prefer **expand** (new module) over editing the shared file; otherwise sequence them.

## Decisions-so-far

- Domain grill locks live in the docs above (2026-09-04 commit `2656e48`).
- Parallelism strategy: **interfaces first** (contracts + ports + schema), then vertical slices against frozen seams.
- Drafts v1: server-authoritative (no dual-write). Scheduling: materialize `next_run_at`; occurrence_key for delivery.
- Local tracker: `.scratch/messaging/issues/` (see denser issue-tracker-local convention).

## Fog / open

- Exact TTL hours for drafts; upload size limits.
- Whether 04/05 merge into 03 if agent context is large — keep separate for parallel PRs unless human merges tickets.
- Meetings A/V tasks are **out of this pack** ([MEETINGS.md](../../docs/MEETINGS.md)).

## Frontier

Unblocked + `ready-for-agent` + not `claimed`/`resolved`. After scaffold merges, wave-1 tickets are the frontier.
