import { Extension, type Editor, type JSONContent } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import FileHandler from "@tiptap/extension-file-handler";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import RichTextCodeBlock from "../presentationals/RichTextCodeBlock.vue";
import type { MentionCandidate, SlashCommandItem } from "../types";
import { createRichTextDocumentExtensions } from "./documentExtensions";
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
  const documentExtensions = createRichTextDocumentExtensions().map((extension) => {
    if (extension.name === "codeBlock") {
      return CodeBlockLowlight.extend({
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
      });
    }
    if (extension.name === "mention") {
      return Mention.configure({
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
      });
    }
    return extension;
  });

  return [
    ...documentExtensions,
    Placeholder.configure({ placeholder: ports.placeholder }),
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
