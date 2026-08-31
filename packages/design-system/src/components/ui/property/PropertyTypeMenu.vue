<script setup lang="ts">
import type { PropertyType } from "./types";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import PropertyTypeIcon from "./PropertyTypeIcon.vue";

const emit = defineEmits<{
  select: [type: PropertyType];
}>();

const propertyTypes: { type: PropertyType; label: string; description: string }[] = [
  { type: "text", label: "Text", description: "Single-line text" },
  { type: "number", label: "Number", description: "Points, estimates, amounts" },
  { type: "select", label: "Select", description: "Single option from a list" },
  { type: "multi_select", label: "Multi-select", description: "Multiple tags or labels" },
  { type: "date", label: "Date", description: "Due date or timestamp" },
  { type: "person", label: "Person", description: "Member of the space" },
  { type: "relation", label: "Relation", description: "Link documents from another space" },
];
</script>

<template>
  <div>
    <DropdownMenuLabel class="text-xs font-medium text-muted-foreground">
      Property Types
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      v-for="item in propertyTypes"
      :key="item.type"
      class="flex items-center gap-2.5 py-1.5"
      @select="emit('select', item.type)"
    >
      <PropertyTypeIcon :type="item.type" class="size-4 shrink-0 text-muted-foreground" />
      <div class="flex flex-col">
        <span class="text-xs font-medium leading-tight text-foreground">{{ item.label }}</span>
        <span class="text-[11px] leading-tight text-muted-foreground">{{ item.description }}</span>
      </div>
    </DropdownMenuItem>
  </div>
</template>
