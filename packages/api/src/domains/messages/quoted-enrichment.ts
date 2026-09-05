import type { ArtifactId, MessageId, QuotedPreviewDto, UserId } from "@denser/contracts";
import { buildQuotedPreview } from "./quoted-preview.js";
import type { MessageRow } from "./types.js";

export type AuthorDisplay = {
  name: string;
  avatarUrl: string | null;
};

export type QuotedEnrichmentDeps = {
  findMessagesByIds(ids: readonly MessageId[]): Promise<Map<MessageId, MessageRow>>;
  loadAttachmentIdsForMessages(
    messageIds: readonly MessageId[],
  ): Promise<Map<MessageId, import("@denser/contracts").AttachmentId[]>>;
  loadAuthorDisplay(userIds: readonly UserId[]): Promise<Map<UserId, AuthorDisplay>>;
};

/**
 * Join-on-read quoted previews for a batch of messages.
 * Returns a map from quoted message id → preview DTO.
 */
export async function loadQuotedPreviews(
  rows: readonly MessageRow[],
  conversationId: ArtifactId,
  deps: QuotedEnrichmentDeps,
): Promise<Map<MessageId, QuotedPreviewDto>> {
  const quoteIds = [
    ...new Set(
      rows
        .map((row) => row.quotesId)
        .filter((id): id is MessageId => id != null),
    ),
  ];
  if (quoteIds.length === 0) return new Map();

  const targets = await deps.findMessagesByIds(quoteIds);
  const validTargets = [...targets.values()].filter(
    (target) => target.conversationId === conversationId,
  );
  if (validTargets.length === 0) return new Map();

  const targetIds = validTargets.map((t) => t.id);
  const [attachmentMap, authorMap] = await Promise.all([
    deps.loadAttachmentIdsForMessages(targetIds),
    deps.loadAuthorDisplay(validTargets.map((t) => t.authorId)),
  ]);

  const previews = new Map<MessageId, QuotedPreviewDto>();
  for (const target of validTargets) {
    const author = authorMap.get(target.authorId);
    if (!author) continue;

    previews.set(
      target.id,
      buildQuotedPreview({
        id: target.id,
        authorId: target.authorId,
        authorName: author.name,
        authorAvatarUrl: author.avatarUrl,
        body: target.body,
        hasAttachment: (attachmentMap.get(target.id)?.length ?? 0) > 0,
      }),
    );
  }
  return previews;
}
