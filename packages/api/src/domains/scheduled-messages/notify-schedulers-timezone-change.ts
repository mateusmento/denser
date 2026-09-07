import type { SpaceId, UserId } from "@denser/contracts";
import { emitSchedulerTimezoneChanged } from "../../realtime/user-notifications.js";

export async function notifySchedulersTimezoneChanged(input: {
  spaceId: SpaceId;
  spaceTitle: string;
  schedulerIds: readonly UserId[];
  adjustedJobCount: number;
}): Promise<void> {
  if (input.adjustedJobCount <= 0 || input.schedulerIds.length === 0) return;

  const payload = {
    spaceId: input.spaceId,
    spaceTitle: input.spaceTitle,
    adjustedJobCount: input.adjustedJobCount,
  };

  for (const userId of input.schedulerIds) {
    emitSchedulerTimezoneChanged(userId, payload);
  }
}
