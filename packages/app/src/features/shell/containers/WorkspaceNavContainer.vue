<script setup lang="ts">
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { ref } from "vue";
import {
  useArtifactCommands,
  useSpaceCommands,
  useSpaceSettingsHost,
  useWorkspaceCommandPrompts,
} from "@/modules/spaces";
import { useWorkspaceCreateActions } from "@/modules/workspace";
import { confirm } from "@/lib/dialog";
import SpaceSettingsContainer from "@/features/spaces/containers/SpaceSettingsContainer.vue";
import { useWorkspaceNavSync } from "../composables/useWorkspaceNavSync";
import type {
  WorkspaceNavArtifactAction,
  WorkspaceNavLink,
  WorkspaceNavSectionItemLimit,
  WorkspaceNavSpaceAction,
} from "../types";
import WorkspaceNav from "../presentationals/WorkspaceNav.vue";

const {
  view,
  isHomeActive,
  reload,
  pinnedSpaceIds,
  pinSpace,
  unpinSpace,
  setSectionItemLimit,
  createSpace,
  createDirectMessage,
} = useWorkspaceNavSync();
const { openSpace, renameSpace, deleteSpace } = useSpaceCommands();
const { openArtifact, renameArtifact, duplicateArtifact, deleteArtifact } = useArtifactCommands();
const prompts = useWorkspaceCommandPrompts();
const { settingsOpen, settingsSpaceId, settingsTitle, openSettings } = useSpaceSettingsHost();
const { onCreate } = useWorkspaceCreateActions(createSpace);

const renamingItemId = ref<string | null>(null);

async function onPinSpace(link: WorkspaceNavLink) {
  const rootSpaceId = view.value.activeRootSpaceId;
  if (!rootSpaceId) return;
  await pinSpace(link.id as SpaceId);
}

async function onUnpinSpace(link: WorkspaceNavLink) {
  const rootSpaceId = view.value.activeRootSpaceId;
  if (!rootSpaceId) return;
  if (
    !(await confirm({
      title: "Unpin from sidebar?",
      description: `${link.label} will be removed from your sidebar pins.`,
    }))
  ) {
    return;
  }
  await unpinSpace(link.id as SpaceId);
}

function onSpaceAction(action: WorkspaceNavSpaceAction, link: WorkspaceNavLink) {
  if (action === "pin") {
    void onPinSpace(link);
    return;
  }

  if (action === "unpin") {
    void onUnpinSpace(link);
    return;
  }

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

function onArtifactAction(action: WorkspaceNavArtifactAction, link: WorkspaceNavLink) {
  if (action === "open") {
    void openArtifact({
      id: link.id as ArtifactId,
      kind: link.artifactKind ?? "document",
    });
    return;
  }

  if (action === "rename") {
    renamingItemId.value = link.id;
    return;
  }

  if (action === "duplicate") {
    void duplicateArtifact({ id: link.id as ArtifactId, kind: "document" });
    return;
  }

  if (action === "delete") {
    void (async () => {
      if (await prompts.confirmArtifactDelete({ title: link.label })) {
        await deleteArtifact({
          id: link.id as ArtifactId,
          title: link.label,
          kind: link.artifactKind ?? "document",
        });
      }
    })();
  }
}

async function onRenameSubmit(link: WorkspaceNavLink, title: string) {
  renamingItemId.value = null;

  if (link.to.name === "document" || link.to.name === "conversation") {
    await renameArtifact(
      {
        id: link.id as ArtifactId,
        title: link.label,
        kind: link.artifactKind ?? "document",
      },
      title,
    );
    return;
  }

  await renameSpace({ id: link.id as SpaceId, title: link.label, parentSpaceId: null }, title);
}

function onRenameCancel(_link: WorkspaceNavLink) {
  renamingItemId.value = null;
}

async function onCreateDirectMessage(rootSpaceId: string) {
  const username = await prompts.promptDirectMessageUsername();
  if (!username) return;

  const scopeSpaceId = view.value.inSpaceSection?.sectionSpaceId ?? undefined;
  await createDirectMessage(rootSpaceId as SpaceId, username, scopeSpaceId as SpaceId | undefined);
}

async function onSectionUnpin(sectionSpaceId: string) {
  const section = view.value.pinnedSections?.find((item) => item.sectionSpaceId === sectionSpaceId);
  if (
    !(await confirm({
      title: "Unpin from sidebar?",
      description: section
        ? `${section.label} will be removed from your sidebar pins.`
        : "This section will be removed from your sidebar pins.",
    }))
  ) {
    return;
  }
  await unpinSpace(sectionSpaceId as SpaceId);
}

async function onSectionLimitChange(sectionSpaceId: string, limit: WorkspaceNavSectionItemLimit) {
  await setSectionItemLimit(sectionSpaceId as SpaceId, limit);
}
</script>

<template>
  <WorkspaceNav
    :view="view"
    :is-home-active="isHomeActive"
    :renaming-item-id="renamingItemId"
    :pinned-space-ids="pinnedSpaceIds"
    @retry="reload"
    @create="(action, parentSpaceId) => onCreate(action, parentSpaceId as SpaceId | null)"
    @create-direct-message="onCreateDirectMessage"
    @space-action="onSpaceAction"
    @artifact-action="onArtifactAction"
    @rename-submit="onRenameSubmit"
    @rename-cancel="onRenameCancel"
    @section-limit-change="onSectionLimitChange"
    @section-unpin="onSectionUnpin"
  />

  <SpaceSettingsContainer
    v-if="settingsSpaceId"
    v-model:open="settingsOpen"
    :space-id="settingsSpaceId"
    :title="settingsTitle"
  />
</template>
