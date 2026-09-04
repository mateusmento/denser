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
} from "@denser/contracts";
import { formatDatePropertyDisplay } from "@/features/document/lib/date-property-display";

export type DocumentCardPropertyPreview =
  | { kind: "select"; name: string; value: string; color?: string }
  | { kind: "multi_select"; name: string; values: { label: string; color?: string }[] }
  | { kind: "person"; name: string; label: string; initial: string }
  | { kind: "date"; name: string; value: string }
  | { kind: "number"; name: string; value: number }
  | { kind: "text"; name: string; value: string }
  | { kind: "relation"; name: string; value: string };

export type DocumentCardView = {
  typeLabel: string | null;
  title: string;
  stage: string | null;
  properties: DocumentCardPropertyPreview[];
};

function optionColor(options: PropertyOption[] | undefined, name: string): string | undefined {
  return options?.find((opt) => opt.name === name)?.color;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value) return [value];
  return [];
}

function personLabel(userId: UserId, members: readonly SpaceMember[]): string {
  const member = members.find((entry) => entry.userId === userId);
  return member ? memberDisplayLabel(member) : userId;
}

function relationPreview(
  value: unknown,
  relationTitles?: Partial<Record<ArtifactId, string>>,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw) return "—";
  return relationTitles?.[raw as ArtifactId] ?? "Linked issue";
}

function previewProperty(
  prop: PropertyDefinition,
  value: unknown,
  members: readonly SpaceMember[],
  relationTitles?: Partial<Record<ArtifactId, string>>,
): DocumentCardPropertyPreview | null {
  if (value == null || value === "") return null;

  switch (prop.type) {
    case "select":
      if (typeof value !== "string") return null;
      return {
        kind: "select",
        name: prop.name,
        value,
        color: optionColor(prop.options, value),
      };
    case "multi_select": {
      const names = asStringArray(value);
      if (!names.length) return null;
      return {
        kind: "multi_select",
        name: prop.name,
        values: names.map((label) => ({ label, color: optionColor(prop.options, label) })),
      };
    }
    case "person": {
      const userIds = parsePersonPropertyValue(value, prop.allowMultiple);
      const userId = userIds[0];
      if (!userId) return null;
      const label = personLabel(userId, members);
      return { kind: "person", name: prop.name, label, initial: label.slice(0, 1).toUpperCase() };
    }
    case "date":
      if (!isDatePropertyDefinition(prop)) return null;
      return {
        kind: "date",
        name: prop.name,
        value: formatDatePropertyDisplay(value, prop),
      };
    case "number":
      if (typeof value !== "number") return null;
      return { kind: "number", name: prop.name, value };
    case "text":
      if (typeof value !== "string") return null;
      return { kind: "text", name: prop.name, value };
    case "relation":
      return {
        kind: "relation",
        name: prop.name,
        value: relationPreview(value, relationTitles),
      };
    default:
      return null;
  }
}

export function projectDocumentCardView(
  document: ArtifactSummary,
  schema: readonly PropertyDefinition[],
  members: readonly SpaceMember[],
  options: {
    variant: "backlog" | "board";
    relationTitles?: Partial<Record<ArtifactId, string>>;
  },
): DocumentCardView {
  const properties = document.properties ?? {};
  const sorted = [...schema].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

  return {
    typeLabel: document.documentTypeKey ?? null,
    title: document.title || "Untitled",
    stage: options.variant === "backlog" ? (document.stageName ?? null) : null,
    properties: sorted
      .map((prop) => previewProperty(prop, properties[prop.key], members, options.relationTitles))
      .filter((entry): entry is DocumentCardPropertyPreview => entry != null),
  };
}
