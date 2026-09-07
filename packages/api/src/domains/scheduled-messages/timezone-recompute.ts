import type { SpaceId } from "@denser/contracts";
import { resolveScheduleTiming } from "@denser/contracts";
import { updateScheduledJobSchedule } from "../scheduling/repository.js";
import * as repo from "./repository.js";
import { resolvePrivateSpaceForConversation } from "./timing.js";

export async function recomputeScheduledJobsForPrivateSpace(
  privateSpaceId: SpaceId,
  newTimezone: string,
): Promise<number> {
  const jobs = await repo.listActiveScheduledMessages();
  let updated = 0;

  for (const job of jobs) {
    const resolvedPrivateSpaceId = await resolvePrivateSpaceForConversation(
      job.payload.conversationId,
    );
    if (resolvedPrivateSpaceId !== privateSpaceId) continue;

    const timing = resolveScheduleTiming({
      dueAt: job.dueAt,
      recurrence: job.recurrence,
      timezone: newTimezone,
    });

    await updateScheduledJobSchedule(job.id, timing);
    updated += 1;
  }

  return updated;
}
