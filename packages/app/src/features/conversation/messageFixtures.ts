import { paragraphDoc, type JSONContent } from "@/modules/rich-text";
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
    grouped: false,
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
    replyCount: 2,
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
          content: [
            { type: "text", text: "Ship criteria for Friday:" },
          ],
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

export const threadReplyMessages: ConversationMessageView[] = [
  message({
    id: "t1",
    author: ava,
    text: "Scheduled sends should keep the draft on failure.",
    createdAt: "2026-08-10T14:10:00.000Z",
    createdAtLabel: "2:10 PM",
  }),
  message({
    id: "t2",
    author: jon,
    text: "Agreed — inline retry, not a toast.",
    createdAt: "2026-08-10T14:11:00.000Z",
    createdAtLabel: "2:11 PM",
  }),
];
