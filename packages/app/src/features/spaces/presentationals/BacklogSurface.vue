<script setup lang="ts">
import type { ArtifactSummary } from "@denser/contracts";
import {
  Button,
  DndItem,
  DndList,
  DndOverlay,
  DndRoot,
  ScrollArea,
  type DndCommitPayload,
} from "@denser/design-system";
import { PlusIcon } from "@lucide/vue";
import { computed } from "vue";
import { neighborsAfterSort, type BacklogSection, type PlaceNeighbors } from "../lib/planning";

const props = defineProps<{
  sections: readonly BacklogSection[];
  canManage?: boolean;
  sprintingEnabled?: boolean;
  hasActiveSprint?: boolean;
  isStarting?: boolean;
  isCompleting?: boolean;
}>();

const emit = defineEmits<{
  open: [artifact: ArtifactSummary];
  create: [spaceId: string];
  move: [payload: { artifactId: string; toSpaceId: string } & PlaceNeighbors];
  start: [];
  complete: [];
}>();

const titleById = computed(() =>
  Object.fromEntries(
    props.sections.flatMap((section) =>
      section.documents.map((document) => [document.id, document.title || "Untitled"] as const),
    ),
  ),
);

let suppressOpen = false;

function onCommit(payload: DndCommitPayload) {
  suppressOpen = true;
  requestAnimationFrame(() => {
    suppressOpen = false;
  });
  if (payload.canceled || !payload.over || !("listId" in payload.over)) return;
  const artifactId = payload.sourceIds[0];
  const over = payload.over;
  if (!artifactId) return;
  const section = props.sections.find((entry) => entry.spaceId === over.listId);
  emit("move", {
    artifactId,
    toSpaceId: over.listId,
    ...neighborsAfterSort(
      section?.documents.map((document) => document.id) ?? [],
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
  <ScrollArea class="h-full min-h-0 flex-1" data-slot="backlog-surface">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold tracking-tight">Backlog</h1>
        <div v-if="sprintingEnabled && canManage" class="flex items-center gap-2">
          <Button v-if="!hasActiveSprint" size="sm" :disabled="isStarting" @click="emit('start')">
            Start sprint
          </Button>
          <Button
            v-else
            size="sm"
            variant="outline"
            :disabled="isCompleting"
            @click="emit('complete')"
          >
            Complete sprint
          </Button>
        </div>
      </div>

      <DndRoot class="flex flex-col gap-6" policy="sort" settle="overlay" @commit="onCommit">
        <section v-for="section in sections" :key="section.key" class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {{ section.title }}
              <span v-if="section.subtitle" class="font-normal text-muted-foreground/80 normal-case">
                · {{ section.subtitle }}
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-muted-foreground"
              @click="emit('create', section.spaceId)"
            >
              <PlusIcon class="size-3.5" />
              Add
            </Button>
          </div>

          <DndList
            :list-id="section.spaceId"
            as="ul"
            class="m-0 flex min-h-16 list-none flex-col gap-1 p-0"
          >
            <DndItem
              v-for="(document, index) in section.documents"
              :key="document.id"
              as="li"
              :item-id="document.id"
              :list-id="section.spaceId"
              :index="index"
              class="w-full min-w-0 cursor-grab rounded-lg border border-border bg-background px-3 py-2 text-sm wrap-break-word select-none data-dragging:cursor-grabbing"
              @click="onOpen(document)"
            >
              {{ document.title || "Untitled" }}
            </DndItem>
            <li
              v-if="!section.documents.length"
              class="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground"
            >
              No documents
            </li>
          </DndList>
        </section>
        <DndOverlay #default="{ sourceId }">
          <div
            class="w-full rotate-1 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm wrap-break-word shadow-lg select-none"
          >
            {{ titleById[sourceId] }}
          </div>
        </DndOverlay>
      </DndRoot>
    </div>
  </ScrollArea>
</template>
