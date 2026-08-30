<script setup lang="ts">
import type { ArtifactSummary } from "@denser/contracts";
import { Button } from "@denser/design-system";
import type { BoardColumn } from "../lib/planning";

defineProps<{
  columns: readonly BoardColumn[];
  emptyUntilStart?: boolean;
  canManage?: boolean;
  isStarting?: boolean;
}>();

const emit = defineEmits<{
  open: [artifact: ArtifactSummary];
  drop: [payload: { artifactId: string; stageId: string }];
  start: [];
}>();

function onDrop(event: DragEvent, stageId: string) {
  event.preventDefault();
  const artifactId = event.dataTransfer?.getData("text/artifact-id");
  if (!artifactId) return;
  emit("drop", { artifactId, stageId });
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 px-6 py-8" data-slot="board-surface">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <h1 class="text-2xl font-semibold tracking-tight">Board</h1>
      <Button
        v-if="emptyUntilStart && canManage"
        size="sm"
        :disabled="isStarting"
        @click="emit('start')"
      >
        Start sprint
      </Button>
    </div>

    <p
      v-if="emptyUntilStart"
      class="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
    >
      Start a sprint to fill the board.
    </p>

    <div
      v-else
      class="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-4"
    >
      <section
        v-for="column in columns"
        :key="column.stageId"
        class="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-border bg-muted/30 p-2"
        @dragover.prevent
        @drop="onDrop($event, column.stageId)"
      >
        <h2 class="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {{ column.name }}
        </h2>
        <button
          v-for="document in column.documents"
          :key="document.id"
          type="button"
          draggable="true"
          class="cursor-grab rounded-lg border border-border bg-background px-3 py-2 text-left text-sm active:cursor-grabbing"
          @dragstart="($event) => $event.dataTransfer?.setData('text/artifact-id', document.id)"
          @click="emit('open', document)"
        >
          {{ document.title || "Untitled" }}
        </button>
      </section>
    </div>
  </div>
</template>
