<script setup lang="ts">
import type { SpaceIcon } from "@denser/contracts";
import {
  Card,
  CardContent,
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@denser/design-system";
import { resolveSpaceIcon } from "@/modules/spaces/lib/space-icons";
import type { SpaceGallerySpaceAction } from "@/modules/spaces/types";

defineProps<{
  title: string;
  icon?: SpaceIcon | null;
}>();

const emit = defineEmits<{
  open: [];
  action: [action: SpaceGallerySpaceAction];
}>();

function onAction(action: SpaceGallerySpaceAction) {
  emit("action", action);
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <button
        type="button"
        data-slot="space-folder-tile"
        :class="
          cn(
            'group w-full rounded-[min(var(--radius-4xl),24px)] text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )
        "
        @click="emit('open')"
      >
        <Card
          size="sm"
          :class="
            cn(
              'aspect-9/3 w-full border-border transition-colors rounded-2xl cursor-pointer',
              'group-hover:bg-secondary/80 group-focus-visible:bg-card/80',
            )
          "
        >
          <CardContent class="flex h-full items-center gap-3 text-muted-foreground group-hover:text-secondary-foreground">
            <component
              :is="resolveSpaceIcon(icon)"
              class="size-8 shrink-0"
              aria-hidden="true"
            />
            <p class="min-w-0 truncate text-sm font-medium">{{ title }}</p>
          </CardContent>
        </Card>
      </button>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @select="onAction('open')">Open</ContextMenuItem>
      <ContextMenuItem @select="onAction('rename')">Rename</ContextMenuItem>
      <ContextMenuItem @select="onAction('openSettings')">Space settings</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" @select="onAction('delete')">Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
