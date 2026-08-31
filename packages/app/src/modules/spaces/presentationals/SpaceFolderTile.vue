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
  preview?: boolean;
  selected?: boolean;
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
  <div
    v-if="preview"
    data-slot="space-folder-tile"
    :class="cn('group pointer-events-none h-10 w-full rounded-xl text-left sm:h-12')"
  >
    <Card size="sm" :class="cn('h-10 w-full rounded-xl border-border bg-card shadow-lg sm:h-12')">
      <CardContent class="flex h-full items-center gap-3 text-card-foreground">
        <component :is="resolveSpaceIcon(icon)" class="size-4 shrink-0" aria-hidden="true" />
        <p class="min-w-0 flex-1 truncate text-sm font-medium">{{ title }}</p>
        <Badge v-if="roleLabel" variant="outline" class="shrink-0">
          {{ roleLabel }}
        </Badge>
      </CardContent>
    </Card>
  </div>

  <ContextMenu v-else>
    <ContextMenuTrigger as-child>
      <button
        type="button"
        data-slot="space-folder-tile"
        :aria-selected="selected || undefined"
        :data-selected="selected || undefined"
        :class="
          cn(
            'group w-full rounded-xl text-left',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          )
        "
        @click="emit('open')"
      >
        <Card
          size="sm"
          :class="
            cn(
              'h-10 w-full cursor-pointer rounded-xl border-border transition-colors sm:h-12',
              'group-hover:bg-secondary/80 group-focus-visible:bg-card/80',
              selected && 'border-primary/50 bg-primary/10 text-foreground ring-2 ring-primary',
            )
          "
        >
          <CardContent
            :class="
              cn(
                'flex h-full items-center gap-3 text-muted-foreground group-hover:text-secondary-foreground',
                selected && 'text-foreground',
              )
            "
          >
            <component :is="resolveSpaceIcon(icon)" class="size-4 shrink-0" aria-hidden="true" />
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
