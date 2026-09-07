import type { SpaceId } from "@denser/contracts";

/** DMs keep workspace on the conversation row; channel artifacts have `rootSpaceId` set. */
export function scheduledMessageRootSpaceId(input: {
  artifactRootSpaceId: SpaceId | null;
  conversationRootSpaceId: SpaceId | null | undefined;
}): SpaceId | null {
  return input.conversationRootSpaceId ?? input.artifactRootSpaceId ?? null;
}
