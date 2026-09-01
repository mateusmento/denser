<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@denser/design-system";
import type { SpaceGallerySpaceAction } from "../types";

withDefaults(
  defineProps<{
    showOpen?: boolean;
  }>(),
  {
    showOpen: true,
  },
);

const emit = defineEmits<{
  action: [action: SpaceGallerySpaceAction];
}>();
</script>

<template>
  <ContextMenuContent>
    <ContextMenuItem v-if="showOpen" @select="emit('action', 'open')">Open</ContextMenuItem>
    <ContextMenuItem @select="emit('action', 'rename')">Rename</ContextMenuItem>
    <ContextMenuSub v-if="$slots['move-to']">
      <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
      <ContextMenuSubContent class="min-w-56 p-0">
        <slot name="move-to" />
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuItem @select="emit('action', 'openSettings')">Space settings</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" @select="emit('action', 'delete')">Delete</ContextMenuItem>
  </ContextMenuContent>
</template>
