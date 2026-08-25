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
  rootSpaces: [
    {
      id: SEED_SPACE_ACME,
      label: "Acme",
      to: { name: "space", params: { spaceId: SEED_SPACE_ACME } },
      isActive: true,
    },
  ],
  rootDocuments: [
    {
      id: SEED_ARTIFACT_PERSONAL_NOTES,
      label: "Personal notes",
      to: { name: "document", params: { documentId: SEED_ARTIFACT_PERSONAL_NOTES } },
      isActive: false,
    },
  ],
  context: {
    title: "Acme",
    spaces: [
      {
        id: SEED_SPACE_ENGINEERING,
        label: "Engineering",
        to: { name: "space", params: { spaceId: SEED_SPACE_ENGINEERING } },
        isActive: false,
      },
    ],
    documents: [],
  },
};
</script>

<template>
  <Story as-child name="Ready">
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader class="border-b border-sidebar-border px-3 py-2">
          <span class="text-sm font-semibold">Denser</span>
        </SidebarHeader>
        <WorkspaceNav
          :view="readyView"
          :is-home-active="false"
          @create-space="action('createSpace')()"
          @create-document="action('createDocument')()"
          @retry="action('retry')()"
          @space-action="(kind, link) => action('spaceAction')(kind, link)"
          @document-action="(kind, link) => action('documentAction')(kind, link)"
        />
      </Sidebar>
      <SidebarInset class="p-6">
        <p class="text-sm text-muted-foreground">Main content</p>
      </SidebarInset>
    </SidebarProvider>
  </Story>
</template>
