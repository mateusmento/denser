<script setup lang="ts">
import { ThemeLabPanel } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { computed } from "vue";
import { useColorModeOwner } from "../composables/useColorModeOwner";

const { Story } = defineMeta({
  title: "modules/theme/ThemeLab",
  component: ThemeLabPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
});

const { mode } = useColorModeOwner();

const editMode = computed(() => {
  if (mode.value === "dark") return "dark" as const;
  if (mode.value === "light") return "light" as const;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? ("dark" as const)
    : ("light" as const);
});
</script>

<template>
  <Story as-child name="Controls">
    <div class="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
      <div class="rounded-xl border border-border bg-card p-4">
        <ThemeLabPanel :mode="editMode" />
      </div>
      <p class="text-sm text-muted-foreground">
        Overrides apply to <strong class="text-foreground">every story</strong> in this Storybook
        (Conversation, Document, composers, …). Use the toolbar theme switch for light/dark, then
        tune tokens here. Open any feature story to judge the palette in product UI.
      </p>
      <p class="text-sm text-muted-foreground">
        <strong class="text-foreground">Apply to live app</strong> POSTs to
        <code class="text-foreground">localhost:5173</code> (run
        <code class="text-foreground">pnpm dev:app</code>). Copy/Download CSS to promote into
        <code class="text-foreground">styles.css</code>.
      </p>
    </div>
  </Story>
</template>
