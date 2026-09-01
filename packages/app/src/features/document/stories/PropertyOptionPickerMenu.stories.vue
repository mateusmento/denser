<script setup lang="ts">
import { DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref } from "vue";
import PropertyOptionPickerMenu from "../presentationals/PropertyOptionPickerMenu.vue";

const { Story } = defineMeta({
  title: "features/document/PropertyOptionPickerMenu",
  component: PropertyOptionPickerMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

const open = ref(true);

const options = [
  { id: "urgent", name: "Urgent", color: "#ef4444" },
  { id: "high", name: "High", color: "#f97316" },
  { id: "medium", name: "Medium", color: "#eab308" },
  { id: "low", name: "Low", color: "#3b82f6" },
];
</script>

<template>
  <Story as-child name="SearchAndCreate">
    <DropdownMenu v-model:open="open">
      <DropdownMenuTrigger class="rounded-md border px-3 py-1.5 text-xs">
        Pick option
      </DropdownMenuTrigger>
      <PropertyOptionPickerMenu
        v-model:open="open"
        :options="options"
        :selected-names="['High']"
        @select="action('select')($event)"
        @remove="action('remove')($event)"
        @create="action('create')($event)"
      />
    </DropdownMenu>
  </Story>
</template>
