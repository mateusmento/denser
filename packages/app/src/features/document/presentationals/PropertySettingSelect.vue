<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@denser/design-system";

defineProps<{
  id: string;
  modelValue: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <Select
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  >
    <SelectTrigger :id="id" class="h-9 w-full">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
