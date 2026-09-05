import type { ScheduledJobDto } from "@denser/contracts";

export function isOnceJob(job: Pick<ScheduledJobDto, "recurrence">): boolean {
  if (job.recurrence == null) return true;
  if (typeof job.recurrence === "object" && "frequency" in job.recurrence) {
    const frequency = (job.recurrence as { frequency?: string }).frequency;
    return frequency === "once" || frequency == null;
  }
  return true;
}
