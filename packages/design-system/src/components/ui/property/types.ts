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

export interface PropertyDefinition {
  id: string;
  key: string;
  name: string;
  type: PropertyType;
  required?: boolean;
  defaultValue?: unknown;
  options?: PropertyOption[];
  relationSpaceId?: string | null;
  allowMultiple?: boolean;
  order?: number;
}
