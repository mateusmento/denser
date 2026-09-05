import type { MessageDto, SessionUser } from "@denser/contracts";
import type { JSONContent } from "@/modules/rich-text";
import type { ConversationMessageView, ConversationPersonView } from "../types";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function authorForMessage(
  authorId: string,
  currentUser: SessionUser | null,
): ConversationPersonView {
  if (currentUser?.id === authorId) {
    const name = currentUser.name?.trim() || currentUser.email?.trim() || "You";
    return { id: authorId, name, initials: initialsFromName(name) };
  }
  const fallback = `Member ${authorId.slice(0, 8)}`;
  return { id: authorId, name: fallback, initials: initialsFromName(fallback) };
}

function createdAtLabel(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function toConversationMessageView(
  dto: MessageDto,
  currentUser: SessionUser | null,
): ConversationMessageView {
  const isMine = currentUser?.id === dto.authorId;
  return {
    id: dto.id,
    author: authorForMessage(dto.authorId, currentUser),
    body: dto.body as JSONContent,
    createdAt: dto.createdAt,
    createdAtLabel: createdAtLabel(dto.createdAt),
    reactions: [],
    replyCount: 0,
    canEdit: isMine && !dto.deletedAt,
    canDelete: isMine && !dto.deletedAt,
  };
}
