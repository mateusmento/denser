import type { ArtifactId, MessageId, SpaceId, TipTapDoc, UserId } from "@denser/contracts";

/** One message row for conversation seeding. Stable ids enable quotes, threads, and jump targets. */
export type SeedConversationMessage = {
  id: MessageId;
  conversationId: ArtifactId;
  rootSpaceId?: SpaceId | null;
  authorId: UserId;
  body: TipTapDoc;
  threadId?: MessageId | null;
  quotesId?: MessageId | null;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
};

/** A split seed module — keep each file focused (e.g. jump-to-quote showcase). */
export type SeedConversationMessagesModule = {
  label: string;
  messages: readonly SeedConversationMessage[];
};
