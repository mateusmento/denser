<script setup lang="ts">
import type { ArtifactSummary, SpaceSummary } from "@denser/contracts";
import { Button, Skeleton } from "@denser/design-system";
import type { HomeSurfaceView } from "../types";

defineProps<{
  view: HomeSurfaceView;
  spaces: readonly SpaceSummary[];
  artifacts: readonly ArtifactSummary[];
}>();

const emit = defineEmits<{
  openSpace: [spaceId: string];
  openDocument: [artifactId: string];
  createSpace: [];
  createDocument: [];
  retry: [];
}>();
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8" data-slot="home-surface">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Home</h1>
        <p class="text-sm text-muted-foreground">Root spaces and documents.</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="emit('createSpace')">New space</Button>
        <Button size="sm" @click="emit('createDocument')">New document</Button>
      </div>
    </div>

    <template v-if="view.state === 'loading'">
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-24 w-full" />
    </template>

    <template v-else-if="view.state === 'error'">
      <p class="text-sm text-destructive">{{ view.errorMessage ?? "Couldn’t load home." }}</p>
      <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')">Retry</Button>
    </template>

    <template v-else>
      <section class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">Spaces</h2>
        <ul v-if="spaces.length" class="divide-y divide-border rounded-lg border border-border">
          <li v-for="space in spaces" :key="space.id">
            <button
              type="button"
              class="flex w-full items-center px-4 py-3 text-left hover:bg-muted/50"
              @click="emit('openSpace', space.id)"
            >
              <span class="font-medium">{{ space.title }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">No spaces yet.</p>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">Documents</h2>
        <ul v-if="artifacts.length" class="divide-y divide-border rounded-lg border border-border">
          <li v-for="artifact in artifacts" :key="artifact.id">
            <button
              type="button"
              class="flex w-full items-center px-4 py-3 text-left hover:bg-muted/50"
              @click="emit('openDocument', artifact.id)"
            >
              <span class="font-medium">{{ artifact.title }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">No root documents yet.</p>
      </section>
    </template>
  </div>
</template>
