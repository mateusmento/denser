import type { JSONContent } from "@tiptap/core";

/** Flatten inline/text descendants without block separators (e.g. code block source). */
export function nodeText(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;
  if (node.type === "hardBreak") return "\n";
  if (node.type === "mention") {
    const label = node.attrs?.label;
    if (typeof label === "string") return label;
    const id = node.attrs?.id;
    return typeof id === "string" ? id : "";
  }
  return (node.content ?? []).map(nodeText).join("");
}
