<script setup lang="ts">
import type { ArtifactSummary, PropertyDefinition, SpaceMember } from "@denser/contracts";
import { LinkIcon } from "@lucide/vue";
import { computed } from "vue";
import { projectIssueCardView } from "../lib/issue-card-properties";

const props = defineProps<{
  document: ArtifactSummary;
  schema: readonly PropertyDefinition[];
  members: readonly SpaceMember[];
  variant: "backlog" | "board";
  relationTitles?: Partial<Record<string, string>>;
  preview?: boolean;
}>();

const view = computed(() =>
  projectIssueCardView(props.document, props.schema, props.members, {
    variant: props.variant,
    relationTitles: props.relationTitles,
  }),
);

const hasMetaRow = computed(
  () =>
    view.value.assignee != null ||
    view.value.dueDate != null ||
    view.value.estimate != null,
);

const hasFooter = computed(
  () =>
    view.value.labels.length > 0 ||
    view.value.blockedBy != null ||
    view.value.parentEpic != null,
);
</script>

<template>
  <div
    class="flex w-full min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-background p-2.5 text-left text-sm shadow-xs transition-all select-none hover:border-border/80 hover:shadow-sm"
    :class="preview ? 'shadow-lg ring-1 ring-primary/20' : ''"
    data-slot="issue-card"
  >
    <div class="flex items-start justify-between gap-2">
      <div
        class="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
      >
        <span v-if="view.identifier">{{ view.identifier }}</span>
        <span v-if="view.identifier && view.typeLabel" class="text-muted-foreground/50">·</span>
        <span v-if="view.typeLabel">{{ view.typeLabel }}</span>
        <div
          v-if="view.stage"
          class="inline-flex w-fit rounded-sm bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {{ view.stage }}
        </div>
      </div>


      <div
        v-if="view.priority"
        class="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] leading-none font-semibold text-foreground"
      >
        <span
          class="size-1.5 rounded-full"
          :style="view.priority.color ? { backgroundColor: view.priority.color } : undefined"
          :class="view.priority.color ? '' : 'bg-primary'"
        />
        <span>{{ view.priority.label }}</span>
      </div>
    </div>

    <div class="line-clamp-2 wrap-break-word text-xs leading-snug font-medium text-foreground">
      {{ view.title }}
    </div>

    <div
      v-if="hasMetaRow"
      class="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"
    >
      <span v-if="view.assignee" class="inline-flex items-center gap-1">
        <span
          class="inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary"
          :title="view.assignee.label"
        >
          {{ view.assignee.initial }}
        </span>
        <span class="max-w-24 truncate text-foreground">{{ view.assignee.label }}</span>
      </span>
      <span v-if="view.dueDate">{{ view.dueDate }}</span>
      <span v-if="view.estimate != null" class="font-mono">{{ view.estimate }} pts</span>
    </div>

    <div
      v-if="hasFooter"
      class="mt-0.5 flex flex-col gap-1 border-t border-border/40 pt-1"
    >
      <div v-if="view.labels.length" class="flex flex-wrap items-center gap-1">
        <span
          v-for="label in view.labels"
          :key="label.name"
          class="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          :style="label.color ? { color: label.color } : undefined"
        >
          {{ label.name }}
        </span>
      </div>
      <p v-if="view.parentEpic" class="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <LinkIcon class="size-3 shrink-0" />
        <span class="truncate">{{ view.parentEpic.title }}</span>
      </p>
      <p v-if="view.blockedBy" class="inline-flex items-center gap-1 text-[10px] text-destructive/80">
        <LinkIcon class="size-3 shrink-0" />
        <span class="truncate">{{ view.blockedBy.title }}</span>
      </p>
    </div>
  </div>
</template>
