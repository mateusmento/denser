<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from "@denser/design-system";
import { useColorModeOwner, type ColorMode } from "../composables/useColorModeOwner";

const { mode } = useColorModeOwner();

function onMode(value: unknown) {
  const next = Array.isArray(value) ? value[0] : value;
  if (next === "light" || next === "dark" || next === "auto") {
    mode.value = next satisfies ColorMode;
  }
}
</script>

<template>
  <ToggleGroup
    type="single"
    size="sm"
    variant="outline"
    aria-label="Appearance"
    data-slot="theme-switcher"
    :model-value="mode"
    @update:model-value="onMode"
  >
    <ToggleGroupItem value="light">Light</ToggleGroupItem>
    <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
    <ToggleGroupItem value="auto">System</ToggleGroupItem>
  </ToggleGroup>
</template>
