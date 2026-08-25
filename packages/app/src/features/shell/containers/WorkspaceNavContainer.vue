<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { ref } from "vue";
import SpaceSettingsContainer from "@/features/spaces/containers/SpaceSettingsContainer.vue";
import { prompt } from "@/lib/dialog";
import { useWorkspaceNavSync } from "../composables/useWorkspaceNavSync";
import type { WorkspaceNavDocumentAction, WorkspaceNavLink, WorkspaceNavSpaceAction } from "../types";
import WorkspaceNav from "../presentationals/WorkspaceNav.vue";

const { view, isHomeActive, reload, createSpace, createDocument } = useWorkspaceNavSync();

const settingsOpen = ref(false);
const settingsSpaceId = ref<SpaceId | null>(null);
const settingsTitle = ref("");

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
    settingsSpaceId.value = link.id as SpaceId;
    settingsTitle.value = link.label;
    settingsOpen.value = true;
    return;
  }
  // Mock actions — wired later.
}

function onDocumentAction(_action: WorkspaceNavDocumentAction, _link: WorkspaceNavLink) {
  // Mock actions — wired later.
}
</script>

<template>
  <WorkspaceNav
    :view="view"
    :is-home-active="isHomeActive"
    @retry="reload"
    @create-space="onCreateSpace"
    @create-document="onCreateDocument"
    @space-action="onSpaceAction"
    @document-action="onDocumentAction"
  />

  <SpaceSettingsContainer
    v-if="settingsSpaceId"
    v-model:open="settingsOpen"
    :space-id="settingsSpaceId"
    :title="settingsTitle"
  />
</template>
