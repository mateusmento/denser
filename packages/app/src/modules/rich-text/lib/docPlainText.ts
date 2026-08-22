import type { JSONContent } from "@tiptap/core";
import { nodeText } from "./nodeText";

/** Plain-text serialization of a rich-text doc for clipboard / search previews. */
export function docPlainText(doc: JSONContent): string {
  return serializeBlock(doc).replace(/\n{3,}/g, "\n\n").trim();
}

function serializeBlock(node: JSONContent): string {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map(serializeBlock).filter(Boolean).join("\n");
    case "paragraph":
    case "heading":
    case "blockquote":
      return serializeInline(node);
    case "codeBlock":
      return nodeText(node);
    case "hardBreak":
      return "\n";
    case "horizontalRule":
      return "---";
    case "bulletList":
    case "taskList":
      return (node.content ?? [])
        .map((item) => listItemLine(item, "- "))
        .filter(Boolean)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((item, index) => listItemLine(item, `${index + 1}. `))
        .filter(Boolean)
        .join("\n");
    case "listItem":
    case "taskItem":
      return (node.content ?? []).map(serializeBlock).filter(Boolean).join("\n");
    case "mention":
      return mentionLabel(node);
    default:
      if (typeof node.text === "string") return node.text;
      return (node.content ?? []).map(serializeBlock).filter(Boolean).join("\n");
  }
}

function listItemLine(item: JSONContent, prefix: string): string {
  const checked = item.type === "taskItem" ? (item.attrs?.checked ? "[x] " : "[ ] ") : "";
  const body = serializeBlock(item).trim();
  if (!body) return "";
  const [first, ...rest] = body.split("\n");
  const head = `${prefix}${checked}${first}`;
  if (rest.length === 0) return head;
  const indent = " ".repeat(prefix.length);
  return [head, ...rest.map((line) => `${indent}${line}`)].join("\n");
}

function serializeInline(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;
  if (node.type === "hardBreak") return "\n";
  if (node.type === "mention") return mentionLabel(node);
  return (node.content ?? []).map(serializeInline).join("");
}

function mentionLabel(node: JSONContent): string {
  const label = node.attrs?.label;
  if (typeof label === "string" && label.length > 0) return `@${label}`;
  const id = node.attrs?.id;
  if (typeof id === "string" && id.length > 0) return `@${id}`;
  return "";
}
