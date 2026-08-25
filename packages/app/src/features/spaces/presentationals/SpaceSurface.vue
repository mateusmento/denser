<script setup lang="ts">
import { Badge, Button, Skeleton } from "@denser/design-system";
import type { SpaceContentView, SpaceSurfaceView } from "../types";

defineProps<{
  view: SpaceSurfaceView;
  content?: SpaceContentView;
}>();

const emit = defineEmits<{
  createSpace: [];
  createDocument: [];
  retry: [];
}>();
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8" data-slot="space-surface">
    <template v-if="view.state === 'loading'">
      <Skeleton class="h-8 w-1/2" />
      <Skeleton class="h-24 w-full" />
    </template>

    <template v-else-if="view.state === 'error'">
      <p class="text-sm text-destructive">{{ view.errorMessage ?? "Couldn’t load space." }}</p>
      <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')">Retry</Button>
    </template>

    <template v-else-if="content">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <p v-if="content.space.rootSpaceId" class="text-xs text-muted-foreground">Space</p>
            <Badge variant="outline">{{ content.space.visibility }}</Badge>
          </div>
          <h1 class="text-2xl font-semibold tracking-tight">{{ content.space.title }}</h1>
          <p class="text-sm text-muted-foreground">
            Nested spaces and documents live in the sidebar.
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="emit('createSpace')">New space</Button>
          <Button size="sm" @click="emit('createDocument')">New document</Button>
        </div>
      </div>
    </template>
  </div>
</template>
