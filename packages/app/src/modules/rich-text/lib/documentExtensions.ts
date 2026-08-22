import { mergeAttributes, type Extensions } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { lowlight } from "./highlight";

/**
 * Schema + HTML render/parse extensions only (no editor chrome / Vue node views).
 * Safe for `generateHTML` / `generateJSON` from stored docs.
 */
export function createRichTextDocumentExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      underline: false,
      link: { HTMLAttributes: { class: "rt-link" }, openOnClick: false },
      bold: { HTMLAttributes: { class: "rt-bold" } },
      italic: { HTMLAttributes: { class: "rt-italic" } },
      strike: { HTMLAttributes: { class: "rt-strike" } },
      code: { HTMLAttributes: { class: "rt-inline-code" } },
      paragraph: { HTMLAttributes: { class: "rt-paragraph" } },
      blockquote: { HTMLAttributes: { class: "rt-blockquote" } },
      bulletList: { HTMLAttributes: { class: "rt-bullet-list" } },
      orderedList: { HTMLAttributes: { class: "rt-ordered-list" } },
      listItem: { HTMLAttributes: { class: "rt-list-item" } },
      horizontalRule: { HTMLAttributes: { class: "rt-hr" } },
    }),
    Heading.extend({
      renderHTML({ node, HTMLAttributes }) {
        const level = node.attrs.level as 1 | 2 | 3;
        return [
          `h${level}`,
          mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            class: `rt-heading-${level}`,
          }),
          0,
        ];
      },
    }).configure({ levels: [1, 2, 3] }),
    TaskList.configure({ HTMLAttributes: { class: "rt-task-list" } }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: { class: "rt-task-item" },
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: { class: "rt-code-block" },
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: { class: "rt-image" },
    }),
    Mention.configure({
      HTMLAttributes: { class: "rt-mention" },
    }),
  ];
}
