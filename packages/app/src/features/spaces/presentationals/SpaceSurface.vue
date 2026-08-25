<script setup lang="ts">
import { Button, Skeleton } from "@denser/design-system";
import type { SpaceDetailView, SpaceSurfaceView } from "../types";

defineProps<{
  view: SpaceSurfaceView;
  detail?: SpaceDetailView;
}>();

const emit = defineEmits<{
  openSpace: [spaceId: string];
  openDocument: [artifactId: string];
  createSpace: [];
  createDocument: [];
  retry: [];
}>();
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8" data-slot="space-surface">
    <template v-if="view.state === 'loading'">
      <Skeleton class="h-8 w-1/2" />
      <Skeleton class="h-24 w-full" />
    </template>

    <template v-else-if="view.state === 'error'">
      <p class="text-sm text-destructive">{{ view.errorMessage ?? "Couldn’t load space." }}</p>
      <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')">Retry</Button>
    </template>

    <template v-else-if="detail">
      <div class="space-y-1">
        <p v-if="detail.space.rootSpaceId" class="text-xs text-muted-foreground">Space</p>
        <h1 class="text-2xl font-semibold tracking-tight">{{ detail.space.title }}</h1>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" size="sm" @click="emit('createSpace')">New space</Button>
        <Button size="sm" @click="emit('createDocument')">New document</Button>
      </div>

      <section class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">Spaces</h2>
        <ul v-if="detail.childSpaces.length" class="divide-y divide-border rounded-lg border border-border">
          <li v-for="space in detail.childSpaces" :key="space.id">
            <button
              type="button"
              class="flex w-full px-4 py-3 text-left hover:bg-muted/50"
              @click="emit('openSpace', space.id)"
            >
              {{ space.title }}
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">No sub-spaces yet.</p>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">Documents</h2>
        <ul v-if="detail.artifacts.length" class="divide-y divide-border rounded-lg border border-border">
          <li v-for="artifact in detail.artifacts" :key="artifact.id">
            <button
              type="button"
              class="flex w-full px-4 py-3 text-left hover:bg-muted/50"
              @click="emit('openDocument', artifact.id)"
            >
              {{ artifact.title }}
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">No documents in this space.</p>
      </section>
    </template>
  </div>
</template>
