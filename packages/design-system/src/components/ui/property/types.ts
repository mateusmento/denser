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

export type DatePropertyDefinition = PropertyDefinitionCore & { type: "date" };

export type PersonPropertyDefinition = PropertyDefinitionCore & { type: "person" };

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

export function propertyDefinitionHasEditor(_type: PropertyType): boolean {
  return true;
}
