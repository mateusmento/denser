<script setup lang="ts">
import type { MultiSelectPropertyDefinition, PropertyOption } from "@denser/contracts";
import { Badge, DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { PlusIcon, XIcon } from "@lucide/vue";
import PropertyOptionPickerMenu from "./PropertyOptionPickerMenu.vue";

const props = defineProps<{
  prop: MultiSelectPropertyDefinition;
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
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

function optionColor(name: string): string | undefined {
  return props.prop.options?.find((opt) => opt.name === name)?.color;
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <Badge
      v-for="tag in selectedOptionNames()"
      :key="tag"
      variant="secondary"
      class="h-5 gap-1 py-0 text-xs"
    >
      <span
        v-if="optionColor(tag)"
        class="size-1.5 rounded-full"
        :style="{ backgroundColor: optionColor(tag) }"
      />
      <span>{{ tag }}</span>
      <button
        v-if="editable"
        type="button"
        class="rounded-full p-0.5 hover:bg-muted-foreground/20"
        @click="emit('remove', tag)"
      >
        <XIcon class="size-2.5" />
      </button>
    </Badge>

    <DropdownMenu v-if="editable" :open="open" @update:open="emit('update:open', $event)">
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PlusIcon class="size-3" />
          {{ selectedOptionNames().length ? "Add" : "Empty" }}
        </button>
      </DropdownMenuTrigger>
      <PropertyOptionPickerMenu
        :open="open"
        :options="prop.options ?? []"
        :selected-names="selectedOptionNames()"
        allow-multiple
        placeholder="Search or create…"
        @update:open="emit('update:open', $event)"
        @select="emit('select', $event)"
        @remove="emit('remove', $event)"
        @create="emit('create', $event)"
      />
    </DropdownMenu>

    <span v-else-if="!selectedOptionNames().length" class="text-xs text-muted-foreground">
      Empty
    </span>
  </div>
</template>
