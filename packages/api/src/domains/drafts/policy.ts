import type { MessageDraftRow } from "./repository.js";

/** Default draft TTL (~72h), slid forward on every upsert. See docs/MESSAGE-DRAFTS.md. */
export const DRAFT_TTL_MS = 72 * 60 * 60 * 1000;

export function nextDraftExpiry(now = new Date()): Date {
  return new Date(now.getTime() + DRAFT_TTL_MS);
}

export type UpsertDecision =
  | { kind: "create" }
  | { kind: "update" }
  | { kind: "conflict"; draft: MessageDraftRow | null };

/**
 * Resolves the optimistic upsert outcome:
 * - no row → create only when the client sends version 0; anything else is a
 *   conflict with no server draft to return.
 * - row exists and version matches → update (bumps to version + 1).
 * - row exists and version is stale → conflict, return the server draft.
 */
export function decideUpsert(
  existing: MessageDraftRow | null | undefined,
  inputVersion: number,
): UpsertDecision {
  if (!existing) {
    return inputVersion === 0
      ? { kind: "create" }
      : { kind: "conflict", draft: null };
  }
  if (existing.version !== inputVersion) {
    return { kind: "conflict", draft: existing };
  }
  return { kind: "update" };
}