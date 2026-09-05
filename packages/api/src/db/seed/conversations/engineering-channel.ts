import {
  SEED_ARTIFACT_CHAN_ENGINEERING,
  SEED_SPACE_ACME,
  SEED_USER_ALICE,
  SEED_USER_CAROL,
  SEED_USER_DAVID,
  SEED_USER_EMMA,
  SEED_USER_FRANK,
} from "@denser/contracts";
import type { UserId } from "@denser/contracts";
import { seedParagraph } from "./doc.js";
import {
  makeSeedMessageId,
  SEED_MSG_DELETED,
  SEED_MSG_EDITED,
  SEED_MSG_QUOTE_IN_WINDOW,
  SEED_MSG_QUOTE_OUT_WINDOW,
  SEED_MSG_QUOTE_TARGET_FAR,
  SEED_MSG_QUOTE_TARGET_NEAR,
  SEED_MSG_THREAD_PARENT,
  SEED_MSG_THREAD_REPLY_1,
  SEED_MSG_THREAD_REPLY_2,
  SEED_MSG_THREAD_REPLY_3,
} from "./ids.js";
import type { SeedConversationMessage, SeedConversationMessagesModule } from "./types.js";

const AUTHORS = [
  SEED_USER_ALICE,
  SEED_USER_DAVID,
  SEED_USER_EMMA,
  SEED_USER_FRANK,
] as const satisfies readonly UserId[];

const HISTORICAL_SNIPPETS = [
  "Morning — deploy pipeline is green on staging.",
  "Pushed a fix for the websocket reconnect loop.",
  "RFC review for realtime scaling is in the Architecture folder.",
  "Can we bump the postgres pool size before Monday's load test?",
  "We agreed on cursor-based pagination with (created_at, id) tuple ordering. Jump-to-quote demos should land here — far outside the default 20-message window.",
  "Lint rules for the API package are updated on main.",
  "Reminder: incident retro notes go in the runbook doc.",
  "This message is soft-deleted in seed data.",
  "Anyone free for a pairing session on attachment uploads?",
  "Benchmarked listMessages around-cursor — looks good up to 5k rows.",
  "Shipping dark-mode tokens to design-system this week.",
  "Thread summaries will need reply counts from the API later.",
  "Mobile web bundle dropped 40kb after lazy-loading emoji picker.",
  "Please avoid force-pushing shared agent branches.",
  "Database migration 0007 adds message draft tables.",
  "Feature flag service is ready for presence indicators.",
  "Queued a job to backfill attachment mime types.",
  "Stand-up notes: focus on quote preview truncation.",
  "Reviewed PR for virtualized timeline — nice work.",
  "Staging replica lag spiked briefly, now stable.",
  "Added Storybook coverage for hover menus.",
  "Next up: composer autosave and scheduled sends.",
  "Load test window moved to Thursday 14:00 UTC.",
  "Docs pass on CONVERSATIONS.md is in progress.",
] as const;

const RECENT_SNIPPETS = [
  "Presence dots are live behind a flag in staging.",
  "I can repro the jump-to-latest flicker — filing a ticket.",
  "Composer attachments look great in #engineering.",
  "Who owns the unread badge API ticket?",
  "Thread pane scroll feels smooth after the last merge.",
  "Edited copy for the onboarding channel intro.",
  "Let's keep seed data realistic but obviously demo-safe.",
  "Thread pane draft autosave lands next sprint — quote jumps in the default window should target this message.",
  "Emoji reactions API is still unclaimed if anyone wants it.",
  "DM peer dedupe works for the Carol + David group.",
] as const;

function authorAt(seq: number): UserId {
  return AUTHORS[(seq - 1) % AUTHORS.length]!;
}

