<script setup lang="ts">
import type { PropertyDefinition, PropertyType } from "./types";
import type { HTMLAttributes } from "vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CopyIcon, Edit3Icon, Trash2Icon } from "@lucide/vue";
import PropertyTypeIcon from "./PropertyTypeIcon.vue";

const props = withDefaults(
  defineProps<{
    property: PropertyDefinition;
    canManage?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  {
    canManage: true,
  },
);

const emit = defineEmits<{
  edit: [property: PropertyDefinition];
  rename: [property: PropertyDefinition];
  duplicate: [property: PropertyDefinition];
  delete: [propertyId: string];
  changeType: [propertyId: string, newType: PropertyType];
}>();
</script>

<template>
  <div
    :class="
      cn(
        'group/row flex min-h-8 items-center py-1 text-sm transition-colors',
        props.class,
      )
    "
    data-slot="property-row"
    :data-property-key="property.key"
  >
    <!-- Left Column: Property Label & Schema Menu -->
    <div class="w-44 shrink-0 pr-2">
      <DropdownMenu v-if="canManage">
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground group-hover/row:text-foreground outline-none select-none"
            :title="property.name"
          >
            <PropertyTypeIcon :type="property.type" class="size-3.5 shrink-0" />
            <span class="min-w-0 flex-1 truncate">{{ property.name }}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-48">
          <DropdownMenuItem @select="emit('edit', property)">
            <Edit3Icon class="size-3.5 text-muted-foreground" />
            Edit property
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('rename', property)">
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('duplicate', property)">
            <CopyIcon class="size-3.5 text-muted-foreground" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @select="emit('delete', property.id)"
          >
            <Trash2Icon class="size-3.5" />
            Delete property
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        v-else
        class="flex items-center gap-2 px-1.5 py-1 text-xs font-medium text-muted-foreground"
      >
        <PropertyTypeIcon :type="property.type" class="size-3.5 shrink-0" />
        <span class="min-w-0 flex-1 truncate">{{ property.name }}</span>
      </div>
    </div>

    <!-- Right Column: Property Value Widget -->
    <div class="min-w-0 flex-1 px-1.5">
      <slot />
    </div>
  </div>
</template>
