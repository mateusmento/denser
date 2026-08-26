<script setup lang="ts">
import { Skeleton } from "@denser/design-system";
import SpaceArtifactTile from "./SpaceArtifactTile.vue";
import SpaceFolderTile from "./SpaceFolderTile.vue";
import type {
  SpaceGalleryArtifact,
  SpaceGalleryArtifactAction,
  SpaceGallerySpace,
  SpaceGallerySpaceAction,
} from "@/modules/spaces/types";

defineProps<{
  childSpaces: readonly SpaceGallerySpace[];
  artifacts: readonly SpaceGalleryArtifact[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  openSpace: [spaceId: string];
  openArtifact: [artifactId: string];
  spaceAction: [action: SpaceGallerySpaceAction, space: SpaceGallerySpace];
  artifactAction: [action: SpaceGalleryArtifactAction, artifact: SpaceGalleryArtifact];
}>();

const gridClass = "grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3";
</script>

<template>
  <div class="flex flex-col gap-6" data-slot="space-gallery">
    <template v-if="loading">
      <section class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Spaces</h2>
        <div :class="gridClass">
          <Skeleton v-for="index in 2" :key="`folder-${index}`" class="aspect-[5/3] rounded-[min(var(--radius-4xl),24px)]" />
        </div>
      </section>
      <section class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Documents</h2>
        <div :class="gridClass">
          <Skeleton
            v-for="index in 3"
            :key="`artifact-${index}`"
            class="aspect-square rounded-[min(var(--radius-4xl),24px)]"
          />
        </div>
      </section>
    </template>

    <template v-else>
      <section v-if="childSpaces.length" class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Spaces</h2>
        <div :class="gridClass">
          <SpaceFolderTile
            v-for="space in childSpaces"
            :key="space.id"
            :title="space.title"
            :icon="space.icon"
            @open="emit('openSpace', space.id)"
            @action="(action) => emit('spaceAction', action, space)"
          />
        </div>
      </section>

      <section v-if="artifacts.length" class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Documents</h2>
        <div :class="gridClass">
          <SpaceArtifactTile
            v-for="artifact in artifacts"
            :key="artifact.id"
            :title="artifact.title"
            :kind="artifact.kind"
            @open="emit('openArtifact', artifact.id)"
            @action="(action) => emit('artifactAction', action, artifact)"
          />
        </div>
      </section>

      <p
        v-if="!childSpaces.length && !artifacts.length"
        class="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
      >
        This space is empty. Create a nested space or document to get started.
      </p>
    </template>
  </div>
</template>
