<script setup lang="ts">
import type { SpaceId, SpaceVisibility, UserId } from "@denser/contracts";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { prompt } from "@/lib/dialog";
import { useSpaceSync } from "../composables/useSpaceSync";
import SpaceSurface from "../presentationals/SpaceSurface.vue";

const route = useRoute();
const spaceId = computed(() => route.params.spaceId as SpaceId | undefined);

const { view, content, reload, createSpace, createDocument } = useSpaceSync(spaceId);

async function onCreateSpace() {
  const title = await prompt({
    title: "New space",
    label: "Space name",
    placeholder: content.value?.space.title ?? "Untitled",
    confirmLabel: "Create",
  });
  if (!title?.trim()) return;
  await createSpace(title.trim());
}
</script>

<template>
  <SpaceSurface
    :view="view"
    :content="content"
    @retry="reload"
    @create-space="onCreateSpace"
    @create-document="createDocument"
  />
</template>
