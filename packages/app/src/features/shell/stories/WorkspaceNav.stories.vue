<script setup lang="ts">
import type { WorkspaceNavView } from "../types";
import {
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
} from "@denser/contracts";
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import WorkspaceNav from "../presentationals/WorkspaceNav.vue";

const { Story } = defineMeta({
  title: "features/shell/WorkspaceNav",
  component: WorkspaceNav,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

const readyView: WorkspaceNavView = {
  state: "ready",
  homeSection: {
    label: "Home",
    scopeSpaceId: null,
    items: [
      {
        id: SEED_SPACE_ACME,
        label: "Acme",
        icon: "briefcase",
        to: { name: "space", params: { spaceId: SEED_SPACE_ACME } },
        isActive: true,
      },
      {
        id: SEED_ARTIFACT_PERSONAL_NOTES,
        label: "Personal notes",
        artifactKind: "document",
        to: { name: "document", params: { documentId: SEED_ARTIFACT_PERSONAL_NOTES } },
        isActive: false,
      },
    ],
  },
  inSpaceSection: {
    label: "In Acme",
    scopeSpaceId: SEED_SPACE_ACME,
    items: [
      {
        id: SEED_SPACE_ENGINEERING,
        label: "Engineering",
        icon: "code",
        to: { name: "space", params: { spaceId: SEED_SPACE_ENGINEERING } },
        isActive: false,
      },
    ],
  },
};
</script>

<template>
  <Story as-child name="Ready">
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader
          class="flex h-surface-header shrink-0 flex-row items-center border-b border-sidebar-border px-3"
        >
          <span class="text-sm font-semibold">Denser</span>
        </SidebarHeader>
        <WorkspaceNav
          :view="readyView"
          :is-home-active="false"
          @create="(kind) => action('create')(kind)"
          @retry="action('retry')()"
          @space-action="(kind, link) => action('spaceAction')(kind, link)"
          @artifact-action="(kind, link) => action('artifactAction')(kind, link)"
        />
      </Sidebar>
      <SidebarInset class="p-6">
        <p class="text-sm text-muted-foreground">Main content</p>
      </SidebarInset>
    </SidebarProvider>
  </Story>
</template>
