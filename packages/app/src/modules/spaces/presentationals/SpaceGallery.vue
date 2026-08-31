<script setup lang="ts">
import {
  DndItem,
  DndOverlay,
  DndRoot,
  DndTarget,
  Skeleton,
  type DndCommitPayload,
} from "@denser/design-system";
import { computed } from "vue";
import SpaceArtifactTile from "./SpaceArtifactTile.vue";
import SpaceFolderTile from "./SpaceFolderTile.vue";
import SpaceMoveMenu from "./SpaceMoveMenu.vue";
import type { SpaceMoveDestination, SpaceMoveNode } from "../lib/space-move-menu";
import type {
  SpaceGalleryArtifact,
  SpaceGalleryArtifactAction,
  SpaceGallerySpace,
  SpaceGallerySpaceAction,
} from "@/modules/spaces/types";

const props = defineProps<{
  childSpaces: readonly SpaceGallerySpace[];
  artifacts: readonly SpaceGalleryArtifact[];
  moveSpaces?: readonly SpaceMoveNode[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  openSpace: [spaceId: string];
  openArtifact: [artifactId: string];
  spaceAction: [action: SpaceGallerySpaceAction, space: SpaceGallerySpace];
  artifactAction: [action: SpaceGalleryArtifactAction, artifact: SpaceGalleryArtifact];
  explore: [spaceId: string];
  move: [payload: { artifactId: string; to: SpaceMoveDestination }];
  moveSpace: [payload: { spaceId: string; to: SpaceMoveDestination }];
}>();

const gridClass = "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3";

const artifactById = computed(() =>
  Object.fromEntries(props.artifacts.map((artifact) => [artifact.id, artifact])),
);

let suppressOpen = false;

function onCommit(payload: DndCommitPayload) {
  suppressOpen = true;
  requestAnimationFrame(() => {
    suppressOpen = false;
  });
  if (payload.canceled || !payload.over || !("targetId" in payload.over)) return;
  const artifactId = payload.sourceIds[0];
  if (!artifactId) return;
  emit("move", { artifactId, to: { kind: "space", spaceId: payload.over.targetId } });
}

function onOpenSpace(spaceId: string) {
  if (suppressOpen) {
    suppressOpen = false;
    return;
  }
  emit("openSpace", spaceId);
}

function onOpenArtifact(artifactId: string) {
  if (suppressOpen) {
    suppressOpen = false;
    return;
  }
  emit("openArtifact", artifactId);
}
</script>

<template>
  <div class="flex flex-col gap-6" data-slot="space-gallery">
    <template v-if="loading">
      <section class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Spaces</h2>
        <div :class="gridClass">
          <Skeleton v-for="index in 2" :key="`folder-${index}`" class="aspect-5/3 rounded-[min(var(--radius-4xl),24px)]" />
        </div>
      </section>
      <section class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Artifacts</h2>
        <div :class="gridClass">
          <Skeleton
            v-for="index in 3"
            :key="`artifact-${index}`"
            class="aspect-square rounded-[min(var(--radius-4xl),24px)]"
          />
        </div>
      </section>
    </template>

    <DndRoot
      v-else-if="childSpaces.length || artifacts.length"
      class="flex flex-col gap-6"
      policy="highlight"
      settle="item"
      @commit="onCommit"
    >
      <section v-if="childSpaces.length" class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Spaces</h2>
        <div :class="gridClass">
          <DndTarget
            v-for="space in childSpaces"
            :key="space.id"
            :target-id="space.id"
            class="rounded-xl data-over:bg-primary/10 data-over:ring-2 data-over:ring-primary"
          >
            <SpaceFolderTile
              :title="space.title"
              :icon="space.icon"
              :sprint-role="space.sprintRole"
              @open="onOpenSpace(space.id)"
              @action="(action) => emit('spaceAction', action, space)"
            >
              <template #move-to>
                <SpaceMoveMenu
                  :spaces="moveSpaces ?? []"
                  :current-destination="space.parentSpaceId"
                  :blocked-ids="[space.id]"
                  @explore="emit('explore', $event)"
                  @select="(to) => emit('moveSpace', { spaceId: space.id, to })"
                />
              </template>
            </SpaceFolderTile>
          </DndTarget>
        </div>
      </section>

      <section v-if="artifacts.length" class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Artifacts</h2>
        <div :class="gridClass">
          <DndItem
            v-for="(artifact, index) in artifacts"
            :key="artifact.id"
            :item-id="artifact.id"
            :index="index"
            :disabled="artifact.kind !== 'document'"
          >
            <SpaceArtifactTile
              :title="artifact.title"
              :kind="artifact.kind"
              @open="onOpenArtifact(artifact.id)"
              @action="(action) => emit('artifactAction', action, artifact)"
            >
              <template v-if="artifact.kind === 'document'" #move-to>
                <SpaceMoveMenu
                  :spaces="moveSpaces ?? []"
                  :current-destination="artifact.spaceId"
                  @explore="emit('explore', $event)"
                  @select="(to) => emit('move', { artifactId: artifact.id, to })"
                />
              </template>
            </SpaceArtifactTile>
          </DndItem>
        </div>
      </section>

      <DndOverlay #default="{ sourceId }" class="rotate-1">
        <SpaceArtifactTile
          v-if="artifactById[sourceId]"
          preview
          :title="artifactById[sourceId].title"
          :kind="artifactById[sourceId].kind"
        />
      </DndOverlay>
    </DndRoot>

    <p
      v-else
      class="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
    >
      This space is empty. Create a nested space or artifact to get started.
    </p>
  </div>
</template>
