<script setup lang="ts">
import { DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref } from "vue";
import { relationDocumentsFixture, fixtureEngSpaceId } from "../fixtures";
import RelationDocumentPickerMenu from "../presentationals/RelationDocumentPickerMenu.vue";

const { Story } = defineMeta({
  title: "features/document/RelationDocumentPickerMenu",
  component: RelationDocumentPickerMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

const open = ref(true);
</script>

<template>
  <Story as-child name="DocumentList">
    <DropdownMenu v-model:open="open">
      <DropdownMenuTrigger class="rounded-md border px-3 py-1.5 text-xs">
        Link document
      </DropdownMenuTrigger>
      <RelationDocumentPickerMenu
        v-model:open="open"
        :documents="relationDocumentsFixture[fixtureEngSpaceId] ?? []"
        :selected-ids="[]"
        space-title="Engineering"
        @select="action('select')($event)"
        @remove="action('remove')($event)"
      />
    </DropdownMenu>
  </Story>

  <Story as-child name="Loading">
    <DropdownMenu v-model:open="open">
      <DropdownMenuTrigger class="rounded-md border px-3 py-1.5 text-xs">
        Link document
      </DropdownMenuTrigger>
      <RelationDocumentPickerMenu
        v-model:open="open"
        :documents="[]"
        :selected-ids="[]"
        loading
        space-title="Engineering"
      />
    </DropdownMenu>
  </Story>
</template>
