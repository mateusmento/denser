# Messaging — PR policy (maintainer review)

**Rule:** Every ticket ships as a **GitHub pull request**. No direct commits to `main` for messaging implementation work. The maintainer reviews and merges each PR.

## Per ticket

| Step | Required |
| --- | --- |
| Branch | `agent/messaging-<NN>-<slug>` from latest `main` (or from merged blockers) |
| Commits | On the feature branch only |
| Push | `git push -u origin HEAD` |
| PR | `gh pr create` — **do not skip** |
| Worktree cleanup | `git worktree remove /tmp/opencode/wt/NN --force` (or work in the main clone and skip `/tmp` worktrees) |
| Merge | **Maintainer only** (or explicit user request) |
| After merge | Mark issue `resolved`; update [map.md](./map.md) Decisions-so-far |

## PR title

```
[messaging NN] Short ticket title
```

Examples: `[messaging 03] Core list/send + sliding window`

## PR body template

```markdown
## Ticket
`.scratch/messaging/issues/NN-<slug>.md`

## Summary
1–3 sentences: what this PR delivers end-to-end.

## Acceptance criteria
- [ ] … (copy from issue; check off what this PR satisfies)

## Dependencies
- Blocked by: #123 (merged) / none
- Interfaces: `.scratch/messaging/interfaces.md`

## How to verify
Commands or steps the reviewer can run.

## Out of scope
What this PR intentionally does not include (other ticket numbers).
```

## Stacked / dependent PRs

When ticket B builds on unmerged ticket A:

1. Open PR for **A** first → maintainer reviews.
2. Branch B from **A’s branch** (or rebase B onto `main` after A merges).
3. In B’s PR description: **“Depends on #PR-A — merge A first”** and set GitHub “base” to A’s branch if using stacked PRs, **or** wait until A merges then rebase B onto `main`.

**Scaffold (current):** one PR — ticket **01** (`agent/messaging-01-scaffold`): contracts + schema + ports.

## Wave-1+ parallel PRs

After **01** merges, see [COVERAGE.md](./COVERAGE.md). Api tickets **02, 16, 17, 22, 24** can run in parallel; app tickets follow their API blockers. Each ticket = one PR.

- Claims one issue (`Status: claimed`)
- Uses a **unique branch name**
- Opens its own PR
- Does **not** push to another agent’s branch

Conflicts: rebase onto `main` after earlier merges; do not fold another ticket’s scope into your PR.

## What reviewers see

- Small, ticket-scoped diffs
- Link back to the issue file and domain docs
- CI green (typecheck/tests for touched packages)
- No unrelated formatting churn
- **App/full PRs:** presentational/container split per [frontend-patterns](../../../.cursor/skills/frontend-patterns/SKILL.md); Storybook stories for touched presentationals
- **Api/full PRs:** deep modules at seams per [codebase-design](../../../.cursor/skills/codebase-design/SKILL.md); ports match [interfaces.md](./interfaces.md)

## App / full tickets — agent prerequisite

Before coding UI, read [frontend-patterns](../../../.cursor/skills/frontend-patterns/SKILL.md). In particular:

- [`references/presentational-container.md`](../../../.cursor/skills/frontend-patterns/references/presentational-container.md) — wire sync in containers, not presentationals
- [`references/composables.md`](../../../.cursor/skills/frontend-patterns/references/composables.md) — sync vs UI vs ambient buckets
- [`references/folder-structure.md`](../../../.cursor/skills/frontend-patterns/references/folder-structure.md) — feature vs module; reuse existing `presentationals/`
- [`references/async-ux.md`](../../../.cursor/skills/frontend-patterns/references/async-ux.md) — loading/error for timeline and composer flows

Reuse `packages/app/src/features/conversation/presentationals/` — **wire, don’t rebuild** chrome.

## Api / full tickets — agent prerequisite

Before coding backend, read [codebase-design](../../../.cursor/skills/codebase-design/SKILL.md). In particular:

- **Deep modules** at clean **seams** — ports (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`) and domain modules, not fat handlers
- **Interface** includes invariants, error modes, and ordering — document in module or [interfaces.md](./interfaces.md)
- **Thin HTTP layer** — handlers orchestrate; persistence and vendor SDKs stay behind adapters
- **Test through the interface** — unit tests against the module; integration tests at handler boundaries when needed

Port contracts: [interfaces.md](./interfaces.md). Domain docs: `docs/CONVERSATIONS.md`, `ATTACHMENTS.md`, `MESSAGE-DRAFTS.md`, `SCHEDULING.md`.

## Agents must not

- Push implementation commits directly to `main`
- Merge their own PR without maintainer approval
- Combine multiple ticket numbers in one PR (unless user explicitly asks to batch)
- Leave work only on a local branch with no PR
- **Leave a feature branch checked out only in `/tmp/opencode/wt/NN`** after the PR is open — remove the worktree so maintainers can `git checkout` the branch in the main repo
- **Continue in an opencode session past ~70k–80k tokens** when quality drops — [hand off](./map.md#session-handoff-opencode--long-runs) to a fresh session instead

## Session handoff

See [map.md — Session handoff](./map.md#session-handoff-opencode--long-runs). Before ending a long or degraded session, leave enough context for the next agent to resume without the old chat log.
