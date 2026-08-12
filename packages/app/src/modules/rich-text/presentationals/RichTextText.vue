<script setup lang="ts">
import type { JSONContent } from "@tiptap/core";
import { computed, h, type VNode } from "vue";
import { safeHref } from "../lib/urls";

const MARK_CLASS: Record<string, string> = {
  bold: "rt-bold",
  italic: "rt-italic",
  strike: "rt-strike",
  code: "rt-inline-code",
  link: "rt-link",
};

const props = defineProps<{
  node: JSONContent;
}>();

const vnode = computed(() => {
  let tree: VNode | string = props.node.text ?? "";
  for (const mark of props.node.marks ?? []) {
    const className = MARK_CLASS[mark.type];
    if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      tree = h("a", { class: className, href: href ?? undefined, rel: "noreferrer" }, [tree]);
      continue;
    }
    if (className) tree = h("span", { class: className }, [tree]);
  }
  return typeof tree === "string" ? h("span", tree) : tree;
});
</script>

<template>
  <component :is="vnode" />
</template>
