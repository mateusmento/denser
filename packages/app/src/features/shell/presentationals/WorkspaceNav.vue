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
import { HomeIcon } from "@lucide/vue";
import { RouterLink } from "vue-router";
import { WorkspaceCreateMenu } from "@/modules/workspace";
import type {
  WorkspaceNavArtifactAction,
  WorkspaceNavLink,
  WorkspaceNavSpaceAction,
  WorkspaceNavView,
} from "../types";
import WorkspaceNavMenuItem from "./WorkspaceNavMenuItem.vue";

defineProps<{
  view: WorkspaceNavView;
  isHomeActive: boolean;
  renamingItemId?: string | null;
}>();

const emit = defineEmits<{
  create: [action: "space" | "document" | "conversation", scopeSpaceId?: string | null];
  retry: [];
  spaceAction: [action: WorkspaceNavSpaceAction, link: WorkspaceNavLink];
  artifactAction: [action: WorkspaceNavArtifactAction, link: WorkspaceNavLink];
  renameSubmit: [link: WorkspaceNavLink, title: string];
  renameCancel: [link: WorkspaceNavLink];
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
        <SidebarGroupLabel>Home</SidebarGroupLabel>
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
        <SidebarGroupLabel>{{ view.homeSection.label }}</SidebarGroupLabel>
        <SidebarGroupAction title="Create">
          <WorkspaceCreateMenu
            variant="sidebar"
            @create="emit('create', $event, view.homeSection.scopeSpaceId)"
          />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            <WorkspaceNavMenuItem
              v-for="link in view.homeSection.items"
              :key="link.id"
              :link="link"
              :is-renaming="renamingItemId === link.id"
              @space-action="(action, item) => emit('spaceAction', action, item)"
              @artifact-action="(action, item) => emit('artifactAction', action, item)"
              @rename-submit="(item, title) => emit('renameSubmit', item, title)"
              @rename-cancel="(item) => emit('renameCancel', item)"
            />
            <SidebarMenuItem v-if="!view.homeSection.items.length">
              <p class="px-2 py-1 text-xs text-muted-foreground">Nothing here yet</p>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup v-if="view.inSpaceSection">
        <SidebarGroupLabel>{{ view.inSpaceSection.label }}</SidebarGroupLabel>
        <SidebarGroupAction title="Create">
          <WorkspaceCreateMenu
            variant="sidebar"
            @create="emit('create', $event, view.inSpaceSection.scopeSpaceId)"
          />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            <WorkspaceNavMenuItem
              v-for="link in view.inSpaceSection.items"
              :key="link.id"
              :link="link"
              :is-renaming="renamingItemId === link.id"
              @space-action="(action, item) => emit('spaceAction', action, item)"
              @artifact-action="(action, item) => emit('artifactAction', action, item)"
              @rename-submit="(item, title) => emit('renameSubmit', item, title)"
              @rename-cancel="(item) => emit('renameCancel', item)"
            />
            <SidebarMenuItem v-if="!view.inSpaceSection.items.length">
              <p class="px-2 py-1 text-xs text-muted-foreground">Empty</p>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </template>
  </SidebarContent>
</template>
