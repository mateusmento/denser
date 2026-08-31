<script setup lang="ts">
import type { SpaceIcon, SprintRole } from "@denser/contracts";
import {
  Badge,
  Card,
  CardContent,
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@denser/design-system";
import { computed } from "vue";
import { resolveSpaceIcon } from "@/modules/spaces/lib/space-icons";
import { sprintRoleLabel } from "@/modules/spaces/lib/sprint-role";
import type { SpaceGallerySpaceAction } from "@/modules/spaces/types";

const props = defineProps<{
  title: string;
  icon?: SpaceIcon | null;
  sprintRole?: SprintRole | null;
}>();

const emit = defineEmits<{
  open: [];
  action: [action: SpaceGallerySpaceAction];
}>();

const roleLabel = computed(() => sprintRoleLabel(props.sprintRole));

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
            'group w-full rounded-xl text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )
        "
        @click="emit('open')"
      >
        <Card
          size="sm"
          :class="
            cn(
              'h-10 sm:h-12 w-full border-border transition-colors rounded-xl cursor-pointer',
              'group-hover:bg-secondary/80 group-focus-visible:bg-card/80',
            )
          "
        >
          <CardContent class="flex h-full items-center gap-3 text-muted-foreground group-hover:text-secondary-foreground">
            <component
              :is="resolveSpaceIcon(icon)"
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            <p class="min-w-0 flex-1 truncate text-sm font-medium">{{ title }}</p>
            <Badge v-if="roleLabel" variant="outline" class="shrink-0">
              {{ roleLabel }}
            </Badge>
          </CardContent>
        </Card>
      </button>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @select="onAction('open')">Open</ContextMenuItem>
      <ContextMenuItem @select="onAction('rename')">Rename</ContextMenuItem>
      <ContextMenuSub v-if="$slots['move-to']">
        <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
        <ContextMenuSubContent class="min-w-56 p-0">
          <slot name="move-to" />
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuItem @select="onAction('openSettings')">Space settings</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" @select="onAction('delete')">Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
