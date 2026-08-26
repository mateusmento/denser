import { toArtifactSummary } from "../artifacts/mapper.js";
import type { artifact } from "../../db/schema/artifact.js";

export function toConversationView(artifactRow: typeof artifact.$inferSelect) {
  return toArtifactSummary(artifactRow);
}
