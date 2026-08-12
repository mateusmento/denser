<script setup lang="ts">
import { computed, ref, watch } from "vue";

type SuggestionRow = {
  id: string;
  label: string;
};

const props = defineProps<{
  items: readonly SuggestionRow[];
  command: (item: SuggestionRow) => void;
}>();

const selectable = computed(() => props.items.filter((item) => item.id !== "sep" && item.label));
const selected = ref(0);

watch(
  () => props.items,
  () => {
    selected.value = 0;
  },
);

function select(index: number) {
  const max = selectable.value.length - 1;
  if (max < 0) return;
  selected.value =
    ((index % selectable.value.length) + selectable.value.length) % selectable.value.length;
}

function confirm() {
  const item = selectable.value[selected.value];
  if (item) props.command(item);
}

function onKeyDown({ event }: { event: KeyboardEvent }) {
  if (event.key === "ArrowDown") {
    select(selected.value + 1);
    return true;
  }
  if (event.key === "ArrowUp") {
    select(selected.value - 1);
    return true;
  }
  if (event.key === "Enter") {
    confirm();
    return true;
  }
  return false;
}

defineExpose({ onKeyDown });
</script>

<template>
  <div
    class="z-50 min-w-48 overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
    data-slot="rich-text-suggestion-menu"
    role="listbox"
  >
    <template v-if="items.length">
      <template v-for="item in items" :key="item.id">
        <div v-if="item.id === 'sep'" class="my-1 h-px bg-border" role="separator" />
        <button
          v-else
          type="button"
          role="option"
          class="flex w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
          :class="selectable[selected]?.id === item.id ? 'bg-accent' : undefined"
          :aria-selected="selectable[selected]?.id === item.id"
          @mousedown.prevent="command(item)"
        >
          {{ item.label }}
        </button>
      </template>
    </template>
    <p v-else class="px-2 py-1.5 text-sm text-muted-foreground">No matches</p>
  </div>
</template>
