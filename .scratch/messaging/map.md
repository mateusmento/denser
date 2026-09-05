# Messaging effort — map

**Coverage matrix:** [COVERAGE.md](./COVERAGE.md) — full api + app task list for Conversations, Drafts, Attachments, Scheduling  
**Delivery chunks:** [CHUNKS.md](./CHUNKS.md) — product-sized groupings, upload UI callouts, parallel lanes  
**Interfaces:** [interfaces.md](./interfaces.md)  
**Realtime scaling:** [REALTIME-SCALING.md](./REALTIME-SCALING.md) — ephemeral state audit; ticket **30**  
**PR policy:** [PR-POLICY.md](./PR-POLICY.md) — **every ticket → one PR for maintainer review**

## Goal

Complete implementation of the four messaging domain docs with **explicit backend and frontend tickets**. Presentational components exist in `packages/app/src/features/conversation/` — app tickets **wire real API/sync**, not rebuild chrome from scratch.

**Frontend skill (app/full tickets):** agents **must** read [frontend-patterns](../../../.cursor/skills/frontend-patterns/SKILL.md) before implementing App criteria — presentational/container split, sync vs UI composables, TanStack Query/DB, 409 merge-retry, folder structure, Storybook for presentationals.

**Backend skill (api/full tickets):** agents **must** read [codebase-design](../../../.cursor/skills/codebase-design/SKILL.md) before implementing API criteria — deep modules at clean seams (ports, handlers, repositories), thin HTTP layer, test through the interface. See [interfaces.md](./interfaces.md) for messaging port boundaries.

## Waves

| Wave | Tickets | Notes |
| --- | --- | --- |
| **0** | **01** scaffold | One combined PR (contracts + schema + ports) |
| **1** | **02–15** | Conversations core (api then app pairs) |
| **2** | **16–21** | Attachments (api chain + composer/timeline UI) |
| **3** | **22–23** | Drafts api + app |
| **4** | **24–27** | Scheduling api + app + recurrence |
| **5** | **28–29** | Polls, recording (optional tail) |

## Agent workflow

1. Pick an unblocked ticket from [COVERAGE.md](./COVERAGE.md) (`ready-for-agent`, not `claimed`).
2. Set `Status: claimed` on the issue file.
3. **If `Layer: api` or `full`:** read [codebase-design](../../../.cursor/skills/codebase-design/SKILL.md) — deep modules, seams, ports per [interfaces.md](./interfaces.md); thin handlers.
4. **If `Layer: app` or `full`:** read [frontend-patterns](../../../.cursor/skills/frontend-patterns/SKILL.md) and load only the references/rules you need (e.g. `presentational-container`, `composables`, `folder-structure`, `async-ux`).
5. Branch `agent/messaging-<NN>-<slug>` from `main` (with blockers merged).
6. Implement **only** that ticket’s API and/or App criteria.
7. `pnpm typecheck` (+ tests for touched packages). App tickets: add/update Storybook stories for touched presentationals.
8. Commit, push, `gh pr create` — title `[messaging NN] …` — **do not merge**.
9. After maintainer merges: `Status: resolved`; note in Decisions-so-far.

## Session handoff (opencode / long runs)

Opencode (and similar long agent sessions) tend to **degrade around 70,000–80,000 tokens** — answers get less reliable, context gets noisy, and the agent may contradict earlier decisions. **Do not keep pushing in the same session** once you notice that slide.

**Hand off to a fresh session instead:**

1. **Stop** before making large or irreversible changes in a degraded session.
2. **Persist state** on the branch: commit WIP if useful, or leave a clean partial state with a clear last-good commit.
3. **Write a short handoff** (issue comment, PR draft, or `.scratch/messaging/handoffs/NN-<slug>.md`) with:
   - Ticket + branch name
   - What is **done** vs **remaining** (checklist from the issue)
   - Files touched / key decisions
   - Blockers, failing tests, or open questions
   - PR link or “PR not opened yet”
4. **New session starts from artifacts**, not chat history: read the **issue file**, [map.md](./map.md), [interfaces.md](./interfaces.md), and the handoff note — then continue on the **same branch**.

**Signals to hand off early:** repeating mistakes, forgetting ticket scope, fighting merge/typecheck loops, or re-litigating decisions already in domain docs.

## Wave-1 status (2026-09-05)

**01–05 api tickets merged to `main` (`371f412`):** 02 messages (#7), 22 drafts (#8), 17 attachments (#9), 24 scheduler (#10), 16 blobstore (#11). Independent api tickets done. Next: wire-dependent app/api tickets in isolated worktrees.

## Decisions-so-far

- Full-stack coverage via explicit api/app ticket pairs ([COVERAGE.md](./COVERAGE.md)).
- Scaffold committed directly to `main` (`11703b7`); wave-1+ = one PR per ticket.
- Drafts v1 server-authoritative; scheduling typed payloads + `next_run_at`.
- **Task pack v2** (29 tickets) merged archive 16-ticket pack — see **Updates** section in each issue for renumber map.
- Parallel agents run in **isolated git worktrees** (`/tmp/opencode/wt/NN`), one per ticket/branch — never share a working tree (tangled-commit incident on first parallel run).
- Tickets 16 + 17 both own `domains/attachments/`; reconciled by merging disjoint function sets into shared `repository.ts` / `orphan-sweep.ts`.

### Archive → v2 renumber map

| Archive | v2 tickets | Change |
| --- | --- | --- |
| 01 + 02 | **01** | Combined scaffold |
| 03 | **02** api + **03** app | Split list/send |
| 04 | **04** api + **05** app | Split quotes |
| 05 | **06** api + **07** app | Split threads |
| 06 | **16** | BlobStore |
| 07 | **17** | Attachment refs |
| 08 | **22** api + **23** app | Split drafts |
| 09 | **24** | Scheduler |
| 10 | **10** api + **11** app | Split typing/presence |
| 11 | **25** api + **26** app + **27** | Split schedule + recurrence |
| 12 | **12** api + **13** app | Split unread |
| 13 | **14** api + **15** app | Split DM peers |
| 14 | **21** | Files pane |
| 15 | **28** | Polls |
| 16 | **29** | Recording (+ Loom spec) |
| — | **08**, **09**, **18**–**20** | New splits (reactions, actions, upload chain) |

## Frontier

Wave-2 parallel batch complete — all five PRs open for review: **03** [#15](https://github.com/mateusmento/denser/pull/15); **04** [#13](https://github.com/mateusmento/denser/pull/13) → **05**; **06** [#12](https://github.com/mateusmento/denser/pull/12) → **07**; **10** [#14](https://github.com/mateusmento/denser/pull/14) → **11** (**requires [30](./issues/30-realtime-scaling-ports.md) before multi-instance**); **18** [#16](https://github.com/mateusmento/denser/pull/16) → **19**.
