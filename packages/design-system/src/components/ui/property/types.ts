export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "person"
  | "relation";

export interface PropertyOption {
  id: string;
  name: string;
  color?: string;
}

export type DateFormat =
  | "full_date"
  | "short_date"
  | "mdy"
  | "dmy"
  | "ymd"
  | "relative";
export type TimeFormat = "hidden" | "12h" | "24h";
export type DateReminderPreset =
  | "none"
  | "on_date"
  | "1_min_before"
  | "1_hour_before"
  | "1_day_before"
  | "custom";
export type DateReminderUnit = "minutes" | "hours" | "days" | "weeks";

export interface DateNotificationConfig {
  preset: DateReminderPreset;
  customAmount?: number;
  customUnit?: DateReminderUnit;
}

interface PropertyDefinitionCore {
  id: string;
  key: string;
  name: string;
  required?: boolean;
  defaultValue?: unknown;
  order?: number;
}

export type TextPropertyDefinition = PropertyDefinitionCore & { type: "text" };

export type NumberPropertyDefinition = PropertyDefinitionCore & { type: "number" };

export type DatePropertyDefinition = PropertyDefinitionCore & {
  type: "date";
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  notification: DateNotificationConfig;
};

export type PersonPropertyDefinition = PropertyDefinitionCore & {
  type: "person";
  allowMultiple: boolean;
};

export type SelectPropertyDefinition = PropertyDefinitionCore & {
  type: "select";
  options: PropertyOption[];
};

export type MultiSelectPropertyDefinition = PropertyDefinitionCore & {
  type: "multi_select";
  options: PropertyOption[];
};

export type RelationPropertyDefinition = PropertyDefinitionCore & {
  type: "relation";
  relationSpaceId: string | null;
  allowMultiple: boolean;
};

export type PropertyDefinition =
  | TextPropertyDefinition
  | NumberPropertyDefinition
  | DatePropertyDefinition
  | PersonPropertyDefinition
  | SelectPropertyDefinition
  | MultiSelectPropertyDefinition
  | RelationPropertyDefinition;

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

export function propertyDefinitionHasEditor(_type: PropertyType): boolean {
  return true;
}
