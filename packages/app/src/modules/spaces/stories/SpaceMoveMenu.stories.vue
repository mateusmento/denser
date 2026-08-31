<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceMoveMenu from "../presentationals/SpaceMoveMenu.vue";
import type { SpaceMoveNode } from "../lib/space-move-menu";

const { Story } = defineMeta({
  title: "modules/spaces/SpaceMoveMenu",
  component: SpaceMoveMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

const spaces: SpaceMoveNode[] = [
  { id: "acme", title: "Acme", parentId: null },
  { id: "eng", title: "Engineering", parentId: "acme" },
  { id: "design", title: "Design", parentId: "acme" },
  { id: "platform", title: "Platform", parentId: "eng" },
];
</script>

<template>
  <Story as-child name="In submenu">
    <ContextMenu>
      <ContextMenuTrigger
        class="rounded-lg border border-dashed px-6 py-8 text-sm text-muted-foreground"
      >
        Right click
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent class="min-w-56 p-0">
            <SpaceMoveMenu
              :spaces="spaces"
              current-destination="acme"
              @explore="action('explore')($event)"
              @select="action('select')($event)"
            />
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  </Story>
</template>
