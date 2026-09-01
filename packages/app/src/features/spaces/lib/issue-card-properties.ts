import type { ArtifactSummary, PropertyDefinition, PropertyOption } from "@denser/contracts";

export type IssueCardPriorityChip = {
  label: string;
  class: string;
  dotClass: string;
};

export type IssueCardField = {
  key: string;
  name: string;
  type: PropertyDefinition["type"];
  value: unknown;
  color?: string;
};

const LEGACY_PRIORITY: Record<string, IssueCardPriorityChip> = {
  urgent: {
    label: "Urgent",
    class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    dotClass: "bg-red-500",
  },
  high: {
    label: "High",
    class: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    dotClass: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  low: {
    label: "Low",
    class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
};

function optionColor(options: PropertyOption[] | undefined, name: string): string | undefined {
  return options?.find((opt) => opt.name === name)?.color;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value) return [value];
  return [];
}

export function projectIssueCardDisplay(
  document: ArtifactSummary,
  schema?: readonly PropertyDefinition[],
) {
  const properties = document.properties ?? {};

  if (!schema?.length) {
    const priorityRaw = properties.priority;
    const priorityKey =
      typeof priorityRaw === "string" ? priorityRaw.toLowerCase() : null;
    const labels = asStringArray(properties.labels);
    const estimate = typeof properties.estimate === "number" ? properties.estimate : null;
    const assignee =
      typeof properties.assignee === "string" && properties.assignee.trim()
        ? properties.assignee.trim()
        : null;

    return {
      priorityChip: priorityKey ? (LEGACY_PRIORITY[priorityKey] ?? null) : null,
      tags: labels,
      estimate,
      assignee,
      fields: [] as IssueCardField[],
    };
  }

  const fields: IssueCardField[] = [];
  let priorityChip: IssueCardPriorityChip | null = null;
  const tags: string[] = [];
  let estimate: number | null = null;
  let assignee: string | null = null;

  for (const prop of schema) {
    const value = properties[prop.key];
    if (value == null || value === "") continue;

    if (prop.type === "select" && typeof value === "string") {
      const color = optionColor(prop.options, value);
      fields.push({ key: prop.key, name: prop.name, type: prop.type, value, color });
      if (prop.key === "priority" || prop.name.toLowerCase() === "priority") {
        priorityChip = LEGACY_PRIORITY[value.toLowerCase()] ?? {
          label: value,
          class: "bg-muted text-muted-foreground border-border/60",
          dotClass: color ? "" : "bg-primary",
        };
        if (color) {
          priorityChip = {
            ...priorityChip,
            dotClass: "",
            class: "border-border/60 bg-muted text-foreground",
          };
        }
      }
      continue;
    }

    if (prop.type === "multi_select") {
      const names = asStringArray(value);
      tags.push(...names);
      for (const name of names) {
        fields.push({
          key: prop.key,
          name: prop.name,
          type: prop.type,
          value: name,
          color: optionColor(prop.options, name),
        });
      }
      continue;
    }

    if (prop.type === "number" && typeof value === "number") {
      estimate = value;
      fields.push({ key: prop.key, name: prop.name, type: prop.type, value });
      continue;
    }

    if (prop.type === "person" && typeof value === "string" && value.trim()) {
      assignee = value.trim();
      fields.push({ key: prop.key, name: prop.name, type: prop.type, value: assignee });
      continue;
    }

    if (prop.type === "person" && Array.isArray(value) && value.length > 0) {
      const names = value.filter((item): item is string => typeof item === "string");
      assignee = names[0] ?? null;
      fields.push({ key: prop.key, name: prop.name, type: prop.type, value: names });
      continue;
    }

    fields.push({ key: prop.key, name: prop.name, type: prop.type, value });
  }

  return { priorityChip, tags, estimate, assignee, fields };
}
