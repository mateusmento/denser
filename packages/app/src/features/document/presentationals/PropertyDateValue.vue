<script setup lang="ts">
import type { DatePropertyDefinition } from "@denser/contracts";
import { Input } from "@denser/design-system";
import { computed } from "vue";

const props = defineProps<{
  prop: DatePropertyDefinition;
  value: unknown;
  editable: boolean;
}>();

const emit = defineEmits<{
  update: [value: unknown];
}>();

const inputType = computed(() => (props.prop.timeFormat === "none" ? "date" : "datetime-local"));

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update", target.value === "" ? null : target.value);
}
</script>

<template>
  <Input
    v-if="editable"
    :type="inputType"
    :value="(value as string) ?? ''"
    class="h-6 w-44 border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-border focus:border-border"
    @change="onInput"
  />
  <span v-else class="text-xs text-foreground">{{ value || "—" }}</span>
</template>
