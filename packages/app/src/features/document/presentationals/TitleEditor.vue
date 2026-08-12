<script setup lang="ts">
const title = defineModel<string>({ required: true });

defineProps<{
  placeholder?: string;
  editable?: boolean;
}>();
</script>

<template>
  <input
    v-model="title"
    class="w-full bg-transparent text-2xl leading-tight font-semibold outline-none placeholder:text-muted-foreground"
    data-slot="title-editor"
    :placeholder="placeholder ?? 'Untitled'"
    :readonly="editable === false"
    aria-label="Document title"
  />
</template>
