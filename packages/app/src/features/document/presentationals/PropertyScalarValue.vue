<script setup lang="ts">
import { Input } from "@denser/design-system";

const props = defineProps<{
  value: unknown;
  editable: boolean;
  type: "text" | "number";
  placeholder?: string;
  emptyLabel?: string;
}>();

const emit = defineEmits<{
  update: [value: unknown];
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (props.type === "number") {
    emit("update", target.value === "" ? null : Number(target.value));
    return;
  }
  emit("update", target.value);
}
</script>

<template>
  <Input
    v-if="editable"
    :type="type"
    :value="value ?? ''"
    :placeholder="placeholder ?? 'Empty'"
    class="h-6 border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-border focus:border-border"
    :class="type === 'number' ? 'w-24 font-mono' : ''"
    @change="onInput"
  />
  <span v-else class="text-xs" :class="type === 'number' ? 'font-mono text-foreground' : 'text-foreground'">
    {{ value ?? emptyLabel ?? "—" }}
  </span>
</template>
