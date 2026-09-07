import type { ArtifactId, ScheduleRecurrenceInput, SpaceId } from "@denser/contracts";
import { recurrenceFromPreset } from "@denser/contracts";
import { findArtifactById } from "../artifacts/repository.js";
import { findConversationByArtifactId } from "../conversations/repository.js";
import { buildJobScheduleTiming } from "../scheduling/service.js";
import { resolveScheduleTimezoneAsync } from "../spaces/timezone.js";

export function buildScheduledMessageTiming(input: {
  dueAt: string;
  recurrence: ScheduleRecurrenceInput;
  weekdays?: number[];
  until?: string | null;
  timezone: string;
}) {
  const recurrence = recurrenceFromPreset(input.recurrence, input.dueAt, input.timezone, {
    ...(input.weekdays ? { weekdays: input.weekdays } : {}),
    ...(input.until ? { until: input.until } : {}),
  });
  return buildJobScheduleTiming({
    dueAt: input.dueAt,
    recurrence,
    timezone: input.timezone,
  });
}

export async function resolveScheduleTimezoneForConversation(
  conversationId: ArtifactId,
): Promise<string> {
  const artifactRow = await findArtifactById(conversationId);
  const conversationRow = await findConversationByArtifactId(conversationId);
  if (!artifactRow || !conversationRow) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  const anchorSpaceId =
    conversationRow.conversationKind === "direct"
      ? artifactRow.rootSpaceId ?? artifactRow.spaceId
      : artifactRow.spaceId ?? artifactRow.rootSpaceId;

  if (!anchorSpaceId) {
    throw new Error(`Conversation has no space anchor: ${conversationId}`);
  }

  const resolved = await resolveScheduleTimezoneAsync(anchorSpaceId);
  return resolved.timezone;
}

export async function resolvePrivateSpaceForConversation(
  conversationId: ArtifactId,
): Promise<SpaceId | null> {
  const artifactRow = await findArtifactById(conversationId);
  const conversationRow = await findConversationByArtifactId(conversationId);
  if (!artifactRow || !conversationRow) return null;

  const anchorSpaceId =
    conversationRow.conversationKind === "direct"
      ? artifactRow.rootSpaceId ?? artifactRow.spaceId
      : artifactRow.spaceId ?? artifactRow.rootSpaceId;

  if (!anchorSpaceId) return null;

  const resolved = await resolveScheduleTimezoneAsync(anchorSpaceId);
  return resolved.privateSpaceId;
}
