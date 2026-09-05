import {
  SEED_ARTIFACT_CHAN_PRODUCT,
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
  makeProductDesignSeedMessageId,
  SEED_PD_MSG_DELETED,
  SEED_PD_MSG_EDITED,
  SEED_PD_MSG_QUOTE_IN_WINDOW,
  SEED_PD_MSG_QUOTE_OUT_WINDOW,
  SEED_PD_MSG_QUOTE_TARGET_FAR,
  SEED_PD_MSG_QUOTE_TARGET_NEAR,
  SEED_PD_MSG_THREAD_PARENT,
  SEED_PD_MSG_THREAD_REPLY_1,
  SEED_PD_MSG_THREAD_REPLY_2,
  SEED_PD_MSG_THREAD_REPLY_3,
} from "./ids.js";
import type { SeedConversationMessage, SeedConversationMessagesModule } from "./types.js";

const AUTHORS = [
  SEED_USER_CAROL,
  SEED_USER_ALICE,
  SEED_USER_DAVID,
  SEED_USER_EMMA,
  SEED_USER_FRANK,
] as const satisfies readonly UserId[];

const SNIPPETS = [
  "Figma variables exported to the design-system package.",
  "Component audit: 12 buttons still using legacy radius tokens.",
  "User research synthesis for onboarding friction is in Research space.",
  "Proposed calmer default density for conversation timelines.",
  "Icon set v2 needs a filled variant for active nav items.",
  "Accessibility pass on modal focus traps — two issues remain.",
  "Design critique notes for the sprint review deck.",
  "Mobile tap targets below 44px on attachment tiles.",
  "Color contrast fix for muted foreground on dark mode.",
  "Storybook stories added for unread divider and badges.",
  "Wireframes for scheduled send picker are ready for review.",
  "Typography scale tweak: bump small caption to 12px.",
  "Pattern library entry for inline quote previews.",
  "Empty states for thread pane need illustration options.",
  "Research clip: users miss the jump-to-latest affordance.",
  "Pagination decision — cursor tuple ordering with around-anchor.",
  "Hover menu actions aligned with Slack muscle memory.",
  "Draft autosave UX copy review scheduled for Thursday.",
  "Emoji picker lazy load saved 40kb on mobile web.",
  "Presence dots spec matches engineering implementation.",
  "Design QA on reaction chips — spacing feels tight.",
  "Component token rename: surface-elevated → card.",
  "Navigation sync between sidebar and tab bar documented.",
  "Prototype for DM hide preference in sidebar menu.",
  "File upload tile states: uploading, failed, retry.",
  "Quote jump should fetch around-cursor when target is far.",
  "Thread reply count badge deferred to API follow-up.",
  "Dark mode token drift between app and design-system.",
  "Illustration brief for channel intro empty state.",
  "Form field focus ring uses ring token, not outline.",
  "Skeleton loaders for message list first paint.",
  "Composer attachment staging matches Slack tile layout.",
  "Read-state divider placement validated in usability test.",
  "Badge count cap at 99+ for sidebar nav items.",
  "Scroll anchoring when prepending older message pages.",
  "Virtualized list spike — not needed until 10k messages.",
  "Design review: reaction toggle optimistic UI.",
  "Spacing grid audit on conversation header.",
  "Tooltip delay unified to 400ms across shell.",
  "Keyboard shortcuts map for message actions menu.",
] as const;

const TOTAL = 120;

function authorAt(seq: number): UserId {
  return AUTHORS[(seq - 1) % AUTHORS.length]!;
}

