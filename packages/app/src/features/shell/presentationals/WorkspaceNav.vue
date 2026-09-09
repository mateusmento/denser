<script setup lang="ts">
import {
  ScrollArea,
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
import { ChevronLeftIcon, HomeIcon, PlusIcon } from "@lucide/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { WorkspaceCreateMenu, type WorkspaceCreateAction } from "@/modules/workspace";
import type {
  WorkspaceNavArtifactAction,
  WorkspaceNavLink,
  WorkspaceNavSectionItemLimit,
  WorkspaceNavSpaceAction,
  WorkspaceNavView,
} from "../types";
import WorkspaceNavMenuItem from "./WorkspaceNavMenuItem.vue";
import WorkspaceNavSpaceSection from "./WorkspaceNavSpaceSection.vue";

const props = defineProps<{
  view: WorkspaceNavView;
  isHomeActive: boolean;
  renamingItemId?: string | null;
  pinnedSpaceIds?: ReadonlySet<string>;
}>();

const emit = defineEmits<{
  create: [action: WorkspaceCreateAction, parentSpaceId?: string | null];
  createDirectMessage: [rootSpaceId: string];
  retry: [];
  spaceAction: [action: WorkspaceNavSpaceAction, link: WorkspaceNavLink];
  artifactAction: [action: WorkspaceNavArtifactAction, link: WorkspaceNavLink];
  renameSubmit: [link: WorkspaceNavLink, title: string];
  renameCancel: [link: WorkspaceNavLink];
  sectionLimitChange: [sectionSpaceId: string, limit: WorkspaceNavSectionItemLimit];
  sectionUnpin: [sectionSpaceId: string];
}>();

const showPinToggle = computed(() => props.view.activeRootSpaceId != null);
</script>

<template>
  <SidebarContent data-slot="workspace-nav">
    <ScrollArea class="h-full min-h-0 flex-1">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :is-active="isHomeActive"
                :tooltip="view.homeButton.label"
                size="sm"
              >
                <RouterLink
                  to="/"
                  :aria-label="
                    view.homeButton.showBackHint
                      ? `${view.homeButton.label}, back to home`
                      : undefined
                  "
                >
                  <HomeIcon />
                  <span class="min-w-0 flex-1 truncate">{{ view.homeButton.label }}</span>
                  <span
                    v-if="view.homeButton.showBackHint"
                    class="hidden shrink-0 items-center gap-0.5 overflow-visible text-muted-foreground group-hover/menu-button:inline-flex"
                  >
                    <ChevronLeftIcon />
                    Back to home
                  </span>
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
        <SidebarGroup v-if="view.homeSection">
          <SidebarGroupLabel>{{ view.homeSection.label }}</SidebarGroupLabel>
          <SidebarGroupAction title="Create">
            <WorkspaceCreateMenu variant="sidebar" @create="emit('create', $event, null)" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <WorkspaceNavMenuItem
                v-for="link in view.homeSection.items"
                :key="link.id"
                :link="link"
                :is-renaming="renamingItemId === link.id"
                :is-pinned-to-sidebar="pinnedSpaceIds?.has(link.id) ?? false"
                :show-pin-toggle="showPinToggle"
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

        <SidebarGroup v-if="view.outboxSection">
          <SidebarGroupContent>
            <SidebarMenu>
              <WorkspaceNavMenuItem
                v-for="link in view.outboxSection.items"
                :key="link.id"
                :link="link"
                :is-renaming="renamingItemId === link.id"
                @space-action="(action, item) => emit('spaceAction', action, item)"
                @artifact-action="(action, item) => emit('artifactAction', action, item)"
                @rename-submit="(item, title) => emit('renameSubmit', item, title)"
                @rename-cancel="(item) => emit('renameCancel', item)"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <WorkspaceNavSpaceSection
          v-if="view.inSpaceSection"
          :section="view.inSpaceSection"
          :renaming-item-id="renamingItemId"
          :pinned-space-ids="pinnedSpaceIds"
          :show-pin-toggle="showPinToggle"
          show-create
          @create="(action, sectionSpaceId) => emit('create', action, sectionSpaceId)"
          @space-action="(action, item) => emit('spaceAction', action, item)"
          @artifact-action="(action, item) => emit('artifactAction', action, item)"
          @rename-submit="(item, title) => emit('renameSubmit', item, title)"
          @rename-cancel="(item) => emit('renameCancel', item)"
          @section-limit-change="(id, limit) => emit('sectionLimitChange', id, limit)"
          @section-unpin="(id) => emit('sectionUnpin', id)"
        />

        <WorkspaceNavSpaceSection
          v-for="section in view.pinnedSections"
          :key="section.sectionSpaceId"
          :section="section"
          :renaming-item-id="renamingItemId"
          :pinned-space-ids="pinnedSpaceIds"
          :show-pin-toggle="showPinToggle"
          @space-action="(action, item) => emit('spaceAction', action, item)"
          @artifact-action="(action, item) => emit('artifactAction', action, item)"
          @rename-submit="(item, title) => emit('renameSubmit', item, title)"
          @rename-cancel="(item) => emit('renameCancel', item)"
          @section-limit-change="(id, limit) => emit('sectionLimitChange', id, limit)"
          @section-unpin="(id) => emit('sectionUnpin', id)"
        />

        <SidebarGroup v-if="view.directMessagesSection">
          <SidebarGroupLabel>{{ view.directMessagesSection.label }}</SidebarGroupLabel>
          <SidebarGroupAction
            title="New direct message"
            @click="emit('createDirectMessage', view.directMessagesSection.sectionSpaceId)"
          >
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <WorkspaceNavMenuItem
                v-for="link in view.directMessagesSection.items"
                :key="link.id"
                :link="link"
                :is-renaming="renamingItemId === link.id"
                show-hide-from-sidebar
                @space-action="(action, item) => emit('spaceAction', action, item)"
                @artifact-action="(action, item) => emit('artifactAction', action, item)"
                @rename-submit="(item, title) => emit('renameSubmit', item, title)"
                @rename-cancel="(item) => emit('renameCancel', item)"
              />
              <SidebarMenuItem v-if="!view.directMessagesSection.items.length">
                <p class="px-2 py-1 text-xs text-muted-foreground">No direct messages yet</p>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </template>
    </ScrollArea>
  </SidebarContent>
</template>
