<script setup lang="ts">
import { prompt } from "@/lib/dialog";
import { useHomeSync } from "../composables/useHomeSync";
import HomeSurface from "../presentationals/HomeSurface.vue";

const { view, spaces, artifacts, reload, createSpace, createDocument, openSpace, openDocument } =
  useHomeSync();

async function onCreateSpace() {
  const title = await prompt({
    title: "New space",
    label: "Space name",
    placeholder: "Acme",
    confirmLabel: "Create",
  });
  if (!title?.trim()) return;
  await createSpace(title.trim());
}

async function onCreateDocument() {
  await createDocument();
}
</script>

<template>
  <HomeSurface
    :view="view"
    :spaces="spaces"
    :artifacts="artifacts"
    @retry="reload"
    @create-space="onCreateSpace"
    @create-document="onCreateDocument"
    @open-space="openSpace"
    @open-document="openDocument"
  />
</template>
