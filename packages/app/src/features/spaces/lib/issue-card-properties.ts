import type {
  ArtifactId,
  ArtifactSummary,
  DatePropertyDefinition,
  PropertyDefinition,
  PropertyOption,
  SpaceMember,
  UserId,
} from "@denser/contracts";
import {
  isDatePropertyDefinition,
  memberDisplayLabel,
  parsePersonPropertyValue,
  resolvePropertyByRole,
} from "@denser/contracts";
import { formatDatePropertyDisplay } from "@/features/document/lib/date-property-display";

export type IssueCardPriorityChip = {
  label: string;
  color?: string;
};

export type IssueCardLabelChip = {
  name: string;
  color?: string;
};

export type IssueCardRelationLink = {
  title: string;
};

export type IssueCardView = {
  identifier: string | null;
  typeLabel: string | null;
  title: string;
  stage: string | null;
  priority: IssueCardPriorityChip | null;
  assignee: { userId: UserId; label: string; initial: string } | null;
  dueDate: string | null;
  estimate: number | null;
  labels: IssueCardLabelChip[];
  blockedBy: IssueCardRelationLink | null;
  parentEpic: IssueCardRelationLink | null;
};

function optionColor(options: PropertyOption[] | undefined, name: string): string | undefined {
  return options?.find((opt) => opt.name === name)?.color;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value) return [value];
  return [];
}

function relationLink(
  value: unknown,
  relationTitles?: Partial<Record<ArtifactId, string>>,
): IssueCardRelationLink | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw) return null;
  return {
    title: relationTitles?.[raw as ArtifactId] ?? "Linked issue",
  };
}

function resolveAssignee(
  properties: Record<string, unknown>,
  prop: PropertyDefinition | undefined,
  members: readonly SpaceMember[],
): IssueCardView["assignee"] {
  if (!prop || prop.type !== "person") return null;
  const userIds = parsePersonPropertyValue(properties[prop.key], prop.allowMultiple);
  const userId = userIds[0];
  if (!userId) return null;
  const member = members.find((entry) => entry.userId === userId);
  const label = member ? memberDisplayLabel(member) : userId;
  return { userId, label, initial: label.slice(0, 1).toUpperCase() };
}

function resolvePriority(
  properties: Record<string, unknown>,
  prop: PropertyDefinition | undefined,
): IssueCardPriorityChip | null {
  if (!prop || prop.type !== "select") return null;
  const value = properties[prop.key];
  if (typeof value !== "string" || !value) return null;
  return {
    label: value,
    color: optionColor(prop.options, value),
  };
}

function resolveLabels(
  properties: Record<string, unknown>,
  prop: PropertyDefinition | undefined,
): IssueCardLabelChip[] {
  if (!prop || prop.type !== "multi_select") return [];
  return asStringArray(properties[prop.key]).map((name) => ({
    name,
    color: optionColor(prop.options, name),
  }));
}

function resolveDueDate(
  properties: Record<string, unknown>,
  prop: PropertyDefinition | undefined,
): string | null {
  if (!prop || !isDatePropertyDefinition(prop)) return null;
  const value = properties[prop.key];
  if (value == null || value === "") return null;
  return formatDatePropertyDisplay(value, prop);
}

export function projectIssueCardView(
  document: ArtifactSummary,
  schema: readonly PropertyDefinition[],
  members: readonly SpaceMember[],
  options: {
    variant: "backlog" | "board";
    relationTitles?: Partial<Record<ArtifactId, string>>;
  },
): IssueCardView {
  const properties = document.properties ?? {};
  const priorityProp = resolvePropertyByRole(schema, "priority");
  const assigneeProp = resolvePropertyByRole(schema, "assignee");
  const labelsProp = resolvePropertyByRole(schema, "labels");
  const estimateProp = resolvePropertyByRole(schema, "estimate");
  const dueDateProp = resolvePropertyByRole(schema, "due_date");
  const blockedByProp = resolvePropertyByRole(schema, "blocked_by");
  const parentEpicProp = resolvePropertyByRole(schema, "parent_epic");

  const estimateValue = estimateProp ? properties[estimateProp.key] : undefined;
  const estimate = typeof estimateValue === "number" ? estimateValue : null;

  const identifier =
    typeof (document as ArtifactSummary & { identifier?: string }).identifier === "string"
      ? (document as ArtifactSummary & { identifier?: string }).identifier!
      : null;

  return {
    identifier,
    typeLabel: document.documentTypeKey ?? null,
    title: document.title || "Untitled",
    stage: options.variant === "backlog" ? (document.stageName ?? null) : null,
    priority: resolvePriority(properties, priorityProp),
    assignee: resolveAssignee(properties, assigneeProp, members),
    dueDate: resolveDueDate(properties, dueDateProp as DatePropertyDefinition | undefined),
    estimate,
    labels: resolveLabels(properties, labelsProp),
    blockedBy: blockedByProp
      ? relationLink(properties[blockedByProp.key], options.relationTitles)
      : null,
    parentEpic: parentEpicProp
      ? relationLink(properties[parentEpicProp.key], options.relationTitles)
      : null,
  };
}
