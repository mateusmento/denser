import type {
  ConversationChannelHeaderView,
  ConversationIntroView,
  ConversationThreadView,
  SchedulePreset,
} from "./types";
import { ava, channelMessages, jon, mia, threadReplyMessages } from "./messageFixtures";

export { channelMessages } from "./messageFixtures";

export const channelHeader: ConversationChannelHeaderView = {
  title: "launch",
  description: "Ship-week coordination",
  presenceLabel: "3 viewing",
  members: [ava, jon, mia],
};

export const channelIntro: ConversationIntroView = {
  title: "launch",
  body: "You created this public channel on August 10, 2026. This is the very beginning of the #launch channel — a place for ship-week coordination and callouts.",
  editDescriptionLabel: "(Edit description)",
  addPeopleLabel: "Add people to the channel",
};

export const schedulePresets: readonly SchedulePreset[] = [
  { id: "morning", label: "Tomorrow morning", whenLabel: "Tomorrow, 9:00 AM" },
  { id: "afternoon", label: "Tomorrow afternoon", whenLabel: "Tomorrow, 2:00 PM" },
];

export const threadView: ConversationThreadView = {
  parent: channelMessages[1]!,
  messages: threadReplyMessages,
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
