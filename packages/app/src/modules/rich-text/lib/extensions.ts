import { Extension, mergeAttributes } from "@tiptap/core";
import type { Editor, JSONContent } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import FileHandler from "@tiptap/extension-file-handler";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Suggestion from "@tiptap/suggestion";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import RichTextCodeBlock from "../presentationals/RichTextCodeBlock.vue";
import type { MentionCandidate, SlashCommandItem } from "../types";
import { lowlight } from "./highlight";
import { filterSlashItems, runSlashCommand, STANDARD_SLASH_ITEMS } from "./slashItems";
import { createSuggestionRender } from "./suggestionRender";
import { suggestionFloating } from "./suggestionFloating";

export type RichTextPorts = {
  placeholder: string;
  mentionItems?: () => readonly MentionCandidate[] | undefined;
  onMentionSearch?: (query: string) => void;
  uploadImage?: (file: File) => Promise<string>;
  requestImage?: () => void;
  slashExtras?: readonly SlashCommandItem[];
};

const SlashPluginKey = new PluginKey("richTextSlash");

function SlashCommands(ports: RichTextPorts) {
  return Extension.create({
    name: "richTextSlash",
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          pluginKey: SlashPluginKey,
          startOfLine: true,
          ...suggestionFloating,
          items: ({ query }) => {
            const extras = ports.slashExtras ?? [];
            const standard = filterSlashItems(STANDARD_SLASH_ITEMS, query);
            const extra = filterSlashItems(extras, query).map((item) => ({
              ...item,
              extra: true,
            }));
            if (extra.length === 0) return standard;
            return [
              ...standard,
              { id: "sep", label: "", extra: true } satisfies SlashCommandItem,
              ...extra,
            ];
          },
          command: ({ editor, range, props }) => {
            const item = props as SlashCommandItem;
            if (item.id === "sep") return;
            editor.chain().focus().deleteRange(range).run();
            if (item.id === "image") {
              ports.requestImage?.();
              return;
            }
            runSlashCommand(editor, item);
          },
          render: createSuggestionRender(),
        }),
      ];
    },
  });
}

async function insertUploadedImage(
  editor: Editor,
  file: File,
  upload: RichTextPorts["uploadImage"],
  pos?: number,
): Promise<void> {
  if (!upload) return;
  const src = await upload(file);
  if (!src) return;
  const image: JSONContent = { type: "image", attrs: { src, alt: file.name } };
  if (typeof pos === "number") {
    editor.chain().focus().insertContentAt(pos, image).run();
    return;
  }
  editor.chain().focus().setImage({ src, alt: file.name }).run();
}

export function createRichTextExtensions(ports: RichTextPorts) {
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
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(RichTextCodeBlock, {
          ignoreMutation: ({ mutation }) => {
            if (mutation.type === "selection") return false;
            const target = mutation.target;
            if (!(target instanceof Node)) return true;
            const el = target instanceof Element ? target : target.parentElement;
            return !el?.closest(".rt-code-edit");
          },
        });
      },
    }).configure({
      lowlight,
      enableTabIndentation: true,
      HTMLAttributes: { class: "rt-code-block" },
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: { class: "rt-image" },
    }),
    Placeholder.configure({ placeholder: ports.placeholder }),
    Mention.configure({
      HTMLAttributes: { class: "rt-mention" },
      suggestion: {
        char: "@",
        ...suggestionFloating,
        items: ({ query }) => {
          ports.onMentionSearch?.(query);
          return [...(ports.mentionItems?.() ?? [])];
        },
        render: createSuggestionRender(ports.mentionItems),
        command: ({ editor, range, props }) => {
          const item = props as MentionCandidate;
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "mention",
              attrs: { id: item.id, label: item.label },
            })
            .run();
        },
      },
    }),
    SlashCommands(ports),
    FileHandler.configure({
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      onPaste: (editor, files) => {
        for (const file of files) {
          insertUploadedImage(editor, file, ports.uploadImage).catch(() => undefined);
        }
      },
      onDrop: (editor, files, pos) => {
        for (const file of files) {
          insertUploadedImage(editor, file, ports.uploadImage, pos).catch(() => undefined);
        }
      },
    }),
  ];
}
