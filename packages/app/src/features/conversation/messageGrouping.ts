import type { ConversationMessageView } from "./types";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type ConversationDayGroup = {
  id: string;
  label: string;
  messages: ConversationMessageView[];
};

export type ConversationListItem =
  | { kind: "day"; id: string; label: string }
  | { kind: "message"; message: ConversationMessageView };

export function withGroupedChrome(
  messages: readonly ConversationMessageView[],
): ConversationMessageView[] {
  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const grouped = Boolean(
      previous &&
      previous.author.id === message.author.id &&
      Math.abs(Date.parse(message.createdAt) - Date.parse(previous.createdAt)) < GROUP_WINDOW_MS &&
      dayKey(previous.createdAt) === dayKey(message.createdAt),
    );
    return { ...message, grouped };
  });
}

export function conversationDayGroups(
  messages: readonly ConversationMessageView[],
): ConversationDayGroup[] {
  const grouped = withGroupedChrome(messages);
  const groups: ConversationDayGroup[] = [];

  for (const message of grouped) {
    const day = dayKey(message.createdAt);
    const current = groups.at(-1);
    if (!current || current.id !== `day-${day}`) {
      groups.push({
        id: `day-${day}`,
        label: dayLabel(message.createdAt),
        messages: [message],
      });
      continue;
    }
    current.messages.push(message);
  }

  return groups;
}

export function conversationListItems(
  messages: readonly ConversationMessageView[],
): ConversationListItem[] {
  const items: ConversationListItem[] = [];
  for (const group of conversationDayGroups(messages)) {
    items.push({ kind: "day", id: group.id, label: group.label });
    for (const message of group.messages) {
      items.push({ kind: "message", message });
    }
  }
  return items;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}
