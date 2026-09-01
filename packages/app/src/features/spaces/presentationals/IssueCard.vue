<script setup lang="ts">
import type { ArtifactSummary, PropertyDefinition } from "@denser/contracts";
import { FileTextIcon } from "@lucide/vue";
import { computed } from "vue";
import { projectIssueCardDisplay } from "../lib/issue-card-properties";

const props = defineProps<{
  document: ArtifactSummary;
  propertiesSchema?: readonly PropertyDefinition[];
  preview?: boolean;
}>();

const display = computed(() => projectIssueCardDisplay(props.document, props.propertiesSchema));

const assigneeInitial = computed(() => {
  const assignee = display.value.assignee;
  if (!assignee) return "?";
  return assignee.slice(0, 1).toUpperCase();
});

const hasBottomRow = computed(
  () =>
    display.value.tags.length > 0 ||
    display.value.estimate !== null ||
    display.value.assignee !== null,
);
</script>

<template>
  <div
    class="flex w-full min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-background p-2.5 text-left text-sm shadow-xs transition-all select-none hover:border-border/80 hover:shadow-sm"
    :class="preview ? 'shadow-lg ring-1 ring-primary/20' : ''"
    data-slot="issue-card"
  >
    <div class="flex items-center justify-between gap-2">
      <div
        class="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        <FileTextIcon class="size-3 text-muted-foreground/70" />
        <span>{{ document.documentTypeKey ?? "issue" }}</span>
      </div>

      <div
        v-if="display.priorityChip"
        class="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] leading-none font-semibold"
        :class="display.priorityChip.class"
      >
        <span class="size-1.5 rounded-full" :class="display.priorityChip.dotClass" />
        <span>{{ display.priorityChip.label }}</span>
      </div>
    </div>

    <div class="line-clamp-2 wrap-break-word text-xs leading-snug font-medium text-foreground">
      {{ document.title || "Untitled" }}
    </div>

    <div
      v-if="hasBottomRow"
      class="mt-0.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-border/40 pt-1"
    >
      <div class="flex flex-wrap items-center gap-1">
        <span
          v-for="tag in display.tags"
          :key="tag"
          class="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {{ tag }}
        </span>
      </div>

      <div class="ml-auto flex items-center gap-1.5">
        <span
          v-if="display.estimate !== null"
          class="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
        >
          {{ display.estimate }} pts
        </span>

        <div
          v-if="display.assignee"
          class="inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary"
          :title="display.assignee"
        >
          {{ assigneeInitial }}
        </div>
      </div>
    </div>
  </div>
</template>
