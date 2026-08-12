import { paragraphDoc } from "@/modules/rich-text";
import type {
  ConversationChannelHeaderView,
  ConversationMessageView,
  ConversationPersonView,
  ConversationThreadView,
  SchedulePreset,
} from "./types";

const ava: ConversationPersonView = { id: "u-ava", name: "Ava Chen", initials: "AC" };
const jon: ConversationPersonView = { id: "u-jon", name: "Jon Park", initials: "JP" };
const mia: ConversationPersonView = { id: "u-mia", name: "Mia Rossi", initials: "MR" };

export const channelHeader: ConversationChannelHeaderView = {
  title: "launch",
  description: "Ship-week coordination",
  presenceLabel: "3 viewing",
  members: [ava, jon, mia],
};

export const schedulePresets: readonly SchedulePreset[] = [
  { id: "morning", label: "Tomorrow morning", whenLabel: "Tomorrow, 9:00 AM" },
  { id: "afternoon", label: "Tomorrow afternoon", whenLabel: "Tomorrow, 2:00 PM" },
];

function message(
  partial: Pick<ConversationMessageView, "id" | "author" | "createdAt" | "createdAtLabel"> &
    Partial<ConversationMessageView> & { text: string },
): ConversationMessageView {
  const { text, ...rest } = partial;
  return {
    body: paragraphDoc(text),
    grouped: false,
    reactions: [],
    replyCount: 0,
    ...rest,
  };
}

export const channelMessages: ConversationMessageView[] = [
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
    id: "m4",
    author: mia,
    text: "I’ll take copy for the empty channel state.",
    createdAt: "2026-08-11T09:12:00.000Z",
    createdAtLabel: "9:12 AM",
  }),
];

export const threadView: ConversationThreadView = {
  parent: channelMessages[1]!,
  messages: [
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
  ],
};

export const mentionPeople = [ava, jon, mia].map((person) => ({
  id: person.id,
  label: person.name,
}));

export function conversationMentionItems(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [...mentionPeople];
  return mentionPeople.filter((person) => person.label.toLowerCase().includes(q));
}
