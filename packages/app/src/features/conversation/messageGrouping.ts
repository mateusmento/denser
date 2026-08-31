import type {
  ConversationMessageGroupView,
  ConversationMessageView,
  ConversationPersonView,
} from "./types";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type ConversationDayGroup = {
  id: string;
  label: string;
  messageGroups: ConversationMessageGroupView[];
};

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

function continuesGroup(previous: ConversationMessageView, next: ConversationMessageView): boolean {
  return (
    previous.author.id === next.author.id &&
    Math.abs(Date.parse(next.createdAt) - Date.parse(previous.createdAt)) < GROUP_WINDOW_MS &&
    dayKey(previous.createdAt) === dayKey(next.createdAt)
  );
}

/** Cluster consecutive same-author messages within the grouping window. */
export function conversationMessageGroups(
  messages: readonly ConversationMessageView[],
): ConversationMessageGroupView[] {
  const groups: Array<{
    id: string;
    author: ConversationPersonView;
    createdAtLabel: string;
    messages: ConversationMessageView[];
  }> = [];

  for (const message of messages) {
    const current = groups.at(-1);
    const last = current?.messages.at(-1);
    if (current && last && continuesGroup(last, message)) {
      current.messages.push(message);
      continue;
    }
    groups.push({
      id: `group-${message.id}`,
      author: message.author,
      createdAtLabel: message.createdAtLabel,
      messages: [message],
    });
  }

  return groups;
}

/** Day buckets containing same-author message groups (for sticky day chips). */
export function conversationDayGroups(
  messages: readonly ConversationMessageView[],
): ConversationDayGroup[] {
  const days: ConversationDayGroup[] = [];

  for (const group of conversationMessageGroups(messages)) {
    const first = group.messages[0];
    if (!first) continue;
    const day = dayKey(first.createdAt);
    const current = days.at(-1);
    if (!current || current.id !== `day-${day}`) {
      days.push({
        id: `day-${day}`,
        label: dayLabel(first.createdAt),
        messageGroups: [group],
      });
      continue;
    }
    current.messageGroups.push(group);
  }

  return days;
}
