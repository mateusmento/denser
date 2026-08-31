<script setup lang="ts">
import {
  Badge,
  DndItem,
  DndOverlay,
  DndRoot,
  DndTarget,
  Skeleton,
  useSelection,
  type DndCommitPayload,
} from "@denser/design-system";
import { useEventListener } from "@vueuse/core";
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

const allItemIds = computed(() => [
  ...props.childSpaces.map((space) => space.id),
  ...props.artifacts.map((artifact) => artifact.id),
]);

const selection = useSelection({ items: allItemIds });
useEventListener("keydown", selection.handleKeyDown);

const spaceById = computed(() =>
  Object.fromEntries(props.childSpaces.map((space) => [space.id, space])),
);

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
  const targetId = payload.over.targetId;
  const sourceIds = payload.sourceIds;

  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;
    if (artifactById.value[sourceId]) {
      emit("move", { artifactId: sourceId, to: { kind: "space", spaceId: targetId } });
    } else if (spaceById.value[sourceId]) {
      emit("moveSpace", { spaceId: sourceId, to: { kind: "space", spaceId: targetId } });
    }
  }
  selection.clear();
}

function onSpaceClick(spaceId: string, event: MouseEvent) {
  if (suppressOpen) {
    suppressOpen = false;
    return;
  }
  const res = selection.handleItemClick(spaceId, event);
  if (res.wasSelectionAction) {
    return;
  }
  if (selection.hasSelection.value) {
    selection.clear();
  }
  emit("openSpace", spaceId);
}

function onArtifactClick(artifactId: string, event: MouseEvent) {
  if (suppressOpen) {
    suppressOpen = false;
    return;
  }
  const res = selection.handleItemClick(artifactId, event);
  if (res.wasSelectionAction) {
    return;
  }
  if (selection.hasSelection.value) {
    selection.clear();
  }
  emit("openArtifact", artifactId);
}

function onContainerClick(event: MouseEvent) {
  if (event.target === event.currentTarget && selection.hasSelection.value) {
    selection.clear();
  }
}

function onMoveItemsTo(originId: string, to: SpaceMoveDestination) {
  const targetIds = selection.isSelected(originId) ? selection.selectedList.value : [originId];
  for (const id of targetIds) {
    if (to.kind === "space" && to.spaceId === id) continue;
    if (artifactById.value[id]) {
      emit("move", { artifactId: id, to });
    } else if (spaceById.value[id]) {
      emit("moveSpace", { spaceId: id, to });
    }
  }
  selection.clear();
}

function blockedMoveIds(itemId: string): readonly string[] {
  if (selection.isSelected(itemId)) {
    return selection.selectedList.value.filter((id) => spaceById.value[id]);
  }
  return spaceById.value[itemId] ? [itemId] : [];
}
</script>

<template>
  <div class="flex flex-col gap-6" data-slot="space-gallery" @click="onContainerClick">
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
      :source-ids-for="(id) => (selection.isSelected(id) ? selection.selectedList.value : [id])"
      @commit="onCommit"
    >
      <section v-if="childSpaces.length" class="space-y-3">
        <h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Spaces</h2>
        <div :class="gridClass">
          <DndTarget
            v-for="(space, index) in childSpaces"
            :key="space.id"
            :target-id="space.id"
            class="rounded-xl data-over:bg-primary/10 data-over:ring-2 data-over:ring-primary"
          >
            <DndItem
              :item-id="space.id"
              :index="index"
              @click="onSpaceClick(space.id, $event)"
            >
              <SpaceFolderTile
                :title="space.title"
                :icon="space.icon"
                :sprint-role="space.sprintRole"
                :selected="selection.isSelected(space.id)"
                @action="(action) => emit('spaceAction', action, space)"
              >
                <template #move-to>
                  <SpaceMoveMenu
                    :spaces="moveSpaces ?? []"
                    :current-destination="space.parentSpaceId"
                    :blocked-ids="blockedMoveIds(space.id)"
                    @explore="emit('explore', $event)"
                    @select="(to) => onMoveItemsTo(space.id, to)"
                  />
                </template>
              </SpaceFolderTile>
            </DndItem>
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
            @click="onArtifactClick(artifact.id, $event)"
          >
            <SpaceArtifactTile
              :title="artifact.title"
              :kind="artifact.kind"
              :selected="selection.isSelected(artifact.id)"
              @action="(action) => emit('artifactAction', action, artifact)"
            >
              <template v-if="artifact.kind === 'document'" #move-to>
                <SpaceMoveMenu
                  :spaces="moveSpaces ?? []"
                  :current-destination="artifact.spaceId"
                  :blocked-ids="blockedMoveIds(artifact.id)"
                  @explore="emit('explore', $event)"
                  @select="(to) => onMoveItemsTo(artifact.id, to)"
                />
              </template>
            </SpaceArtifactTile>
          </DndItem>
        </div>
      </section>

      <DndOverlay #default="{ sourceId, index }" class="rotate-1">
        <div class="relative h-full w-full">
          <SpaceArtifactTile
            v-if="artifactById[sourceId]"
            preview
            :title="artifactById[sourceId].title"
            :kind="artifactById[sourceId].kind"
          />
          <SpaceFolderTile
            v-else-if="spaceById[sourceId]"
            preview
            :title="spaceById[sourceId].title"
            :icon="spaceById[sourceId].icon"
            :sprint-role="spaceById[sourceId].sprintRole"
          />
          <Badge
            v-if="index === 0 && selection.count.value > 1"
            variant="default"
            class="absolute -top-2 -right-2 shadow-md"
          >
            {{ selection.count.value }}
          </Badge>
        </div>
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