function minutesAgo(seq: number): string {
  const minutes = (TOTAL - seq) * 2;
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function snippetAt(seq: number): string {
  return SNIPPETS[(seq - 1) % SNIPPETS.length] ?? `Design sync note #${seq}.`;
}

function buildTimeline(): SeedConversationMessage[] {
  const rows: SeedConversationMessage[] = [];

  for (let seq = 1; seq <= TOTAL; seq += 1) {
    if (
      seq === 58 ||
      seq === 59 ||
      seq === 60 ||
      seq === 61 ||
      seq === 115 ||
      seq === 116 ||
      seq === TOTAL
    ) {
      continue;
    }

    const createdAt = minutesAgo(seq);
    const isDeleted = seq === 40;
    const isEdited = seq === 80;
    const isQuoteTargetFar = seq === 12;
    const isQuoteTargetNear = seq === 95;

    let text = snippetAt(seq);
    if (isQuoteTargetFar) {
      text =
        "Pagination anchor — far from the live edge. Quote jumps here should trigger around-fetch from deep history.";
    } else if (isQuoteTargetNear) {
      text =
        "Near-window quote target — visible when paginating around the middle of #product-design.";
    } else if (isEdited) {
      text = `${snippetAt(seq)} (edited after critique)`;
    }

    const row: SeedConversationMessage = {
      id: makeProductDesignSeedMessageId(seq),
      conversationId: SEED_ARTIFACT_CHAN_PRODUCT,
      rootSpaceId: SEED_SPACE_ACME,
      authorId: authorAt(seq),
      body: seedParagraph(text),
      createdAt,
      ...(isDeleted ? { deletedAt: createdAt } : {}),
      ...(isEdited
        ? { editedAt: new Date(Date.parse(createdAt) + 120_000).toISOString() }
        : {}),
    };

    if (seq === 55) {
      row.reactions = [
        { emoji: "👍", userId: SEED_USER_ALICE },
        { emoji: "✅", userId: SEED_USER_CAROL },
        { emoji: "🎨", userId: SEED_USER_DAVID },
      ];
    } else if (seq === 70) {
      row.reactions = [
        { emoji: "👀", userId: SEED_USER_EMMA },
        { emoji: "💡", userId: SEED_USER_FRANK },
      ];
    } else if (seq === 90) {
      row.reactions = [
        { emoji: "💯", userId: SEED_USER_ALICE },
        { emoji: "💯", userId: SEED_USER_DAVID },
        { emoji: "🔥", userId: SEED_USER_CAROL },
      ];
    }

    rows.push(row);
  }

  rows.push({
    id: SEED_PD_MSG_THREAD_PARENT,
    conversationId: SEED_ARTIFACT_CHAN_PRODUCT,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_CAROL,
    body: seedParagraph(
      "Should we ship the calmer timeline density as default for all channels?",
    ),
    createdAt: minutesAgo(58),
    reactions: [{ emoji: "🧵", userId: SEED_USER_ALICE }],
  });

  const threadReplies = [
    {
      id: SEED_PD_MSG_THREAD_REPLY_1,
      authorId: SEED_USER_ALICE,
      text: "Yes for DMs and small teams — maybe not for high-volume channels yet.",
    },
    {
      id: SEED_PD_MSG_THREAD_REPLY_2,
      authorId: SEED_USER_DAVID,
      text: "Could we A/B behind a workspace preference first?",
    },
    {
      id: SEED_PD_MSG_THREAD_REPLY_3,
      authorId: SEED_USER_EMMA,
      text: "I'll add metrics for scroll depth before we decide.",
    },
  ] as const;

  for (const [index, reply] of threadReplies.entries()) {
    rows.push({
      id: reply.id,
      conversationId: SEED_ARTIFACT_CHAN_PRODUCT,
      rootSpaceId: SEED_SPACE_ACME,
      authorId: reply.authorId,
      threadId: SEED_PD_MSG_THREAD_PARENT,
      body: seedParagraph(reply.text),
      createdAt: minutesAgo(59 + index),
      ...(index === 0 ? { reactions: [{ emoji: "👍", userId: SEED_USER_CAROL }] } : {}),
    });
  }

  rows.push({
    id: SEED_PD_MSG_QUOTE_IN_WINDOW,
    conversationId: SEED_ARTIFACT_CHAN_PRODUCT,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_DAVID,
    quotesId: SEED_PD_MSG_QUOTE_TARGET_NEAR,
    body: seedParagraph(
      "↩ In-window quote — click the preview to scroll to the near pagination anchor.",
    ),
    createdAt: minutesAgo(115),
  });

  rows.push({
    id: SEED_PD_MSG_QUOTE_OUT_WINDOW,
    conversationId: SEED_ARTIFACT_CHAN_PRODUCT,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_CAROL,
    quotesId: SEED_PD_MSG_QUOTE_TARGET_FAR,
    body: seedParagraph(
      "↩ Out-of-window quote — click to jump to the far pagination anchor (around + scroll).",
    ),
    createdAt: minutesAgo(116),
    reactions: [{ emoji: "📌", userId: SEED_USER_ALICE }],
  });

  rows.push({
    id: makeProductDesignSeedMessageId(TOTAL),
    conversationId: SEED_ARTIFACT_CHAN_PRODUCT,
    rootSpaceId: SEED_SPACE_ACME,
    authorId: SEED_USER_CAROL,
    body: seedParagraph(
      "#product-design live edge — 120 messages seeded for pagination testing. Scroll up/down or jump quotes from the middle.",
    ),
    createdAt: minutesAgo(TOTAL),
  });

  return rows.sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id),
  );
}

export const productDesignChannelMessages: SeedConversationMessagesModule = {
  label: "#product-design timeline",
  messages: buildTimeline(),
};

export {
  SEED_PD_MSG_DELETED,
  SEED_PD_MSG_EDITED,
  SEED_PD_MSG_QUOTE_IN_WINDOW,
  SEED_PD_MSG_QUOTE_OUT_WINDOW,
  SEED_PD_MSG_QUOTE_TARGET_FAR,
  SEED_PD_MSG_QUOTE_TARGET_NEAR,
  SEED_PD_MSG_THREAD_PARENT,
};
