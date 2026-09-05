export function formatTypingLabel(names: readonly string[]): string | undefined {
  if (names.length === 0) return undefined;
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return "Several people are typing…";
}

export function formatViewerLabel(count: number): string | undefined {
  if (count <= 0) return undefined;
  if (count === 1) return "1 viewing";
  return `${count} viewing`;
}
