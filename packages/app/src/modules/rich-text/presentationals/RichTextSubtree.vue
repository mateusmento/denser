<script setup lang="ts">
import type { JSONContent } from "@tiptap/core";
import { computed } from "vue";
import { codeBlockSource, highlightCode } from "../lib/highlight";
import { safeImageSrc } from "../lib/urls";
import RichTextHast from "./RichTextHast.vue";
import RichTextSubtree from "./RichTextSubtree.vue";
import RichTextText from "./RichTextText.vue";

const props = defineProps<{
  node: JSONContent;
  taskEditable?: boolean;
}>();

const emit = defineEmits<{
  toggleTask: [node: JSONContent];
}>();

const type = computed(() => props.node.type ?? "text");
const children = computed(() => props.node.content ?? []);
const headingClass = computed(() => `rt-heading-${props.node.attrs?.level ?? 1}`);
const code = computed(() => codeBlockSource(props.node));
const highlighted = computed(() => highlightCode(code.value.language, code.value.code));
const imageSrc = computed(() => safeImageSrc(props.node.attrs?.src));
const mentionLabel = computed(() => {
  const label = props.node.attrs?.label;
  if (typeof label === "string" && label.length > 0) return label;
  return "Unknown";
});
const taskChecked = computed(() => Boolean(props.node.attrs?.checked));
</script>

<template>
  <template v-if="type === 'text'">
    <RichTextText :node="node" />
  </template>
  <template v-else-if="type === 'doc'">
    <RichTextSubtree
      v-for="(child, index) in children"
      :key="index"
      :node="child"
      :task-editable="taskEditable"
      @toggle-task="emit('toggleTask', $event)"
    />
  </template>
  <p v-else-if="type === 'paragraph'" class="rt-paragraph">
    <RichTextSubtree
      v-for="(child, index) in children"
      :key="index"
      :node="child"
      :task-editable="taskEditable"
      @toggle-task="emit('toggleTask', $event)"
    />
  </p>
  <component
    :is="`h${Math.min(Number(node.attrs?.level) || 1, 3)}`"
    v-else-if="type === 'heading'"
    :class="headingClass"
  >
    <RichTextSubtree v-for="(child, index) in children" :key="index" :node="child" />
  </component>
  <ul v-else-if="type === 'bulletList'" class="rt-bullet-list">
    <RichTextSubtree v-for="(child, index) in children" :key="index" :node="child" />
  </ul>
  <ol v-else-if="type === 'orderedList'" class="rt-ordered-list">
    <RichTextSubtree v-for="(child, index) in children" :key="index" :node="child" />
  </ol>
  <ul v-else-if="type === 'taskList'" class="rt-task-list">
    <RichTextSubtree
      v-for="(child, index) in children"
      :key="index"
      :node="child"
      :task-editable="taskEditable"
      @toggle-task="emit('toggleTask', $event)"
    />
  </ul>
  <li v-else-if="type === 'listItem'" class="rt-list-item">
    <RichTextSubtree v-for="(child, index) in children" :key="index" :node="child" />
  </li>
  <li v-else-if="type === 'taskItem'" class="rt-task-item">
    <input
      type="checkbox"
      class="mt-1"
      :checked="taskChecked"
      :disabled="!taskEditable"
      @change="emit('toggleTask', node)"
    />
    <div>
      <RichTextSubtree v-for="(child, index) in children" :key="index" :node="child" />
    </div>
  </li>
  <blockquote v-else-if="type === 'blockquote'" class="rt-blockquote">
    <RichTextSubtree v-for="(child, index) in children" :key="index" :node="child" />
  </blockquote>
  <div v-else-if="type === 'codeBlock'" class="rt-code-block">
    <div class="border-b border-border px-2 py-1 text-xs text-muted-foreground">
      {{ code.language }}
    </div>
    <div class="rt-code-block-body">
      <pre class="rt-code-layer"><code><RichTextHast :nodes="highlighted" /></code></pre>
    </div>
  </div>
  <hr v-else-if="type === 'horizontalRule'" class="rt-hr" />
  <img
    v-else-if="type === 'image' && imageSrc"
    class="rt-image"
    :src="imageSrc"
    :alt="typeof node.attrs?.alt === 'string' ? node.attrs.alt : ''"
    :title="typeof node.attrs?.title === 'string' ? node.attrs.title : undefined"
  />
  <span
    v-else-if="type === 'mention'"
    class="rt-mention"
    :class="node.attrs?.label ? undefined : 'text-muted-foreground'"
    >{{ mentionLabel }}</span
  >
  <br v-else-if="type === 'hardBreak'" />
  <template v-else>
    <RichTextSubtree v-for="(child, index) in children" :key="index" :node="child" />
  </template>
</template>
