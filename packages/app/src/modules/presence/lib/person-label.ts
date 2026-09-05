import type { SpaceMember, UserId } from "@denser/contracts";
import type { ConversationMessageView, ConversationPersonView } from "@/features/conversation/types";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function buildPersonRoster(
  members: readonly SpaceMember[],
  messages: readonly ConversationMessageView[],
): Map<UserId, string> {
  const roster = new Map<UserId, string>();
  for (const member of members) {
    roster.set(member.userId, member.name);
  }
  for (const message of messages) {
    if (!roster.has(message.author.id)) {
      roster.set(message.author.id, message.author.name);
    }
  }
  return roster;
}

export function personFromUserId(
  userId: UserId,
  roster: ReadonlyMap<UserId, string>,
): ConversationPersonView {
  const name = roster.get(userId) ?? `Member ${userId.slice(0, 8)}`;
  return { id: userId, name, initials: initialsFromName(name) };
}
