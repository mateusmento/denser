import type { SprintRole } from "@denser/contracts";

export function sprintRoleLabel(role: SprintRole | null | undefined): string | null {
  if (role === "active") return "Active";
  if (role === "upcoming") return "Upcoming";
  if (role === "past") return "Past";
  return null;
}
