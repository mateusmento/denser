<script setup lang="ts">
import type { ArtifactSummary } from "@denser/contracts";
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CircleIcon,
  FileTextIcon,
} from "@lucide/vue";
import type { Component } from "vue";
import { computed } from "vue";

const props = defineProps<{
  document: ArtifactSummary;
  preview?: boolean;
}>();

const properties = computed(() => props.document.properties ?? {});

const priority = computed(() => {
  const p = properties.value.priority;
  if (typeof p === "string") return p.toLowerCase();
  return null;
});

const priorityMeta = computed<{
  label: string;
  class: string;
  dotClass: string;
  icon?: Component;
} | null>(() => {
  switch (priority.value) {
    case "urgent":
      return {
        label: "Urgent",
        class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        dotClass: "bg-red-500",
        icon: AlertCircleIcon,
      };
    case "high":
      return {
        label: "High",
        class: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        dotClass: "bg-orange-500",
        icon: ArrowUpIcon,
      };
    case "medium":
      return {
        label: "Medium",
        class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dotClass: "bg-amber-500",
        icon: CircleIcon,
      };
    case "low":
      return {
        label: "Low",
        class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        dotClass: "bg-blue-500",
        icon: ArrowDownIcon,
      };
    default:
      return null;
  }
});

const labels = computed<string[]>(() => {
  const l = properties.value.labels;
  if (Array.isArray(l)) return l.filter((item): item is string => typeof item === "string");
  return [];
});

const estimate = computed<number | null>(() => {
  const e = properties.value.estimate;
  if (typeof e === "number") return e;
  return null;
});

const assignee = computed<string | null>(() => {
  const a = properties.value.assignee;
  if (typeof a === "string" && a.trim()) return a.trim();
  return null;
});

const assigneeInitial = computed(() => {
  if (!assignee.value) return "?";
  return assignee.value.slice(0, 1).toUpperCase();
});

const hasBottomRow = computed(() => labels.value.length > 0 || estimate.value !== null || assignee.value !== null);
</script>

<template>
  <div
    class="flex w-full min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-background p-2.5 text-left text-sm transition-all shadow-xs hover:border-border/80 hover:shadow-sm select-none"
    :class="preview ? 'shadow-lg ring-1 ring-primary/20' : ''"
    data-slot="issue-card"
  >
    <!-- Top Row: Type Key & Priority -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <FileTextIcon class="size-3 text-muted-foreground/70" />
        <span>{{ document.documentTypeKey ?? "issue" }}</span>
      </div>

      <div
        v-if="priorityMeta"
        class="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold border leading-none"
        :class="priorityMeta.class"
      >
        <span class="size-1.5 rounded-full" :class="priorityMeta.dotClass" />
        <span>{{ priorityMeta.label }}</span>
      </div>
    </div>

    <!-- Middle: Title -->
    <div class="font-medium text-foreground text-xs leading-snug line-clamp-2 wrap-break-word">
      {{ document.title || "Untitled" }}
    </div>

    <!-- Bottom Row: Tags, Estimate & Assignee -->
    <div v-if="hasBottomRow" class="mt-0.5 flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-border/40">
      <div class="flex flex-wrap items-center gap-1">
        <span
          v-for="tag in labels"
          :key="tag"
          class="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {{ tag }}
        </span>
      </div>

      <div class="ml-auto flex items-center gap-1.5">
        <span
          v-if="estimate !== null"
          class="rounded-sm bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground"
        >
          {{ estimate }} pts
        </span>

        <div
          v-if="assignee"
          class="inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary"
          :title="assignee"
        >
          {{ assigneeInitial }}
        </div>
      </div>
    </div>
  </div>
</template>
