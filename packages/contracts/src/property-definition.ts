import { z } from "zod";
import { PropertyDefinitionId, SpaceId, UserId } from "./ids.js";

export const PropertyType = z.enum([
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "person",
  "relation",
]);
export type PropertyType = z.infer<typeof PropertyType>;

export const PropertyOption = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
});
export type PropertyOption = z.infer<typeof PropertyOption>;

export const DateFormat = z.enum([
  "full_date",
  "short_date",
  "mdy",
  "dmy",
  "ymd",
  "relative",
]);
export type DateFormat = z.infer<typeof DateFormat>;

export const TimeFormat = z.enum(["hidden", "12h", "24h"]);
export type TimeFormat = z.infer<typeof TimeFormat>;

export const DateReminderPreset = z.enum([
  "none",
  "on_date",
  "1_min_before",
  "1_hour_before",
  "1_day_before",
  "custom",
]);
export type DateReminderPreset = z.infer<typeof DateReminderPreset>;

export const DateReminderUnit = z.enum(["minutes", "hours", "days", "weeks"]);
export type DateReminderUnit = z.infer<typeof DateReminderUnit>;

export const DateNotificationConfig = z
  .object({
    preset: DateReminderPreset.default("none"),
    customAmount: z.number().int().positive().optional(),
    customUnit: DateReminderUnit.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.preset === "custom") {
      if (value.customAmount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customAmount is required when preset is custom",
          path: ["customAmount"],
        });
      }
      if (value.customUnit == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customUnit is required when preset is custom",
          path: ["customUnit"],
        });
      }
    }
  });
export type DateNotificationConfig = z.infer<typeof DateNotificationConfig>;

export const PropertySemanticRole = z.enum([
  "priority",
  "assignee",
  "labels",
  "estimate",
  "due_date",
  "blocked_by",
  "parent_epic",
]);
export type PropertySemanticRole = z.infer<typeof PropertySemanticRole>;

const PropertyDefinitionCore = z.object({
  id: PropertyDefinitionId,
  key: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  order: z.number().int().default(0),
  semanticRole: PropertySemanticRole.optional(),
});

export const TextPropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("text"),
});
export type TextPropertyDefinition = z.infer<typeof TextPropertyDefinition>;

export const NumberPropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("number"),
});
export type NumberPropertyDefinition = z.infer<typeof NumberPropertyDefinition>;

export const DatePropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("date"),
  dateFormat: DateFormat.default("full_date"),
  timeFormat: TimeFormat.default("hidden"),
  notification: DateNotificationConfig.default({
    preset: "none",
  }),
});
export type DatePropertyDefinition = z.infer<typeof DatePropertyDefinition>;

export const PersonPropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("person"),
  allowMultiple: z.boolean().default(false),
});
export type PersonPropertyDefinition = z.infer<typeof PersonPropertyDefinition>;

export const SelectPropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("select"),
  options: z.array(PropertyOption).default([]),
});
export type SelectPropertyDefinition = z.infer<typeof SelectPropertyDefinition>;

export const MultiSelectPropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("multi_select"),
  options: z.array(PropertyOption).default([]),
});
export type MultiSelectPropertyDefinition = z.infer<typeof MultiSelectPropertyDefinition>;

export const RelationPropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("relation"),
  relationSpaceId: SpaceId.nullable(),
  allowMultiple: z.boolean().default(true),
});
export type RelationPropertyDefinition = z.infer<typeof RelationPropertyDefinition>;

export const PropertyDefinition = z.discriminatedUnion("type", [
  TextPropertyDefinition,
  NumberPropertyDefinition,
  DatePropertyDefinition,
  PersonPropertyDefinition,
  SelectPropertyDefinition,
  MultiSelectPropertyDefinition,
  RelationPropertyDefinition,
]);
export type PropertyDefinition = z.infer<typeof PropertyDefinition>;

/** Parses legacy / client payloads before strict union normalization. */
export const PropertyDefinitionLoose = z.object({
  id: PropertyDefinitionId,
  key: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  type: PropertyType,
  required: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  order: z.number().int().optional(),
  semanticRole: PropertySemanticRole.optional(),
  options: z.array(PropertyOption).optional(),
  relationSpaceId: SpaceId.nullable().optional(),
  allowMultiple: z.boolean().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
  notification: z
    .object({
      enabled: z.boolean().optional(),
      preset: z.string().optional(),
      customAmount: z.number().int().positive().optional(),
      customUnit: DateReminderUnit.optional(),
    })
    .optional(),
});

function normalizeDateFormat(value: string | undefined): DateFormat {
  switch (value) {
    case "full_date":
    case "short_date":
    case "mdy":
    case "dmy":
    case "ymd":
    case "relative":
      return value;
    case "locale":
      return "full_date";
    case "iso":
      return "ymd";
    default:
      return "full_date";
  }
}

function normalizeTimeFormat(value: string | undefined): TimeFormat {
  switch (value) {
    case "hidden":
    case "12h":
    case "24h":
      return value;
    case "none":
      return "hidden";
    default:
      return "hidden";
  }
}

