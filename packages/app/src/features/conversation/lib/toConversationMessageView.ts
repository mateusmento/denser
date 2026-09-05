import type { MessageDto, QuotedPreviewDto, SessionUser } from "@denser/contracts";
import type { JSONContent } from "@/modules/rich-text";
import type {
  ConversationMessageView,
  ConversationPersonView,
  ConversationQuotedPreviewView,
} from "../types";
import { collectImageAttachmentIdsFromDoc } from "./collect-image-attachment-ids";
import { isMediaMime } from "./is-media-mime";

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

function toQuotedPreviewView(quoted: QuotedPreviewDto): ConversationQuotedPreviewView {
  return {
    id: quoted.id,
    author: {
      id: quoted.author.id,
      name: quoted.author.name,
      initials: initialsFromName(quoted.author.name),
      avatarUrl: quoted.author.avatarUrl ?? undefined,
    },
    body: quoted.body as JSONContent,
    displayContent: quoted.displayContent,
    hasAttachment: quoted.hasAttachment ?? false,
    sizeCapped: quoted.sizeCapped ?? false,
  };
}

function tileAttachments(dto: MessageDto): ConversationMessageView["attachments"] {
  const inlineIds = new Set(collectImageAttachmentIdsFromDoc(dto.body as JSONContent));
  return (dto.attachments ?? [])
    .filter((attachment) => !inlineIds.has(attachment.id))
    .map((attachment) => ({
      id: attachment.id,
      name: attachment.originalFilename,
      mimeType: attachment.mimeType,
      url: attachment.url,
      byteSize: attachment.byteSize,
      kind: isMediaMime(attachment.mimeType) ? ("media" as const) : ("file" as const),
    }));
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
    reactions: (dto.reactions ?? []).map((reaction) => ({ emoji: reaction.emoji, count: reaction.count, mine: reaction.reactedByMe })),
    replyCount: 0,
    quoted: dto.quoted ? toQuotedPreviewView(dto.quoted) : undefined,
    attachments: tileAttachments(dto),
    canEdit: isMine && !dto.deletedAt,
    canDelete: isMine && !dto.deletedAt,
  };
}
