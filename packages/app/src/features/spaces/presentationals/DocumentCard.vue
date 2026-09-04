<script setup lang="ts">
import type { ArtifactSummary, PropertyDefinition, SpaceMember } from "@denser/contracts";
import { computed } from "vue";
import { projectDocumentCardView } from "../lib/document-card-view";

const props = defineProps<{
  document: ArtifactSummary;
  schema: readonly PropertyDefinition[];
  members: readonly SpaceMember[];
  variant: "backlog" | "board";
  relationTitles?: Partial<Record<string, string>>;
  preview?: boolean;
}>();

const view = computed(() =>
  projectDocumentCardView(props.document, props.schema, props.members, {
    variant: props.variant,
    relationTitles: props.relationTitles,
  }),
);
</script>

<template>
  <div
    class="flex w-full min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-background p-2.5 text-left text-sm shadow-xs transition-all select-none hover:border-border/80 hover:shadow-sm"
    :class="preview ? 'shadow-lg ring-1 ring-primary/20' : ''"
    data-slot="document-card"
  >
    <div class="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
      <span v-if="view.typeLabel">{{ view.typeLabel }}</span>
    </div>

    <div class="line-clamp-2 wrap-break-word text-xs leading-snug font-medium text-foreground">
      {{ view.title }}
    </div>

    <div
      v-if="view.stage"
      class="inline-flex w-fit rounded-sm bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
    >
      {{ view.stage }}
    </div>

    <div v-if="view.properties.length" class="mt-0.5 space-y-1 border-t border-border/40 pt-1">
      <div
        v-for="(property, index) in view.properties"
        :key="`${property.name}-${index}`"
        class="flex flex-wrap items-center gap-1 text-[10px]"
      >
        <span class="text-muted-foreground">{{ property.name }}:</span>

        <template v-if="property.kind === 'multi_select'">
          <span
            v-for="chip in property.values"
            :key="chip.label"
            class="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-muted-foreground"
            :style="chip.color ? { color: chip.color } : undefined"
          >
            {{ chip.label }}
          </span>
        </template>

        <template v-else-if="property.kind === 'person'">
          <span
            class="inline-flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary"
          >
            {{ property.initial }}
          </span>
          <span class="text-foreground">{{ property.label }}</span>
        </template>

        <template v-else-if="property.kind === 'select'">
          <span
            class="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground"
            :style="property.color ? { color: property.color } : undefined"
          >
            {{ property.value }}
          </span>
        </template>

        <span v-else class="text-foreground">{{ property.value }}</span>
      </div>
    </div>
  </div>
</template>
