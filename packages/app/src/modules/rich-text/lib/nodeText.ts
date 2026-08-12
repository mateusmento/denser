import type { JSONContent } from "@tiptap/core";

export function nodeText(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(nodeText).join("");
}
