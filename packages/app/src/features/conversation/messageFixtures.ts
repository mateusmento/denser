import { paragraphDoc, emptyDoc, type JSONContent } from "@/modules/rich-text";
import type { ConversationMessageView, ConversationPersonView } from "./types";

export const ava: ConversationPersonView = {
  id: "u-ava",
  name: "Ava Chen",
  initials: "AC",
};
export const jon: ConversationPersonView = {
  id: "u-jon",
  name: "Jon Park",
  initials: "JP",
};
export const mia: ConversationPersonView = {
  id: "u-mia",
  name: "Mia Rossi",
  initials: "MR",
};

type MessageFixture = Pick<
  ConversationMessageView,
  "id" | "author" | "createdAt" | "createdAtLabel"
> &
  Partial<ConversationMessageView> &
  ({ text: string; body?: never } | { body: JSONContent; text?: never });

export function message(partial: MessageFixture): ConversationMessageView {
  const { text, body, ...rest } = partial;
  return {
    body: body ?? paragraphDoc(text ?? ""),
    reactions: [],
    replyCount: 0,
    ...rest,
  };
}

/** Channel history fixtures — chronological; grouping applied at render time. */
export const channelMessages: ConversationMessageView[] = [
  // —— Mon Aug 10 ——
  message({
    id: "m1",
    author: ava,
    text: "Kickoff notes are in the doc. Call out blockers here.",
    createdAt: "2026-08-10T14:02:00.000Z",
    createdAtLabel: "2:02 PM",
  }),
  message({
    id: "m2",
    author: jon,
    text: "API auth is in. I’ll follow with the session cookie path.",
    createdAt: "2026-08-10T14:06:00.000Z",
    createdAtLabel: "2:06 PM",
    reactions: [{ emoji: "👍", count: 2, mine: true }],
    replyCount: 20,
  }),
  message({
    id: "m3",
    author: jon,
    text: "Also need a decision on scheduled sends.",
    createdAt: "2026-08-10T14:07:00.000Z",
    createdAtLabel: "2:07 PM",
  }),
  message({
    id: "m8",
    author: jon,
    text: "Draft PR up in ~20m.",
    createdAt: "2026-08-10T14:08:00.000Z",
    createdAtLabel: "2:08 PM",
  }),
  message({
    id: "m9",
    author: mia,
    text: "Standing by for the auth review.",
    createdAt: "2026-08-10T15:40:00.000Z",
    createdAtLabel: "3:40 PM",
  }),
  message({
    id: "m10",
    author: mia,
    text: "Can pair on the empty-state copy if useful.",
    createdAt: "2026-08-10T15:41:00.000Z",
    createdAtLabel: "3:41 PM",
  }),
  message({
    id: "m11",
    author: mia,
    text: "Link me when the branch is ready.",
    createdAt: "2026-08-10T15:42:00.000Z",
    createdAtLabel: "3:42 PM",
  }),

  // —— Tue Aug 11 ——
  message({
    id: "m4",
    author: mia,
    text: "I’ll take copy for the empty channel state.",
    createdAt: "2026-08-11T09:12:00.000Z",
    createdAtLabel: "9:12 AM",
  }),
  message({
    id: "m5",
    author: ava,
    createdAt: "2026-08-11T09:18:00.000Z",
    createdAtLabel: "9:18 AM",
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Priority for today: " },
            { type: "text", marks: [{ type: "bold" }], text: "ship the composer" },
            { type: "text", text: ", then " },
            { type: "text", marks: [{ type: "italic" }], text: "polish empty states" },
            { type: "text", text: ". Anything marked " },
            { type: "text", marks: [{ type: "strike" }], text: "nice-to-have" },
            { type: "text", text: " waits." },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Empty-state checklist — " },
            { type: "mention", attrs: { id: "u-ava", label: "Ava Chen" } },
            { type: "text", text: " can you review?" },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Channel with zero messages" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Thread with only the parent" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Composer " },
                    { type: "text", marks: [{ type: "bold" }], text: "disabled" },
                    { type: "text", text: " when offline" },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "typescript" },
          content: [
            {
              type: "text",
              text: 'emptyLabel ?? "No messages yet. Say hello."',
            },
          ],
        },
      ],
    },
  }),
  message({
    id: "m6",
    author: jon,
    createdAt: "2026-08-11T09:22:00.000Z",
    createdAtLabel: "9:22 AM",
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Cookie path should land as " },
            { type: "text", marks: [{ type: "code" }], text: "/api/session" },
            { type: "text", text: ". Docs: " },
            {
              type: "text",
              marks: [{ type: "link", attrs: { href: "https://example.com/auth" } }],
              text: "auth notes",
            },
            { type: "text", text: "." },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Do not store the refresh token in localStorage — httpOnly cookie only.",
                },
              ],
            },
          ],
        },
      ],
    },
  }),
  message({
    id: "m7",
    author: mia,
    createdAt: "2026-08-11T09:30:00.000Z",
    createdAtLabel: "9:30 AM",
    reactions: [{ emoji: "✅", count: 1, mine: false }],
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Empty-state checklist — " },
            { type: "mention", attrs: { id: "u-ava", label: "Ava Chen" } },
            { type: "text", text: " can you review?" },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Channel with zero messages" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Thread with only the parent" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Composer " },
                    { type: "text", marks: [{ type: "bold" }], text: "disabled" },
                    { type: "text", text: " when offline" },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "typescript" },
          content: [
            {
              type: "text",
              text: 'emptyLabel ?? "No messages yet. Say hello."',
            },
          ],
        },
      ],
    },
  }),
  message({
    id: "m-attachments",
    author: ava,
    text: "Specs and a screenshot from staging.",
    createdAt: "2026-08-11T10:00:00.000Z",
    createdAtLabel: "10:00 AM",
    attachments: [
      {
        id: "att-image",
        name: "admin-dashboard.png",
        mimeType: "image/png",
        url: "https://picsum.photos/seed/denser-dashboard/480/360",
        byteSize: 248_320,
        kind: "media",
      },
      {
        id: "att-file",
        name: "launch-checklist.pdf",
        mimeType: "application/pdf",
        url: "https://example.com/launch-checklist.pdf",
        byteSize: 94_208,
        kind: "file",
      },
    ],
  }),
  message({
    id: "m12",
    author: ava,
    text: "Looks good — merge when green.",
    createdAt: "2026-08-11T11:05:00.000Z",
    createdAtLabel: "11:05 AM",
  }),
  message({
    id: "m13",
    author: ava,
    text: "I’ll update the launch checklist after lunch.",
    createdAt: "2026-08-11T11:06:00.000Z",
    createdAtLabel: "11:06 AM",
  }),

  // —— Wed Aug 12 ——
  message({
    id: "m14",
    author: jon,
    text: "Deployed auth to staging.",
    createdAt: "2026-08-12T10:00:00.000Z",
    createdAtLabel: "10:00 AM",
  }),
  message({
    id: "m15",
    author: mia,
    text: "Smoke-tested login on mobile — ok.",
    createdAt: "2026-08-12T10:14:00.000Z",
    createdAtLabel: "10:14 AM",
  }),
  message({
    id: "m16",
    author: mia,
    text: "Desktop Safari next.",
    createdAt: "2026-08-12T10:15:00.000Z",
    createdAtLabel: "10:15 AM",
  }),
  message({
    id: "m17",
    author: ava,
    text: "Thread unread badges still feel off on narrow widths.",
    createdAt: "2026-08-12T16:22:00.000Z",
    createdAtLabel: "4:22 PM",
  }),

  // —— Thu Aug 13 ——
  message({
    id: "m18",
    author: jon,
    text: "Pushed a fix for the badge overflow.",
    createdAt: "2026-08-13T09:01:00.000Z",
    createdAtLabel: "9:01 AM",
  }),
  message({
    id: "m19",
    author: jon,
    text: "Also tightened the header truncate.",
    createdAt: "2026-08-13T09:02:00.000Z",
    createdAtLabel: "9:02 AM",
  }),
  message({
    id: "m20",
    author: jon,
    text: "Ready for another pass.",
    createdAt: "2026-08-13T09:03:00.000Z",
    createdAtLabel: "9:03 AM",
  }),
  message({
    id: "m21",
    author: ava,
    createdAt: "2026-08-13T13:40:00.000Z",
    createdAtLabel: "1:40 PM",
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Ship criteria for Friday:" }],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "Composer" },
                    { type: "text", text: " send + schedule happy path" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Thread open / close without layout jump" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "No regressions on " },
                    { type: "text", marks: [{ type: "code" }], text: "MessageScroller" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  }),

  // —— Fri Aug 14 ——
  message({
    id: "m22",
    author: mia,
    text: "Copy deck is in Figma.",
    createdAt: "2026-08-14T08:55:00.000Z",
    createdAtLabel: "8:55 AM",
  }),
  message({
    id: "m23",
    author: jon,
    text: "Staging is green.",
    createdAt: "2026-08-14T11:20:00.000Z",
    createdAtLabel: "11:20 AM",
    reactions: [{ emoji: "🎉", count: 3, mine: true }],
  }),
  message({
    id: "m24",
    author: ava,
    text: "Locking scope — no new inserts after noon.",
    createdAt: "2026-08-14T12:05:00.000Z",
    createdAtLabel: "12:05 PM",
  }),

  // —— Mon Aug 17 ——
  message({
    id: "m25",
    author: ava,
    text: "Welcome back — retro notes pinned in the doc.",
    createdAt: "2026-08-17T09:00:00.000Z",
    createdAtLabel: "9:00 AM",
  }),
  message({
    id: "m26",
    author: jon,
    text: "I’ll own the scroll fade polish.",
    createdAt: "2026-08-17T09:12:00.000Z",
    createdAtLabel: "9:12 AM",
  }),
  message({
    id: "m27",
    author: mia,
    text: "Taking intro + day badge.",
    createdAt: "2026-08-17T09:18:00.000Z",
    createdAtLabel: "9:18 AM",
  }),
];

const quotedSource = channelMessages[1]!;
const quotedRichSource = channelMessages[7]!;

/** Reply quoting a short earlier message. */
export const messageWithShortQuote: ConversationMessageView = message({
  id: "m-quote-short",
  author: mia,
  text: "Totally agree — let's ship it.",
  createdAt: "2026-08-11T09:35:00.000Z",
  createdAtLabel: "9:35 AM",
  quoted: {
    id: quotedSource.id,
    author: quotedSource.author,
    body: quotedSource.body,
    displayContent: "API auth is in. I'll follow with the session cookie path.",
    hasAttachment: false,
    sizeCapped: false,
  },
});

/** Reply quoting a long rich-text message (overflow gradient). */
export const messageWithLongQuote: ConversationMessageView = message({
  id: "m-quote-long",
  author: jon,
  text: "Copy deck looks good from here.",
  createdAt: "2026-08-11T09:40:00.000Z",
  createdAtLabel: "9:40 AM",
  quoted: {
    id: quotedRichSource.id,
    author: quotedRichSource.author,
    body: quotedRichSource.body,
    displayContent:
      "Priority for today: ship the composer, then polish empty states. Anything marked nice-to-have waits.",
    hasAttachment: false,
    sizeCapped: true,
  },
});

/** Reply quoting an attachment-only message. */
export const messageWithAttachmentQuote: ConversationMessageView = message({
  id: "m-quote-attachment",
  author: ava,
  text: "Can you re-upload the screenshot?",
  createdAt: "2026-08-11T10:05:00.000Z",
  createdAtLabel: "10:05 AM",
  quoted: {
    id: "m-attachment-src",
    author: jon,
    body: emptyDoc(),
    displayContent: "",
    hasAttachment: true,
    sizeCapped: false,
  },
});

export const threadReplyMessages: ConversationMessageView[] = [
  // —— Mon Aug 10 ——
  // Ava burst
  message({
    id: "t1",
    author: ava,
    text: "Scheduled sends should keep the draft on failure.",
    createdAt: "2026-08-10T14:10:00.000Z",
    createdAtLabel: "2:10 PM",
  }),
  message({
    id: "t2",
    author: ava,
    text: "Also need conflict handling if two tabs schedule the same draft.",
    createdAt: "2026-08-10T14:11:00.000Z",
    createdAtLabel: "2:11 PM",
  }),
  message({
    id: "t3",
    author: ava,
    text: "Ship criteria: retry works offline→online, no duplicate sends.",
    createdAt: "2026-08-10T14:12:30.000Z",
    createdAtLabel: "2:12 PM",
  }),
  // Jon burst
  message({
    id: "t4",
    author: jon,
    text: "Agreed — inline retry, not a toast.",
    createdAt: "2026-08-10T14:14:00.000Z",
    createdAtLabel: "2:14 PM",
  }),
  message({
    id: "t5",
    author: jon,
    text: "409 merge-retry same as channel edits — I’ll wire that.",
    createdAt: "2026-08-10T14:15:00.000Z",
    createdAtLabel: "2:15 PM",
  }),
  message({
    id: "t6",
    author: jon,
    text: "Yes — muted caption under the composer, only when a schedule exists.",
    createdAt: "2026-08-10T14:16:20.000Z",
    createdAtLabel: "2:16 PM",
  }),
  message({
    id: "t7",
    author: jon,
    text: "I’ll add a Storybook case with a long thread so we can stress the scroller.",
    createdAt: "2026-08-10T14:17:00.000Z",
    createdAtLabel: "2:17 PM",
  }),
  // Mia burst
  message({
    id: "t8",
    author: mia,
    text: "Copy for the failure state: “Couldn’t schedule — draft kept.”",
    createdAt: "2026-08-10T14:31:00.000Z",
    createdAtLabel: "2:31 PM",
  }),
  message({
    id: "t9",
    author: mia,
    text: "Can we surface the last good send time under the composer?",
    createdAt: "2026-08-10T14:32:00.000Z",
    createdAtLabel: "2:32 PM",
  }),
  message({
    id: "t10",
    author: mia,
    text: "Thread pane should keep the parent sticky while replies scroll.",
    createdAt: "2026-08-10T14:33:30.000Z",
    createdAtLabel: "2:33 PM",
  }),

  // —— Tue Aug 11 ——
  // Ava burst
  message({
    id: "t11",
    author: ava,
    text: "Morning check: schedule retry landed in the draft branch.",
    createdAt: "2026-08-11T09:05:00.000Z",
    createdAtLabel: "9:05 AM",
  }),
  message({
    id: "t12",
    author: ava,
    text: "Day chips in threads should use card fill, not channel background.",
    createdAt: "2026-08-11T09:06:00.000Z",
    createdAtLabel: "9:06 AM",
  }),
  message({
    id: "t13",
    author: ava,
    text: "Closing the loop: schedule + retry + thread scroll are Friday blockers.",
    createdAt: "2026-08-11T09:07:30.000Z",
    createdAtLabel: "9:07 AM",
  }),
  // Jon burst
  message({
    id: "t14",
    author: jon,
    text: "Verified on a slow 3G throttle — draft survives, one send.",
    createdAt: "2026-08-11T09:28:00.000Z",
    createdAtLabel: "9:28 AM",
  }),
  message({
    id: "t15",
    author: jon,
    text: "While you’re there — jump-to-latest in the thread scroller needs the same edge fade as channel.",
    createdAt: "2026-08-11T09:29:00.000Z",
    createdAtLabel: "9:29 AM",
  }),
  message({
    id: "t16",
    author: jon,
    text: "One more reply so we can scroll past a second sticky day while the menu is open.",
    createdAt: "2026-08-11T09:30:20.000Z",
    createdAtLabel: "9:30 AM",
  }),
  message({
    id: "t17",
    author: jon,
    text: "Sounds good — ping me if the parent + composer steal too much height.",
    createdAt: "2026-08-11T09:31:00.000Z",
    createdAtLabel: "9:31 AM",
  }),
  // Mia burst
  message({
    id: "t18",
    author: mia,
    text: "Empty-thread composer still looks cramped; I’ll nudge padding.",
    createdAt: "2026-08-11T10:20:00.000Z",
    createdAtLabel: "10:20 AM",
  }),
  message({
    id: "t19",
    author: mia,
    text: "Noted — ThreadPane already passes dayClass for card fill.",
    createdAt: "2026-08-11T10:21:00.000Z",
    createdAtLabel: "10:21 AM",
  }),
  message({
    id: "t20",
    author: mia,
    text: "I’ll own thread scroll QA in Storybook before standup.",
    createdAt: "2026-08-11T10:22:30.000Z",
    createdAtLabel: "10:22 AM",
  }),
];
