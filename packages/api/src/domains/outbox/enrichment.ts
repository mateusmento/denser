import type { ArtifactId, UserId } from "@denser/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { requireArtifactAccess } from "../tenancy/access.js";

const FALLBACK_CONVERSATION_LABEL = "Unavailable conversation";

export async function resolveConversationLabel(
  userId: UserId,
  conversationId: ArtifactId,
): Promise<string | null> {
  const access = await requireArtifactAccess(userId, conversationId);
  if (!access || access.kind !== "conversation") {
    return null;
  }

  const row = await db.query.artifact.findFirst({
    where: eq(artifact.id, conversationId),
    columns: { title: true },
  });

  return row?.title ?? FALLBACK_CONVERSATION_LABEL;
}

export function outboxContextLabel(threadId: string | null | undefined): "channel" | "thread" {
  return threadId ? "thread" : "channel";
}

export { FALLBACK_CONVERSATION_LABEL };
