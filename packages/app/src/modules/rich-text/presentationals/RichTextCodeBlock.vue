<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@denser/design-system";
import { nodeViewProps, NodeViewContent, NodeViewWrapper } from "@tiptap/vue-3";
import { computed } from "vue";
import { CODE_LANGUAGES, highlightCode } from "../lib/highlight";
import RichTextHast from "./RichTextHast.vue";

const props = defineProps(nodeViewProps);

const language = computed({
  get: () => (props.node.attrs.language as string | undefined) ?? "plaintext",
  set: (value: string) => {
    const next = value === "plaintext" ? null : value;
    const current = (props.node.attrs.language as string | null | undefined) ?? null;
    if (next === current) return;
    props.updateAttributes({ language: next });
  },
});

const highlighted = computed(() => {
  const lang = language.value === "plaintext" ? undefined : language.value;
  return highlightCode(lang, props.node.textContent);
});
</script>

<template>
  <NodeViewWrapper as="div" class="rt-code-block" data-slot="rich-text-code-block">
    <div
      class="flex items-center justify-end border-b border-border px-2 py-1"
      contenteditable="false"
      @mousedown.stop
    >
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="secondary" size="xs" aria-label="Code language">
            {{ language }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-auto min-w-36">
          <DropdownMenuRadioGroup v-model="language">
            <DropdownMenuRadioItem v-for="lang in CODE_LANGUAGES" :key="lang" :value="lang">
              {{ lang }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div class="rt-code-block-body">
      <div class="rt-code-layer rt-code-highlight" aria-hidden="true">
        <RichTextHast :nodes="highlighted" />
      </div>
      <NodeViewContent class="rt-code-layer rt-code-edit" />
    </div>
  </NodeViewWrapper>
</template>
