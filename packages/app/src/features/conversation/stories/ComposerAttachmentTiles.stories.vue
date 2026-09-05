<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import ComposerAttachmentTiles from "../presentationals/ComposerAttachmentTiles.vue";
import type { ComposerAttachmentTileView } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/ComposerAttachmentTiles",
  component: ComposerAttachmentTiles,
  tags: ["autodocs"],
});

const uploaded: ComposerAttachmentTileView[] = [
  {
    key: "s:1",
    kind: "uploaded",
    id: "1",
    name: "spec.pdf",
    mimeType: "application/pdf",
    url: "https://placehold.co/80x80",
    byteSize: 248_000,
  },
  {
    key: "s:2",
    kind: "uploaded",
    id: "2",
    name: "screenshot.png",
    mimeType: "image/png",
    url: "https://placehold.co/120x80/png",
    byteSize: 540_000,
  },
];

const uploading: ComposerAttachmentTileView[] = [
  {
    key: "t:1",
    kind: "uploading",
    clientId: "1",
    name: "recording.mp4",
    mimeType: "video/mp4",
    previewUrl: "https://placehold.co/120x80",
    progress: 42,
  },
];

const failed: ComposerAttachmentTileView[] = [
  {
    key: "t:2",
    kind: "failed",
    clientId: "2",
    name: "notes.txt",
    mimeType: "text/plain",
    previewUrl: "https://placehold.co/80x80",
    message: "Network error",
  },
];
</script>

<template>
  <Story as-child name="Uploaded">
    <div class="w-[36rem] rounded-xl border bg-card p-2">
      <ComposerAttachmentTiles :tiles="uploaded" />
    </div>
  </Story>
  <Story as-child name="Uploading">
    <div class="w-[36rem] rounded-xl border bg-card p-2">
      <ComposerAttachmentTiles :tiles="uploading" />
    </div>
  </Story>
  <Story as-child name="Failed">
    <div class="w-[36rem] rounded-xl border bg-card p-2">
      <ComposerAttachmentTiles :tiles="failed" />
    </div>
  </Story>
</template>
