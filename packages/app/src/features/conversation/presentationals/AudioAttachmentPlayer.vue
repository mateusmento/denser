<script setup lang="ts">
defineProps<{
  url: string;
  name: string;
}>();
</script>

<template>
  <audio
    data-slot="audio-attachment-player"
    :src="url"
    controls
    preload="metadata"
    class="h-9 w-full max-w-md"
    :aria-label="name"
  />
</template>
