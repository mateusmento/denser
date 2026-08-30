<script setup lang="ts">
import type { ArtifactSummary } from "@denser/contracts";
import { Button } from "@denser/design-system";
import { PlusIcon } from "@lucide/vue";
import type { BacklogSection } from "../lib/planning";

defineProps<{
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
  move: [payload: { artifactId: string; toSpaceId: string; toIndex: number }];
  start: [];
  complete: [];
}>();

function onDrop(event: DragEvent, spaceId: string, index: number) {
  event.preventDefault();
  const artifactId = event.dataTransfer?.getData("text/artifact-id");
  if (!artifactId) return;
  emit("move", { artifactId, toSpaceId: spaceId, toIndex: index });
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8" data-slot="backlog-surface">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <h1 class="text-2xl font-semibold tracking-tight">Backlog</h1>
      <div v-if="sprintingEnabled && canManage" class="flex items-center gap-2">
        <Button
          v-if="!hasActiveSprint"
          size="sm"
          :disabled="isStarting"
          @click="emit('start')"
        >
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

    <section
      v-for="section in sections"
      :key="section.key"
      class="space-y-2"
      @dragover.prevent
      @drop="onDrop($event, section.spaceId, section.documents.length)"
    >
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {{ section.title }}
          <span v-if="section.subtitle" class="font-normal normal-case text-muted-foreground/80">
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

      <ul class="flex flex-col gap-1">
        <li
          v-for="(document, index) in section.documents"
          :key="document.id"
          draggable="true"
          class="cursor-grab rounded-lg border border-border bg-background px-3 py-2 text-sm active:cursor-grabbing"
          @dragstart="($event) => $event.dataTransfer?.setData('text/artifact-id', document.id)"
          @dragover.prevent
          @drop.stop="onDrop($event, section.spaceId, index)"
          @click="emit('open', document)"
        >
          {{ document.title || "Untitled" }}
        </li>
      </ul>

      <p
        v-if="!section.documents.length"
        class="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground"
      >
        No documents
      </p>
    </section>
  </div>
</template>
