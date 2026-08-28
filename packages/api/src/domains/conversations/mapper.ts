import type { ArtifactId, UserId } from "@denser/contracts";
import { toArtifactSummary } from "../artifacts/mapper.js";
import type { artifact } from "../../db/schema/artifact.js";
import type { ConversationRow } from "./repository.js";

export function toConversationView(
  artifactRow: typeof artifact.$inferSelect,
  conversationRow: ConversationRow,
) {
  return {
    ...toArtifactSummary(artifactRow),
    conversationKind: conversationRow.conversationKind,
  };
}
