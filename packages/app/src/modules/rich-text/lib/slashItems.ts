import type { Editor } from "@tiptap/core";
import type { SlashCommandItem } from "../types";

export const STANDARD_SLASH_ITEMS: readonly SlashCommandItem[] = [
  { id: "paragraph", label: "Text", aliases: ["text", "p"] },
  { id: "heading-1", label: "Heading 1", aliases: ["h1"] },
  { id: "heading-2", label: "Heading 2", aliases: ["h2"] },
  { id: "heading-3", label: "Heading 3", aliases: ["h3"] },
  { id: "bullet", label: "Bullet list", aliases: ["ul", "list"] },
  { id: "ordered", label: "Numbered list", aliases: ["ol", "number"] },
  { id: "task", label: "Task list", aliases: ["todo", "task"] },
  { id: "blockquote", label: "Quote", aliases: ["quote"] },
  { id: "codeBlock", label: "Code block", aliases: ["code"] },
  { id: "image", label: "Image", aliases: ["img"] },
  { id: "horizontalRule", label: "Divider", aliases: ["hr", "divider"] },
];

export function filterSlashItems(
  items: readonly SlashCommandItem[],
  query: string,
): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  return items.filter((item) => {
    if (item.id.toLowerCase().includes(q) || item.label.toLowerCase().includes(q)) return true;
    return item.aliases?.some((alias) => alias.toLowerCase().includes(q)) ?? false;
  });
}

export function runSlashCommand(editor: Editor, item: SlashCommandItem): void {
  const chain = editor.chain().focus();
  switch (item.id) {
    case "paragraph":
      chain.setParagraph().run();
      return;
    case "heading-1":
      chain.setHeading({ level: 1 }).run();
      return;
    case "heading-2":
      chain.setHeading({ level: 2 }).run();
      return;
    case "heading-3":
      chain.setHeading({ level: 3 }).run();
      return;
    case "bullet":
      chain.toggleBulletList().run();
      return;
    case "ordered":
      chain.toggleOrderedList().run();
      return;
    case "task":
      chain.toggleTaskList().run();
      return;
    case "blockquote":
      chain.toggleBlockquote().run();
      return;
    case "codeBlock":
      chain.toggleCodeBlock().run();
      return;
    case "horizontalRule":
      chain.setHorizontalRule().run();
      return;
    case "image":
      editor.commands.insertContent({
        type: "image",
        attrs: { src: "", alt: "Image" },
      });
      return;
    default:
      return;
  }
}
