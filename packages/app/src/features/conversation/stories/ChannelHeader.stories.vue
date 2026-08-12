<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { channelHeader } from "../fixtures";
import ChannelHeader from "../presentationals/ChannelHeader.vue";

const { Story } = defineMeta({
  title: "features/conversation/ChannelHeader",
  component: ChannelHeader,
  tags: ["autodocs"],
});
</script>

<template>
  <Story as-child name="Default">
    <div class="h-surface-header w-[36rem]">
      <ChannelHeader :channel="channelHeader" />
    </div>
  </Story>
</template>
