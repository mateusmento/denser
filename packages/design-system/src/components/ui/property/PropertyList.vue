<script setup lang="ts">
import type { PropertyType } from "./types";
import type { HTMLAttributes } from "vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@lucide/vue";
import PropertyTypeMenu from "./PropertyTypeMenu.vue";

const props = withDefaults(
  defineProps<{
    canManage?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  {
    canManage: true,
  },
);

const emit = defineEmits<{
  addProperty: [type: PropertyType];
}>();

defineSlots<{
  "add-property"?: () => unknown;
  default?: () => unknown;
}>();
</script>

<template>
  <div
    :class="cn('flex flex-col gap-0.5 py-2', props.class)"
    data-slot="property-list"
  >
    <slot />

    <!-- Add Property Row -->
    <div v-if="canManage" class="mt-1 flex items-center py-1">
      <slot name="add-property">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground outline-none select-none"
            >
              <PlusIcon class="size-3.5" />
              Add a property
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-56">
            <PropertyTypeMenu @select="emit('addProperty', $event)" />
          </DropdownMenuContent>
        </DropdownMenu>
      </slot>
    </div>
  </div>
</template>
