<script setup lang="ts">
import { Button } from "@denser/design-system";
import type { HomeSurfaceView } from "../types";

defineProps<{
  view: HomeSurfaceView;
}>();

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12"
    data-slot="home-surface"
  >
    <div class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight">Home</h1>
      <p class="text-sm text-muted-foreground">
        Browse spaces and documents in the sidebar, or create something new from there.
      </p>
    </div>

    <template v-if="view.state === 'error'">
      <p class="text-sm text-destructive">{{ view.errorMessage ?? "Couldn’t load home." }}</p>
      <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')">Retry</Button>
    </template>
  </div>
</template>
