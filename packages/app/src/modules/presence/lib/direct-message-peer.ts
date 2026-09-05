import type { SpaceMember } from "@denser/contracts";

/** Group DM titles use `buildDirectConversationTitle` — "A and B" or "A and N others". */
export function isGroupDirectMessageTitle(title: string): boolean {
  return title.includes(" and ");
}

export function resolveDirectMessagePeerUserId(
  title: string,
  members: readonly SpaceMember[],
  currentUserId: string,
): string | undefined {
  if (isGroupDirectMessageTitle(title)) return undefined;
  const peer = members.find((member) => member.name === title && member.userId !== currentUserId);
  return peer?.userId;
}
