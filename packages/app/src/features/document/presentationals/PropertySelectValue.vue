<script setup lang="ts">
import type { PropertyDefinition, PropertyOption } from "@denser/contracts";
import { DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { ChevronDownIcon } from "@lucide/vue";
import PropertyOptionPickerMenu from "./PropertyOptionPickerMenu.vue";

const props = defineProps<{
  prop: PropertyDefinition;
  value: unknown;
  editable: boolean;
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  select: [option: PropertyOption];
  remove: [optionName: string];
  create: [name: string];
}>();

function selectedOptionNames(): string[] {
  const raw = props.value;
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

function optionColor(name: string): string | undefined {
  return props.prop.options?.find((opt) => opt.name === name)?.color;
}
</script>

<template>
  <DropdownMenu v-if="editable" :open="open" @update:open="emit('update:open', $event)">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-foreground transition-colors outline-none hover:bg-muted"
      >
        <span
          v-if="value"
          class="size-1.5 rounded-full"
          :style="{ backgroundColor: optionColor(String(value)) ?? 'var(--primary)' }"
        />
        <span>{{ value || "Empty" }}</span>
        <ChevronDownIcon class="ml-0.5 size-3 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <PropertyOptionPickerMenu
      :open="open"
      :options="prop.options ?? []"
      :selected-names="selectedOptionNames()"
      placeholder="Search options…"
      @update:open="emit('update:open', $event)"
      @select="emit('select', $event)"
      @remove="emit('remove', $event)"
      @create="emit('create', $event)"
    />
  </DropdownMenu>
  <span v-else class="text-xs text-muted-foreground">{{ value || "Empty" }}</span>
</template>