function normalizeDateNotification(raw: unknown): DateNotificationConfig {
  const legacy =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  let preset = typeof legacy.preset === "string" ? legacy.preset : undefined;

  if (legacy.enabled === false && preset == null) {
    preset = "none";
  }

  if (preset === "5_min_before") preset = "1_min_before";
  if (preset === "2_days_before") preset = "1_day_before";

  const valid: DateReminderPreset[] = [
    "none",
    "on_date",
    "1_min_before",
    "1_hour_before",
    "1_day_before",
    "custom",
  ];

  if (!preset || !valid.includes(preset as DateReminderPreset)) {
    preset = "none";
  }

  if (preset === "custom") {
    return DateNotificationConfig.parse({
      preset: "custom",
      customAmount:
        typeof legacy.customAmount === "number" && legacy.customAmount > 0
          ? legacy.customAmount
          : 1,
      customUnit:
        typeof legacy.customUnit === "string" ? legacy.customUnit : "hours",
    });
  }

  return DateNotificationConfig.parse({ preset });
}

export function sanitizePropertyDefinition(input: unknown): PropertyDefinition {
  const loose = PropertyDefinitionLoose.parse(input);
  const core = {
    id: loose.id,
    key: loose.key,
    name: loose.name,
    required: loose.required ?? false,
    order: loose.order ?? 0,
    ...(loose.defaultValue !== undefined ? { defaultValue: loose.defaultValue } : {}),
    ...(loose.semanticRole !== undefined ? { semanticRole: loose.semanticRole } : {}),
  };

  switch (loose.type) {
    case "select":
    case "multi_select":
      return PropertyDefinition.parse({
        ...core,
        type: loose.type,
        options: loose.options ?? [],
      });
    case "relation":
      return PropertyDefinition.parse({
        ...core,
        type: "relation",
        relationSpaceId: loose.relationSpaceId ?? null,
        allowMultiple: loose.allowMultiple ?? true,
      });
    case "person":
      return PropertyDefinition.parse({
        ...core,
        type: "person",
        allowMultiple: loose.allowMultiple ?? false,
      });
    case "date":
      return PropertyDefinition.parse({
        ...core,
        type: "date",
        dateFormat: normalizeDateFormat(loose.dateFormat),
        timeFormat: normalizeTimeFormat(loose.timeFormat),
        notification: normalizeDateNotification(loose.notification),
      });
    default:
      return PropertyDefinition.parse({
        ...core,
        type: loose.type,
      });
  }
}

export function sanitizePropertyDefinitions(input: unknown[]): PropertyDefinition[] {
  return input.map((entry) => sanitizePropertyDefinition(entry));
}

export function resolvePropertyByRole(
  schema: readonly PropertyDefinition[],
  role: PropertySemanticRole,
): PropertyDefinition | undefined {
  return schema.find((property) => property.semanticRole === role);
}

/** Accepts persisted / legacy property payloads when parsing API responses. */
export const PropertyDefinitionsFromStorage = z.preprocess(
  (val) => sanitizePropertyDefinitions(Array.isArray(val) ? val : []),
  z.array(PropertyDefinition),
);

export function propertyDefinitionHasEditor(type: PropertyType): boolean {
  switch (type) {
    case "select":
    case "multi_select":
    case "relation":
    case "text":
    case "number":
    case "date":
    case "person":
      return true;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function isSelectPropertyDefinition(
  property: PropertyDefinition,
): property is SelectPropertyDefinition | MultiSelectPropertyDefinition {
  return property.type === "select" || property.type === "multi_select";
}

export function isRelationPropertyDefinition(
  property: PropertyDefinition,
): property is RelationPropertyDefinition {
  return property.type === "relation";
}

export function isPersonPropertyDefinition(
  property: PropertyDefinition,
): property is PersonPropertyDefinition {
  return property.type === "person";
}

export function isDatePropertyDefinition(
  property: PropertyDefinition,
): property is DatePropertyDefinition {
  return property.type === "date";
}

export function buildPropertyDefinition(input: {
  id: PropertyDefinitionId;
  key: string;
  name: string;
  type: PropertyType;
  order: number;
  required?: boolean;
  options?: PropertyOption[];
  relationSpaceId?: SpaceId | null;
  allowMultiple?: boolean;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  notification?: DateNotificationConfig;
  semanticRole?: PropertySemanticRole;
}): PropertyDefinition {
  return sanitizePropertyDefinition({
    id: input.id,
    key: input.key,
    name: input.name,
    type: input.type,
    required: input.required ?? false,
    order: input.order,
    options: input.options,
    relationSpaceId: input.relationSpaceId,
    allowMultiple: input.allowMultiple,
    dateFormat: input.dateFormat,
    timeFormat: input.timeFormat,
    notification: input.notification,
    semanticRole: input.semanticRole,
  });
}

/** Person property values: single UserId or UserId[]. Legacy string names are read-only compat. */
export function parsePersonPropertyValue(
  value: unknown,
  allowMultiple: boolean,
): UserId[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is UserId => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string") {
    return allowMultiple ? [value as UserId] : [value as UserId];
  }
  return [];
}

export function memberDisplayLabel(member: {
  name: string;
  username: string | null;
}): string {
  return member.name || member.username || "Member";
}
