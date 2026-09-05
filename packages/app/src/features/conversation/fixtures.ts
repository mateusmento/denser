import type {
  ConversationChannelHeaderView,
  ConversationIntroView,
  ConversationThreadView,
} from "./types";
import { buildDefaultSchedulePresets } from "./lib/schedule-due-at";
import { ava, channelMessages, jon, mia, threadReplyMessages } from "./messageFixtures";

export { channelMessages } from "./messageFixtures";

export const channelHeader: ConversationChannelHeaderView = {
  title: "launch",
  description: "Ship-week coordination",
  presenceLabel: "3 viewing",
  members: [ava, jon, mia],
};

export const channelIntro: ConversationIntroView = {
  kind: "channel",
  title: "launch",
  body: "You created this public channel on August 10, 2026. This is the very beginning of the #launch channel — a place for ship-week coordination and callouts.",
  editDescriptionLabel: "(Edit description)",
  addPeopleLabel: "Add people to the channel",
};

export const schedulePresets = buildDefaultSchedulePresets(new Date("2026-08-10T12:00:00.000Z"));

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
