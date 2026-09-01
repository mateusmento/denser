<script setup lang="ts">
import type { SpaceBackLink, SpaceContentView, SpaceSurfaceView } from "../types";
import type {
  SpaceGalleryArtifact,
  SpaceGalleryArtifactAction,
  SpaceGallerySpace,
  SpaceGallerySpaceAction,
  SpaceMoveDestination,
  SpaceMoveNode,
} from "@/modules/spaces";
import {
  Badge,
  Button,
  ContextMenu,
  ContextMenuTrigger,
  ScrollArea,
  Skeleton,
} from "@denser/design-system";
import { ChevronLeftIcon } from "@lucide/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import {
  SpaceContextMenuContent,
  SpaceGallery,
  SpaceMoveMenu,
  sprintRoleLabel,
} from "@/modules/spaces";
import { WorkspaceCreateMenu, type WorkspaceCreateAction } from "@/modules/workspace";

const props = defineProps<{
  view: SpaceSurfaceView;
  content?: SpaceContentView;
  backLink?: SpaceBackLink;
  moveSpaces?: readonly SpaceMoveNode[];
}>();

const emit = defineEmits<{
  create: [action: WorkspaceCreateAction];
  retry: [];
  openSpace: [spaceId: string];
  openArtifact: [artifactId: string];
  spaceAction: [action: SpaceGallerySpaceAction, space: SpaceGallerySpace];
  artifactAction: [action: SpaceGalleryArtifactAction, artifact: SpaceGalleryArtifact];
  explore: [spaceId: string];
  move: [payload: { artifactId: string; to: SpaceMoveDestination }];
  moveSpace: [payload: { spaceId: string; to: SpaceMoveDestination }];
}>();

const activeSpace = computed((): SpaceGallerySpace | undefined => {
  if (!props.content) return undefined;
  const { space } = props.content;
  return {
    id: space.id,
    title: space.title,
    icon: space.icon,
    parentSpaceId: space.parentSpaceId,
    sprintRole: space.sprintRole,
  };
});

function onActiveSpaceAction(action: SpaceGallerySpaceAction) {
  if (!activeSpace.value) return;
  emit("spaceAction", action, activeSpace.value);
}

function onActiveSpaceMove(to: SpaceMoveDestination) {
  if (!activeSpace.value) return;
  emit("moveSpace", { spaceId: activeSpace.value.id, to });
}
</script>

<template>
  <ScrollArea class="h-full min-h-0 flex-1" data-slot="space-surface">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <template v-if="view.state === 'loading'">
        <Skeleton class="h-8 w-1/3" />
        <SpaceGallery :child-spaces="[]" :artifacts="[]" loading />
      </template>

      <template v-else-if="view.state === 'error'">
        <p class="text-sm text-destructive">{{ view.errorMessage ?? "Couldn’t load space." }}</p>
        <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')">Retry</Button>
      </template>

      <template v-else-if="content">
        <Button v-if="backLink" variant="secondary" size="sm" class="w-fit" as-child>
          <RouterLink :to="backLink.to">
            <ChevronLeftIcon class="size-4" />
            {{ backLink.label }}
          </RouterLink>
        </Button>

        <div class="flex flex-wrap items-start justify-between gap-4">
          <ContextMenu>
            <ContextMenuTrigger as-child>
              <div
                class="min-w-0 space-y-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-slot="active-space-context-trigger"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <p v-if="content.space.parentSpaceId" class="text-xs text-muted-foreground">
                    Space
                  </p>
                  <Badge v-if="sprintRoleLabel(content.space.sprintRole)" variant="outline">
                    {{ sprintRoleLabel(content.space.sprintRole) }}
                  </Badge>
                  <Badge variant="outline">{{ content.space.visibility }}</Badge>
                </div>
                <h1 class="text-2xl font-semibold tracking-tight">{{ content.space.title }}</h1>
              </div>
            </ContextMenuTrigger>
            <SpaceContextMenuContent :show-open="false" @action="onActiveSpaceAction">
              <template #move-to>
                <SpaceMoveMenu
                  :spaces="moveSpaces ?? []"
                  :current-destination="content.space.parentSpaceId"
                  :blocked-ids="[content.space.id]"
                  @explore="emit('explore', $event)"
                  @select="onActiveSpaceMove"
                />
              </template>
            </SpaceContextMenuContent>
          </ContextMenu>
          <WorkspaceCreateMenu
            :allowed-kinds="content.space.allowedArtifactKinds"
            @create="emit('create', $event)"
          />
        </div>

        <SpaceGallery
          :child-spaces="content.childSpaces"
          :artifacts="content.artifacts"
          :move-spaces="moveSpaces"
          @open-space="emit('openSpace', $event)"
          @open-artifact="emit('openArtifact', $event)"
          @space-action="(action, space) => emit('spaceAction', action, space)"
          @artifact-action="(action, artifact) => emit('artifactAction', action, artifact)"
          @explore="emit('explore', $event)"
          @move="emit('move', $event)"
          @move-space="emit('moveSpace', $event)"
        />
      </template>
    </div>
  </ScrollArea>
</template>
