import type { StageKind, WorkflowStageId } from "@denser/contracts";

export type TransitionStage = {
  id: WorkflowStageId;
  kind: StageKind;
  sort: number;
  allowedSourceStageIds: readonly WorkflowStageId[];
};

export function canTransitionStage(
  from: TransitionStage,
  to: TransitionStage,
  onBoard: boolean,
): boolean {
  if (from.id === to.id) return true;

  if (to.allowedSourceStageIds.length > 0 && !to.allowedSourceStageIds.includes(from.id)) {
    return false;
  }

  if (onBoard) return true;

  if (from.kind === "settled" || from.kind === "cancelled") return false;
  return to.sort > from.sort;
}
