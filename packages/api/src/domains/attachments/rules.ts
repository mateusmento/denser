import type { AttachmentAnchor, AttachmentId } from "@denser/contracts";

/** Stable, unique identity for an anchor across the three join tables. */
export function anchorKey(anchor: AttachmentAnchor): string {
  switch (anchor.type) {
    case "draft":
      return `draft:${anchor.draftId}`;
    case "scheduled":
      return `scheduled:${anchor.scheduledJobId}`;
    case "message":
      return `message:${anchor.messageId}`;
  }
}

/** The workspace (and optional conversation) an anchor lives in — used for eligibility. */
export type AnchorScope = {
  rootSpaceId: string;
  conversationId?: string | null;
};

/**
 * Compute the exact join-set delta for a `sync`.
 * Pure: given what the anchor currently references and what it must reference,
 * return the ids to add and the ids to drop.
 */
export function computeSyncDelta(
  existing: readonly AttachmentId[],
  target: readonly AttachmentId[],
): { toAdd: AttachmentId[]; toRemove: AttachmentId[] } {
  const existingSet = new Set(existing);
  const targetSet = new Set(target);
  const toAdd = target.filter((id) => !existingSet.has(id));
  const toRemove = existing.filter((id) => !targetSet.has(id));
  return { toAdd, toRemove };
}

/**
 * Eligibility predicate (per ATTACHMENTS.md):
 * workspace match; optional conversation match; uploader match unless `trustedDelivery`
 * (schedule fire / system paths only).
 */
export function isEligibleAttachment(input: {
  attachment: { rootSpaceId: string; conversationId: string | null; uploadedBy: string };
  scope: AnchorScope;
  actorUserId: string;
  trustedDelivery: boolean;
}): boolean {
  const { attachment, scope, actorUserId, trustedDelivery } = input;
  if (attachment.rootSpaceId !== scope.rootSpaceId) return false;
  if (scope.conversationId != null && attachment.conversationId !== scope.conversationId) {
    return false;
  }
  if (!trustedDelivery && attachment.uploadedBy !== actorUserId) return false;
  return true;
}

/**
 * GC eligibility (per ATTACHMENTS.md "GC only when join refcount = 0 (+ grace);
 * never GC protected rows").
 */
export function isGcable(input: {
  joinCount: number;
  createdAt: Date;
  graceBefore: Date;
  protected: boolean;
}): boolean {
  if (input.protected) return false;
  if (input.joinCount !== 0) return false;
  return input.createdAt.getTime() < input.graceBefore.getTime();
}
