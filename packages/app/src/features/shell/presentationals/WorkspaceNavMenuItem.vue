<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@denser/design-system";
import type { Component } from "vue";
import { RouterLink } from "vue-router";
import type { WorkspaceNavDocumentAction, WorkspaceNavLink, WorkspaceNavSpaceAction } from "../types";

const props = defineProps<{
  link: WorkspaceNavLink;
  kind: "space" | "document";
  icon: Component;
}>();

const emit = defineEmits<{
  spaceAction: [action: WorkspaceNavSpaceAction, link: WorkspaceNavLink];
  documentAction: [action: WorkspaceNavDocumentAction, link: WorkspaceNavLink];
}>();

function onSpaceAction(action: WorkspaceNavSpaceAction) {
  emit("spaceAction", action, props.link);
}

function onDocumentAction(action: WorkspaceNavDocumentAction) {
  emit("documentAction", action, props.link);
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <SidebarMenuItem>
        <SidebarMenuButton as-child :is-active="link.isActive" :tooltip="link.label">
          <RouterLink :to="link.to">
            <component :is="icon" />
            <span>{{ link.label }}</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <template v-if="kind === 'space'">
        <ContextMenuItem @select="onSpaceAction('open')">Open</ContextMenuItem>
        <ContextMenuItem @select="onSpaceAction('rename')">Rename</ContextMenuItem>
        <ContextMenuItem @select="onSpaceAction('openSettings')">Space settings</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="onSpaceAction('delete')">
          Delete
        </ContextMenuItem>
      </template>

      <template v-else>
        <ContextMenuItem @select="onDocumentAction('open')">Open</ContextMenuItem>
        <ContextMenuItem @select="onDocumentAction('rename')">Rename</ContextMenuItem>
        <ContextMenuItem @select="onDocumentAction('duplicate')">Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="onDocumentAction('delete')">
          Delete
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
