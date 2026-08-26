<script setup lang="ts">
import { computed } from "vue";
import { useArtifactCommands } from "@/features/spaces/composables/useArtifactCommands";
import { useSpaceCommands } from "@/features/spaces/composables/useSpaceCommands";
import type { SpaceGalleryArtifact, SpaceGalleryArtifactAction, SpaceGallerySpace, SpaceGallerySpaceAction } from "@/features/spaces/types";
import { prompt } from "@/lib/dialog";
import { useHomeSync } from "../composables/useHomeSync";
import HomeSurface from "../presentationals/HomeSurface.vue";

const { view, spaces, artifacts, reload, createSpace, createDocument, openSpace, openDocument } =
  useHomeSync();
const { renameSpaceWithDialog, deleteSpace } = useSpaceCommands();
const { renameArtifactWithDialog, duplicateArtifact, deleteArtifact } = useArtifactCommands();

const content = computed(() => {
  if (view.value.state !== "ready") return undefined;
  return {
    spaces: spaces.value,
    artifacts: artifacts.value,
  };
});

async function onCreateSpace() {
  const title = await prompt({
    title: "New space",
    label: "Space name",
    placeholder: "Acme",
    confirmLabel: "Create",
  });
  if (!title?.trim()) return;
  await createSpace(title.trim());
}

async function onSpaceAction(action: SpaceGallerySpaceAction, space: SpaceGallerySpace) {
  if (action === "open") {
    await openSpace(space.id);
    return;
  }
  if (action === "rename") {
    await renameSpaceWithDialog(space);
    return;
  }
  if (action === "delete") {
    await deleteSpace(space);
  }
}

async function onArtifactAction(action: SpaceGalleryArtifactAction, artifact: SpaceGalleryArtifact) {
  if (action === "open") {
    await openDocument(artifact.id);
    return;
  }
  if (action === "rename") {
    await renameArtifactWithDialog(artifact);
    return;
  }
  if (action === "duplicate") {
    await duplicateArtifact(artifact);
    return;
  }
  if (action === "delete") {
    await deleteArtifact(artifact);
  }
}
</script>

<template>
  <HomeSurface
    :view="view"
    :content="content"
    @retry="reload"
    @create-space="onCreateSpace"
    @create-document="createDocument"
    @open-space="openSpace"
    @open-artifact="openDocument"
    @space-action="onSpaceAction"
    @artifact-action="onArtifactAction"
  />
</template>
