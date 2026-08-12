<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@denser/design-system";
import type { Editor } from "@tiptap/core";
import { computed, ref } from "vue";

const props = defineProps<{
  editor: Editor;
}>();

const linkOpen = ref(false);
const href = ref("");

const blockLabel = computed(() => {
  if (props.editor.isActive("heading", { level: 1 })) return "H1";
  if (props.editor.isActive("heading", { level: 2 })) return "H2";
  if (props.editor.isActive("heading", { level: 3 })) return "H3";
  if (props.editor.isActive("bulletList")) return "List";
  if (props.editor.isActive("orderedList")) return "1.";
  if (props.editor.isActive("taskList")) return "Todo";
  if (props.editor.isActive("blockquote")) return "Quote";
  if (props.editor.isActive("codeBlock")) return "Code";
  return "Text";
});

function toggle(name: string) {
  props.editor.chain().focus().toggleMark(name).run();
}

function setBlock(kind: string) {
  const chain = props.editor.chain().focus();
  switch (kind) {
    case "paragraph":
      chain.setParagraph().run();
      return;
    case "h1":
      chain.setHeading({ level: 1 }).run();
      return;
    case "h2":
      chain.setHeading({ level: 2 }).run();
      return;
    case "h3":
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
    case "quote":
      chain.toggleBlockquote().run();
      return;
    case "code":
      chain.toggleCodeBlock().run();
      return;
    default:
      return;
  }
}

function applyLink() {
  const url = href.value.trim();
  if (!url) {
    props.editor.chain().focus().unsetLink().run();
  } else {
    props.editor.chain().focus().setLink({ href: url }).run();
  }
  linkOpen.value = false;
}

function onLink() {
  if (props.editor.isActive("link")) {
    props.editor.chain().focus().unsetLink().run();
    return;
  }
  href.value = props.editor.getAttributes("link").href ?? "";
  linkOpen.value = true;
}
</script>

<template>
  <div data-slot="rich-text-selection-menu">
    <div
      class="flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
    >
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="xs">
            {{ blockLabel }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem @select="setBlock('paragraph')">Text</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('h1')">Heading 1</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('h2')">Heading 2</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('h3')">Heading 3</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('bullet')">Bullet list</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('ordered')">Numbered list</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('task')">Task list</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('quote')">Quote</DropdownMenuItem>
          <DropdownMenuItem @select="setBlock('code')">Code block</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon-xs"
        :aria-pressed="editor.isActive('bold')"
        aria-label="Bold"
        @click="toggle('bold')"
      >
        B
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        class="italic"
        :aria-pressed="editor.isActive('italic')"
        aria-label="Italic"
        @click="toggle('italic')"
      >
        I
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        class="line-through"
        :aria-pressed="editor.isActive('strike')"
        aria-label="Strikethrough"
        @click="toggle('strike')"
      >
        S
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        class="font-mono"
        :aria-pressed="editor.isActive('code')"
        aria-label="Inline code"
        @click="toggle('code')"
      >
        `
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        :aria-pressed="editor.isActive('link')"
        aria-label="Link"
        @click="onLink"
      >
        ↗
      </Button>
    </div>

    <form
      v-if="linkOpen"
      class="mt-1 flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-md"
      @submit.prevent="applyLink"
    >
      <input
        v-model="href"
        class="h-7 w-48 bg-transparent px-2 text-sm outline-none"
        placeholder="https://"
        aria-label="Link URL"
      />
      <Button size="xs" type="submit"> Apply </Button>
    </form>
  </div>
</template>
