<script setup lang="ts">
import { DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref } from "vue";
import { relationSpacesFixture, fixtureEngSpaceId, relationDocumentsFixture } from "../fixtures";
import PropertyAddMenu from "../presentationals/PropertyAddMenu.vue";

const { Story } = defineMeta({
  title: "features/document/PropertyAddMenu",
  component: PropertyAddMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

const open = ref(true);
</script>

<template>
  <Story as-child name="Wizard">
    <DropdownMenu v-model:open="open">
      <DropdownMenuTrigger class="rounded-md border px-3 py-1.5 text-xs">
        Add property
      </DropdownMenuTrigger>
      <PropertyAddMenu
        v-model:open="open"
        :spaces="relationSpacesFixture"
        :current-space-id="fixtureEngSpaceId"
        @add-property="action('addProperty')($event)"
        @explore-space="action('exploreSpace')($event)"
      />
    </DropdownMenu>
  </Story>
</template>
