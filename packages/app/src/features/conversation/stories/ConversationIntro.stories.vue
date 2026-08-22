<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { channelIntro } from "../fixtures";
import ConversationIntro from "../presentationals/ConversationIntro.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationIntro",
  component: ConversationIntro,
  tags: ["autodocs"],
});
</script>

<template>
  <Story as-child name="Default">
    <div class="w-[36rem]">
      <ConversationIntro
        :intro="channelIntro"
        @edit-description="toast('Edit description')"
        @add-people="toast('Add people')"
      />
    </div>
  </Story>
</template>
