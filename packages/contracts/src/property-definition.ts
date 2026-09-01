import { z } from "zod";
import { PropertyDefinitionId, SpaceId } from "./ids.js";

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

const PropertyDefinitionCore = z.object({
  id: PropertyDefinitionId,
  key: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  order: z.number().int().default(0),
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
});
export type DatePropertyDefinition = z.infer<typeof DatePropertyDefinition>;

export const PersonPropertyDefinition = PropertyDefinitionCore.extend({
  type: z.literal("person"),
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
  options: z.array(PropertyOption).optional(),
  relationSpaceId: SpaceId.nullable().optional(),
  allowMultiple: z.boolean().optional(),
});

export function sanitizePropertyDefinition(input: unknown): PropertyDefinition {
  const loose = PropertyDefinitionLoose.parse(input);
  const core = {
    id: loose.id,
    key: loose.key,
    name: loose.name,
    required: loose.required ?? false,
    order: loose.order ?? 0,
    ...(loose.defaultValue !== undefined ? { defaultValue: loose.defaultValue } : {}),
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
  });
}
