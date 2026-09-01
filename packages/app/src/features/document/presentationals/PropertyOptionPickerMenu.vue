<script setup lang="ts">
import type { PropertyOption } from "@denser/contracts";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ScrollArea,
} from "@denser/design-system";
import { CheckIcon, PlusIcon, SearchIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  options: readonly PropertyOption[];
  /** Selected option name(s). Single select passes 0–1 names. */
  selectedNames: readonly string[];
  allowMultiple?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  select: [option: PropertyOption];
  remove: [optionName: string];
  create: [name: string];
}>();

const search = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) search.value = "";
  },
);

const needle = computed(() => search.value.trim());

const filteredOptions = computed(() => {
  const q = needle.value.toLowerCase();
  if (!q) return props.options;
  return props.options.filter((opt) => opt.name.toLowerCase().includes(q));
});

const exactMatch = computed(() => {
  const q = needle.value.toLowerCase();
  if (!q) return false;
  return props.options.some((opt) => opt.name.toLowerCase() === q);
});

const canCreate = computed(() => needle.value.length > 0 && !exactMatch.value);

function isSelected(name: string) {
  return props.selectedNames.includes(name);
}

function onToggle(event: Event, option: PropertyOption) {
  event.preventDefault();
  if (isSelected(option.name)) {
    emit("remove", option.name);
    return;
  }
  emit("select", option);
  if (!props.allowMultiple) {
    emit("update:open", false);
  }
}

function onCreate(event: Event) {
  event.preventDefault();
  const name = needle.value;
  if (!name || exactMatch.value) return;
  emit("create", name);
  search.value = "";
  if (!props.allowMultiple) {
    emit("update:open", false);
  }
}
</script>

<template>
  <DropdownMenuContent align="start" class="w-56 overflow-hidden">
    <label class="mx-1 flex items-center gap-2 px-2">
      <SearchIcon class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        v-model="search"
        type="search"
        :placeholder="placeholder ?? 'Search or create…'"
        aria-label="Search options"
        class="h-6 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        @keydown.enter.prevent="canCreate ? onCreate($event) : undefined"
        @keydown.stop
        @pointerdown.stop
      />
    </label>
    <DropdownMenuSeparator />
    <ScrollArea class="h-56">
      <DropdownMenuItem
        v-for="opt in filteredOptions"
        :key="opt.id"
        class="flex items-center justify-between gap-2 text-xs"
        @select="onToggle($event, opt)"
      >
        <div class="flex min-w-0 items-center gap-1.5">
          <span
            v-if="opt.color"
            class="size-2 shrink-0 rounded-full"
            :style="{ backgroundColor: opt.color }"
          />
          <span class="truncate">{{ opt.name }}</span>
        </div>
        <CheckIcon v-if="isSelected(opt.name)" class="size-3.5 shrink-0 text-primary" />
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="canCreate"
        class="gap-2 text-xs"
        @select="onCreate"
      >
        <PlusIcon class="size-3.5 shrink-0 text-muted-foreground" />
        <span class="min-w-0 truncate">Create “{{ needle }}”</span>
      </DropdownMenuItem>
      <p
        v-else-if="!filteredOptions.length"
        class="px-3 py-1.5 text-xs text-muted-foreground"
      >
        No options
      </p>
    </ScrollArea>
  </DropdownMenuContent>
</template>
