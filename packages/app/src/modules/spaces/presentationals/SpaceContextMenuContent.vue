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
    isPinned?: boolean;
    showPinToggle?: boolean;
  }>(),
  {
    showOpen: true,
    showPinToggle: false,
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
    <ContextMenuItem
      v-if="showPinToggle"
      @select="emit('action', isPinned ? 'unpin' : 'pin')"
    >
      {{ isPinned ? "Unpin from sidebar" : "Pin to sidebar" }}
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" @select="emit('action', 'delete')">Delete</ContextMenuItem>
  </ContextMenuContent>
</template>
