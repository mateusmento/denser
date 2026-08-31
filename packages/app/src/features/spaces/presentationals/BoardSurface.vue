<script setup lang="ts">
import type { ArtifactSummary } from "@denser/contracts";
import {
  Button,
  DndItem,
  DndList,
  DndOverlay,
  DndRoot,
  type DndCommitPayload,
} from "@denser/design-system";
import { computed } from "vue";
import { neighborsAfterSort, type BoardColumn, type PlaceNeighbors } from "../lib/planning";

const props = defineProps<{
  columns: readonly BoardColumn[];
  emptyUntilStart?: boolean;
  canManage?: boolean;
  isStarting?: boolean;
}>();

const emit = defineEmits<{
  open: [artifact: ArtifactSummary];
  drop: [payload: { artifactId: string; stageId: string } & PlaceNeighbors];
  start: [];
}>();

const titleById = computed(() =>
  Object.fromEntries(
    props.columns.flatMap((column) =>
      column.documents.map((document) => [document.id, document.title || "Untitled"] as const),
    ),
  ),
);

let suppressOpen = false;

function onCommit(payload: DndCommitPayload) {
  suppressOpen = true;
  requestAnimationFrame(() => {
    suppressOpen = false;
  });
  if (
    payload.canceled ||
    !payload.over ||
    !("listId" in payload.over) ||
    !("listId" in payload.from)
  )
    return;
  const artifactId = payload.sourceIds[0];
  const over = payload.over;
  if (!artifactId) return;
  const column = props.columns.find((entry) => entry.stageId === over.listId);
  emit("drop", {
    artifactId,
    stageId: over.listId,
    ...neighborsAfterSort(
      column?.documents.map((document) => document.id) ?? [],
      artifactId,
      over.index,
    ),
  });
}

function onOpen(document: ArtifactSummary) {
  if (suppressOpen) {
    suppressOpen = false;
    return;
  }
  emit("open", document);
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

    <DndRoot
      v-else
      class="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-4"
      policy="sort"
      settle="item"
      @commit="onCommit"
    >
      <section
        v-for="column in columns"
        :key="column.stageId"
        class="flex max-h-full min-h-0 w-72 shrink-0 flex-col gap-2 rounded-xl border border-border bg-muted/30 p-2"
      >
        <h2
          class="flex items-center justify-between px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          <span>{{ column.name }}</span>
          <span class="font-normal text-muted-foreground/70 normal-case">
            {{ column.documents.length }}
          </span>
        </h2>
        <DndList
          :list-id="column.stageId"
          class="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto pr-0.5"
        >
          <DndItem
            v-for="(document, index) in column.documents"
            :key="document.id"
            as="button"
            type="button"
            :item-id="document.id"
            :list-id="column.stageId"
            :index="index"
            class="cursor-grab rounded-lg border border-border bg-background px-3 py-2 text-left text-sm data-dragging:cursor-grabbing"
            @click="onOpen(document)"
          >
            {{ document.title || "Untitled" }}
          </DndItem>
        </DndList>
      </section>
      <DndOverlay #default="{ sourceId }">
        <div
          class="rotate-1 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-lg"
        >
          {{ titleById[sourceId] }}
        </div>
      </DndOverlay>
    </DndRoot>
  </div>
</template>
