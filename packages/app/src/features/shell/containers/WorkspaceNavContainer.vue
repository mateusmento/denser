<script setup lang="ts">
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { ref } from "vue";
import {
  useArtifactCommands,
  useSpaceCommands,
  useSpaceSettingsHost,
  useWorkspaceCommandPrompts,
} from "@/modules/spaces";
import SpaceSettingsContainer from "@/features/spaces/containers/SpaceSettingsContainer.vue";
import { prompt } from "@/lib/dialog";
import { useWorkspaceNavSync } from "../composables/useWorkspaceNavSync";
import type { WorkspaceNavDocumentAction, WorkspaceNavLink, WorkspaceNavSpaceAction } from "../types";
import WorkspaceNav from "../presentationals/WorkspaceNav.vue";

const { view, isHomeActive, reload, createSpace, createDocument } = useWorkspaceNavSync();
const { openSpace, renameSpace, deleteSpace } = useSpaceCommands();
const { openDocument, renameArtifact, duplicateArtifact, deleteArtifact } = useArtifactCommands();
const prompts = useWorkspaceCommandPrompts();
const { settingsOpen, settingsSpaceId, settingsTitle, openSettings } = useSpaceSettingsHost();

const renamingItemId = ref<string | null>(null);

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

async function onCreateDocument() {
  await createDocument();
}

function onSpaceAction(action: WorkspaceNavSpaceAction, link: WorkspaceNavLink) {
  if (action === "openSettings") {
    openSettings({ id: link.id as SpaceId, title: link.label });
    return;
  }

  if (action === "open") {
    void openSpace(link.id as SpaceId);
    return;
  }

  if (action === "rename") {
    renamingItemId.value = link.id;
    return;
  }

  if (action === "delete") {
    void (async () => {
      if (await prompts.confirmSpaceDelete({ title: link.label })) {
        await deleteSpace({ id: link.id as SpaceId, title: link.label, parentSpaceId: null });
      }
    })();
  }
}

function onDocumentAction(action: WorkspaceNavDocumentAction, link: WorkspaceNavLink) {
  if (action === "open") {
    void openDocument(link.id as ArtifactId);
    return;
  }

  if (action === "rename") {
    renamingItemId.value = link.id;
    return;
  }

  if (action === "duplicate") {
    void duplicateArtifact({ id: link.id as ArtifactId });
    return;
  }

  if (action === "delete") {
    void (async () => {
      if (await prompts.confirmArtifactDelete({ title: link.label })) {
        await deleteArtifact({ id: link.id as ArtifactId, title: link.label });
      }
    })();
  }
}

async function onRenameSubmit(link: WorkspaceNavLink, title: string) {
  renamingItemId.value = null;

  if (link.to.name === "document") {
    await renameArtifact({ id: link.id as ArtifactId, title: link.label }, title);
    return;
  }

  await renameSpace({ id: link.id as SpaceId, title: link.label, parentSpaceId: null }, title);
}

function onRenameCancel(_link: WorkspaceNavLink) {
  renamingItemId.value = null;
}
</script>

<template>
  <WorkspaceNav
    :view="view"
    :is-home-active="isHomeActive"
    :renaming-item-id="renamingItemId"
    @retry="reload"
    @create-space="onCreateSpace"
    @create-document="onCreateDocument"
    @space-action="onSpaceAction"
    @document-action="onDocumentAction"
    @rename-submit="onRenameSubmit"
    @rename-cancel="onRenameCancel"
  />

  <SpaceSettingsContainer
    v-if="settingsSpaceId"
    v-model:open="settingsOpen"
    :space-id="settingsSpaceId"
    :title="settingsTitle"
  />
</template>
