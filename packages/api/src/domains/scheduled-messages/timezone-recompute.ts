import type { SpaceId, UserId } from "@denser/contracts";
import { resolveScheduleTiming } from "@denser/contracts";
import { updateScheduledJobSchedule } from "../scheduling/repository.js";
import * as repo from "./repository.js";
import { resolvePrivateSpaceForConversation } from "./timing.js";

export type RecomputeScheduledJobsResult = {
  updated: number;
  schedulerIds: UserId[];
};

export async function recomputeScheduledJobsForPrivateSpace(
  privateSpaceId: SpaceId,
  newTimezone: string,
): Promise<RecomputeScheduledJobsResult> {
  const jobs = await repo.listActiveScheduledMessages();
  const schedulerIds = new Set<UserId>();
  let updated = 0;

  for (const job of jobs) {
    const resolvedPrivateSpaceId = await resolvePrivateSpaceForConversation(
      job.payload.conversationId,
    );
    if (resolvedPrivateSpaceId !== privateSpaceId) continue;

    schedulerIds.add(job.payload.senderId);

    const timing = resolveScheduleTiming({
      dueAt: job.dueAt,
      recurrence: job.recurrence,
      timezone: newTimezone,
    });

    await updateScheduledJobSchedule(job.id, timing);
    updated += 1;
  }

  return { updated, schedulerIds: [...schedulerIds] };
}
