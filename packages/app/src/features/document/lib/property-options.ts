import type { PropertyOption } from "@denser/contracts";

export const PROPERTY_OPTION_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
] as const;

export function createPropertyOption(name: string, index: number): PropertyOption {
  return {
    id: `opt-${crypto.randomUUID()}`,
    name,
    color: PROPERTY_OPTION_COLORS[index % PROPERTY_OPTION_COLORS.length],
  };
}

export function findOptionByName(
  options: readonly PropertyOption[],
  name: string,
): PropertyOption | undefined {
  const needle = name.trim().toLowerCase();
  return options.find((opt) => opt.name.toLowerCase() === needle);
}
