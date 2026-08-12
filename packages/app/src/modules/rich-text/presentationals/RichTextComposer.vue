<script setup lang="ts">
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { BubbleMenu } from "@tiptap/vue-3/menus";
import { useFileDialog } from "@vueuse/core";
import { watch } from "vue";
import { createRichTextExtensions } from "../lib/extensions";
import type { MentionCandidate, SlashCommandItem } from "../types";
import { emptyDoc } from "../types";
import RichTextSelectionMenu from "./RichTextSelectionMenu.vue";

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    editable?: boolean;
    disabled?: boolean;
    submitOnEnter?: boolean;
    mentionItems?: readonly MentionCandidate[];
    uploadImage?: (file: File) => Promise<string>;
    slashExtras?: readonly SlashCommandItem[];
  }>(),
  {
    placeholder: "Write…",
    editable: true,
    disabled: false,
    submitOnEnter: false,
  },
);

const json = defineModel<JSONContent>({ default: emptyDoc });

const emit = defineEmits<{
  submit: [];
  mentionSearch: [query: string];
}>();

const { open: openImageDialog, onChange: onImageFiles } = useFileDialog({
  accept: "image/png,image/jpeg,image/gif,image/webp",
  multiple: false,
});

let syncingFromEditor = false;

const editor = useEditor({
  content: json.value,
  editable: props.editable && !props.disabled,
  extensions: createRichTextExtensions({
    placeholder: props.placeholder,
    mentionItems: () => props.mentionItems,
    onMentionSearch: (query) => emit("mentionSearch", query),
    uploadImage: (file) => props.uploadImage?.(file) ?? Promise.resolve(""),
    requestImage: () => openImageDialog(),
    slashExtras: props.slashExtras,
  }),
  editorProps: {
    handleKeyDown(_view, event) {
      if (!props.submitOnEnter || event.key !== "Enter" || event.shiftKey) return false;
      const current = editor.value;
      if (!current) return false;
      if (
        current.isActive("codeBlock") ||
        current.isActive("listItem") ||
        current.isActive("taskItem")
      ) {
        return false;
      }
      event.preventDefault();
      emit("submit");
      return true;
    },
  },
  onUpdate: ({ editor: instance }) => {
    syncingFromEditor = true;
    json.value = instance.getJSON();
    queueMicrotask(() => {
      syncingFromEditor = false;
    });
  },
});

onImageFiles(async (files) => {
  const file = files?.[0];
  const instance = editor.value;
  if (!file || !instance || !props.uploadImage) return;
  const src = await props.uploadImage(file);
  if (src) instance.chain().focus().setImage({ src, alt: file.name }).run();
});

watch(
  () => [props.editable, props.disabled] as const,
  ([editable, disabled]) => {
    editor.value?.setEditable(Boolean(editable) && !disabled);
  },
);

watch(json, (doc) => {
  if (syncingFromEditor) return;
  const instance = editor.value;
  if (!instance || instance.isFocused) return;
  if (JSON.stringify(instance.getJSON()) === JSON.stringify(doc)) return;
  instance.commands.setContent(doc, { emitUpdate: false });
});

function shouldShowSelection({
  editor: instance,
  from,
  to,
}: {
  editor: Editor;
  from: number;
  to: number;
}) {
  if (from === to) return false;
  if (instance.isActive("codeBlock")) return false;
  return instance.isEditable;
}

function insertContent(value: string) {
  editor.value?.chain().focus().insertContent(value).run();
}

function toggleCodeBlock() {
  editor.value?.chain().focus().toggleCodeBlock().run();
}

function requestImage() {
  openImageDialog();
}

defineExpose({ insertContent, toggleCodeBlock, requestImage });
</script>

<template>
  <div class="rt-composer min-w-0" data-slot="rich-text-composer">
    <EditorContent
      v-if="editor"
      :editor="editor"
      :class="disabled ? 'pointer-events-none opacity-60' : undefined"
    />
    <BubbleMenu v-if="editor" :editor="editor" :should-show="shouldShowSelection">
      <RichTextSelectionMenu :editor="editor" />
    </BubbleMenu>
  </div>
</template>
