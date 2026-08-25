<script setup lang="ts">
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@denser/design-system";
import { FileTextIcon, FolderIcon, HomeIcon, PlusIcon } from "@lucide/vue";
import { RouterLink } from "vue-router";
import type {
  WorkspaceNavDocumentAction,
  WorkspaceNavLink,
  WorkspaceNavSpaceAction,
  WorkspaceNavView,
} from "../types";
import WorkspaceNavMenuItem from "./WorkspaceNavMenuItem.vue";

defineProps<{
  view: WorkspaceNavView;
  isHomeActive: boolean;
}>();

const emit = defineEmits<{
  createSpace: [];
  createDocument: [];
  retry: [];
  spaceAction: [action: WorkspaceNavSpaceAction, link: WorkspaceNavLink];
  documentAction: [action: WorkspaceNavDocumentAction, link: WorkspaceNavLink];
}>();
</script>

<template>
  <SidebarContent data-slot="workspace-nav">
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as-child :is-active="isHomeActive" tooltip="Home">
              <RouterLink to="/">
                <HomeIcon />
                <span>Home</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>

    <SidebarSeparator />

    <template v-if="view.state === 'loading'">
      <SidebarGroup>
        <SidebarGroupLabel>Spaces</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="index in 2" :key="index">
              <SidebarMenuSkeleton />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </template>

    <template v-else-if="view.state === 'error'">
      <SidebarGroup>
        <SidebarGroupContent>
          <p class="px-2 text-xs text-destructive">{{ view.errorMessage }}</p>
          <button
            type="button"
            class="mt-2 px-2 text-xs text-muted-foreground underline"
            @click="emit('retry')"
          >
            Retry
          </button>
        </SidebarGroupContent>
      </SidebarGroup>
    </template>

    <template v-else>
      <SidebarGroup>
        <SidebarGroupLabel>Spaces</SidebarGroupLabel>
        <SidebarGroupAction title="New space" @click="emit('createSpace')">
          <PlusIcon />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            <WorkspaceNavMenuItem
              v-for="space in view.rootSpaces"
              :key="space.id"
              kind="space"
              :link="space"
              :icon="FolderIcon"
              @space-action="(action, link) => emit('spaceAction', action, link)"
              @document-action="(action, link) => emit('documentAction', action, link)"
            />
            <SidebarMenuItem v-if="!view.rootSpaces.length">
              <p class="px-2 py-1 text-xs text-muted-foreground">No spaces yet</p>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Documents</SidebarGroupLabel>
        <SidebarGroupAction title="New document" @click="emit('createDocument')">
          <PlusIcon />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            <WorkspaceNavMenuItem
              v-for="document in view.rootDocuments"
              :key="document.id"
              kind="document"
              :link="document"
              :icon="FileTextIcon"
              @space-action="(action, link) => emit('spaceAction', action, link)"
              @document-action="(action, link) => emit('documentAction', action, link)"
            />
            <SidebarMenuItem v-if="!view.rootDocuments.length">
              <p class="px-2 py-1 text-xs text-muted-foreground">No root documents</p>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup v-if="view.context">
        <SidebarGroupLabel>In {{ view.context.title }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <WorkspaceNavMenuItem
              v-for="space in view.context.spaces"
              :key="space.id"
              kind="space"
              :link="space"
              :icon="FolderIcon"
              @space-action="(action, link) => emit('spaceAction', action, link)"
              @document-action="(action, link) => emit('documentAction', action, link)"
            />
            <WorkspaceNavMenuItem
              v-for="document in view.context.documents"
              :key="document.id"
              kind="document"
              :link="document"
              :icon="FileTextIcon"
              @space-action="(action, link) => emit('spaceAction', action, link)"
              @document-action="(action, link) => emit('documentAction', action, link)"
            />
            <SidebarMenuItem
              v-if="!view.context.spaces.length && !view.context.documents.length"
            >
              <p class="px-2 py-1 text-xs text-muted-foreground">Empty</p>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </template>
  </SidebarContent>
</template>
