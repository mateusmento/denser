<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@denser/design-system";
import { CheckIcon, EllipsisVerticalIcon } from "@lucide/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { WorkspaceCreateMenu, type WorkspaceCreateAction } from "@/modules/workspace";
import { overflowNavLabel } from "../lib/nav-section-items";
import type {
  WorkspaceNavArtifactAction,
  WorkspaceNavLink,
  WorkspaceNavSection,
  WorkspaceNavSectionItemLimit,
  WorkspaceNavSpaceAction,
} from "../types";
import { WORKSPACE_NAV_SECTION_ITEM_LIMITS } from "../types";
import WorkspaceNavMenuItem from "./WorkspaceNavMenuItem.vue";

const props = defineProps<{
  section: WorkspaceNavSection;
  renamingItemId?: string | null;
  pinnedSpaceIds?: ReadonlySet<string>;
  showCreate?: boolean;
  showPinToggle?: boolean;
}>();

const emit = defineEmits<{
  create: [action: WorkspaceCreateAction, sectionSpaceId: string];
  spaceAction: [action: WorkspaceNavSpaceAction, link: WorkspaceNavLink];
  artifactAction: [action: WorkspaceNavArtifactAction, link: WorkspaceNavLink];
  renameSubmit: [link: WorkspaceNavLink, title: string];
  renameCancel: [link: WorkspaceNavLink];
  sectionLimitChange: [sectionSpaceId: string, limit: WorkspaceNavSectionItemLimit];
  sectionUnpin: [sectionSpaceId: string];
}>();

const overflowLabel = computed(() => {
  const count = props.section.overflowItems?.length ?? 0;
  if (count === 0) return null;
  const spaceTitle = props.section.label.replace(/^In /, "");
  return overflowNavLabel(count, spaceTitle);
});

const itemLimits = WORKSPACE_NAV_SECTION_ITEM_LIMITS;

function onLimitSelect(limit: WorkspaceNavSectionItemLimit) {
  if (limit === props.section.itemLimit) return;
  emit("sectionLimitChange", props.section.sectionSpaceId, limit);
}

function isSpacePinned(link: WorkspaceNavLink): boolean {
  return props.pinnedSpaceIds?.has(link.id) ?? false;
}
</script>

<template>
  <SidebarGroup>
    <div class="flex h-8 shrink-0 items-center gap-0.5 pr-1">
      <SidebarGroupLabel class="min-w-0 flex-1 truncate px-2">
        {{ section.label }}
      </SidebarGroupLabel>
      <div class="flex shrink-0 items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              title="Section options"
              aria-label="Section options"
            >
              <EllipsisVerticalIcon class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="min-w-40">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Show</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  v-for="limit in itemLimits"
                  :key="limit"
                  @select="onLimitSelect(limit)"
                >
                  <span class="flex-1">{{ limit }}</span>
                  <CheckIcon v-if="limit === section.itemLimit" class="size-4 text-muted-foreground" />
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              v-if="section.isPinned"
              @select="emit('sectionUnpin', section.sectionSpaceId)"
            >
              Unpin from sidebar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <WorkspaceCreateMenu
          v-if="showCreate"
          variant="sidebar"
          @create="emit('create', $event, section.sectionSpaceId)"
        />
      </div>
    </div>
    <SidebarGroupContent>
      <SidebarMenu>
        <WorkspaceNavMenuItem
          v-for="link in section.items"
          :key="link.id"
          :link="link"
          :is-renaming="renamingItemId === link.id"
          :is-pinned-to-sidebar="isSpacePinned(link)"
          :show-pin-toggle="showPinToggle"
          @space-action="(action, item) => emit('spaceAction', action, item)"
          @artifact-action="(action, item) => emit('artifactAction', action, item)"
          @rename-submit="(item, title) => emit('renameSubmit', item, title)"
          @rename-cancel="(item) => emit('renameCancel', item)"
        />
        <SidebarMenuItem v-if="overflowLabel && section.overflowItems?.length">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="sm" :tooltip="overflowLabel">
                <span class="truncate text-muted-foreground">{{ overflowLabel }}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" class="min-w-48">
              <DropdownMenuItem v-for="link in section.overflowItems" :key="link.id" as-child>
                <RouterLink :to="link.to" class="w-full">
                  {{ link.label }}
                </RouterLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <SidebarMenuItem v-if="!section.items.length && !section.overflowItems?.length">
          <p class="px-2 py-1 text-xs text-muted-foreground">Empty</p>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