function minutesAgo(seq: number, total: number): string {
  const minutes = (total - seq) * 3;
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function buildTimeline(): SeedConversationMessage[] {
  const total = 44;
  const rows: SeedConversationMessage[] = [];

  for (let seq = 1; seq <= 24; seq += 1) {
    const snippet = HISTORICAL_SNIPPETS[seq - 1] ?? `Historical engineering note #${seq}.`;
    rows.push({
      id: makeSeedMessageId(seq),
      conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
      rootSpaceId: SEED_SPACE_ACME,
      authorId: authorAt(seq),
      body: seedParagraph(snippet),
      createdAt: minutesAgo(seq, total),
      ...(seq === 8 ? { deletedAt: minutesAgo(seq, total) } : {}),
    });
  }

  for (let seq = 25; seq <= 34; seq += 1) {
    const snippet = RECENT_SNIPPETS[seq - 25] ?? `Recent engineering update #${seq}.`;
    const isEdited = seq === 26;
    rows.push({
      id: makeSeedMessageId(seq),
      conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
      rootSpaceId: SEED_SPACE_ACME,
      authorId: authorAt(seq),
      body: seedParagraph(
        isEdited ? `${snippet} (edited after send)` : snippet,
      ),
      createdAt: minutesAgo(seq, total),
      ...(isEdited
        ? {
            editedAt: new Date(Date.now() - (total - seq) * 3 * 60_000 + 90_000).toISOString(),
          }
        : {}),
    });
  }

  rows.push({
    id: SEED_MSG_THREAD_PARENT,
    conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_ALICE,
    body: seedParagraph("Anyone opposed to shipping presence indicators behind a feature flag?"),
    createdAt: minutesAgo(35, total),
  });

  const threadReplies = [
    {
      id: SEED_MSG_THREAD_REPLY_1,
      authorId: SEED_USER_DAVID,
      text: "Flag sounds good — default off in prod.",
    },
    {
      id: SEED_MSG_THREAD_REPLY_2,
      authorId: SEED_USER_EMMA,
      text: "We should document the rollback path in the runbook.",
    },
    {
      id: SEED_MSG_THREAD_REPLY_3,
      authorId: SEED_USER_FRANK,
      text: "I can add metrics for subscribe/unsubscribe churn.",
    },
  ] as const;

  for (const [index, reply] of threadReplies.entries()) {
    rows.push({
      id: reply.id,
      conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
      rootSpaceId: SEED_SPACE_ACME,
      authorId: reply.authorId,
      threadId: SEED_MSG_THREAD_PARENT,
      body: seedParagraph(reply.text),
      createdAt: minutesAgo(36 + index, total),
    });
  }

  for (let seq = 39; seq <= 41; seq += 1) {
    rows.push({
      id: makeSeedMessageId(seq),
      conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
      rootSpaceId: SEED_SPACE_ACME,
      authorId: authorAt(seq),
      body: seedParagraph(`Latest chatter before quote showcase (#${seq}).`),
      createdAt: minutesAgo(seq, total),
    });
  }

  rows.push({
    id: SEED_MSG_QUOTE_IN_WINDOW,
    conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_CAROL,
    quotesId: SEED_MSG_QUOTE_TARGET_NEAR,
    body: seedParagraph("↩ In-window quote — click the preview to scroll to the autosave thread note."),
    createdAt: minutesAgo(42, total),
  });

  rows.push({
    id: SEED_MSG_QUOTE_OUT_WINDOW,
    conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_ALICE,
    quotesId: SEED_MSG_QUOTE_TARGET_FAR,
    body: seedParagraph(
      "↩ Out-of-window quote — click to fetch the pagination decision message from history (triggers around + jump-to-latest).",
    ),
    createdAt: minutesAgo(43, total),
  });

  rows.push({
    id: makeSeedMessageId(44),
    conversationId: SEED_ARTIFACT_CHAN_ENGINEERING,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_DAVID,
    body: seedParagraph("Seeded timeline ends here — you should be at the live edge."),
    createdAt: minutesAgo(44, total),
  });

  return rows;
}

export const engineeringChannelMessages: SeedConversationMessagesModule = {
  label: "#engineering timeline",
  messages: buildTimeline(),
};

// Named ids re-exported for tests and docs.
export {
  SEED_MSG_DELETED,
  SEED_MSG_EDITED,
  SEED_MSG_QUOTE_IN_WINDOW,
  SEED_MSG_QUOTE_OUT_WINDOW,
  SEED_MSG_QUOTE_TARGET_FAR,
  SEED_MSG_QUOTE_TARGET_NEAR,
  SEED_MSG_THREAD_PARENT,
  SEED_MSG_THREAD_REPLY_1,
  SEED_MSG_THREAD_REPLY_2,
  SEED_MSG_THREAD_REPLY_3,
};
