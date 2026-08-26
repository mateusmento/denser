<script setup lang="ts">
import { Button, Skeleton } from "@denser/design-system";
import SpaceGallery from "@/features/spaces/presentationals/SpaceGallery.vue";
import type { ArtifactSummary } from "@denser/contracts";
import type { SpaceGalleryArtifact, SpaceGalleryArtifactAction, SpaceGallerySpace, SpaceGallerySpaceAction } from "@/features/spaces/types";
import type { HomeContentView, HomeSurfaceView } from "../types";

defineProps<{
  view: HomeSurfaceView;
  content?: HomeContentView;
}>();

const emit = defineEmits<{
  createSpace: [];
  createDocument: [];
  retry: [];
  openSpace: [spaceId: string];
  openArtifact: [artifactId: string];
  spaceAction: [action: SpaceGallerySpaceAction, space: SpaceGallerySpace];
  artifactAction: [action: SpaceGalleryArtifactAction, artifact: SpaceGalleryArtifact];
}>();
</script>

<template>
  <div
    class="grid w-full grid-cols-[minmax(0,1fr)_min(100%,72rem)_minmax(0,1fr)] gap-y-6 py-8"
    data-slot="home-surface"
  >
    <template v-if="view.state === 'loading'">
      <div class="col-start-2 px-6">
        <Skeleton class="h-8 w-1/3" />
      </div>
      <div class="col-start-2 px-6">
        <SpaceGallery :child-spaces="[]" :artifacts="[]" loading />
      </div>
    </template>

    <template v-else-if="view.state === 'error'">
      <div class="col-start-2 flex flex-col gap-4 px-6">
        <p class="text-sm text-destructive">{{ view.errorMessage ?? "Couldn’t load home." }}</p>
        <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')">Retry</Button>
      </div>
    </template>

    <template v-else-if="content">
      <div class="col-start-2 flex flex-wrap items-start justify-between gap-4 px-6">
        <div class="min-w-0 space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">Home</h1>
          <p class="text-sm text-muted-foreground">Your root spaces and documents.</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="emit('createSpace')">New space</Button>
          <Button size="sm" @click="emit('createDocument')">New document</Button>
        </div>
      </div>

      <div class="col-start-2 row-start-2 px-6">
        <SpaceGallery
          :child-spaces="content.spaces"
          :artifacts="content.artifacts"
          @open-space="emit('openSpace', $event)"
          @open-artifact="emit('openArtifact', $event)"
          @space-action="(action, space) => emit('spaceAction', action, space)"
          @artifact-action="(action, artifact) => emit('artifactAction', action, artifact)"
        />
      </div>
    </template>
  </div>
</template>
