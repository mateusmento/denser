<script setup lang="ts">
import {
  applyThemeOverride,
  Toaster,
  syncThemeOverrideFromStorage,
  writeStoredThemeOverride,
  type ThemeOverrideBundle,
} from "@denser/design-system";
import { onMounted, watch } from "vue";
import { RouterView } from "vue-router";
import { useColorModeOwner } from "@/modules/theme";

const { mode } = useColorModeOwner();

function resolvedMode(): "light" | "dark" {
  if (mode.value === "dark") return "dark";
  if (mode.value === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

onMounted(async () => {
  if (!import.meta.env.DEV) return;

  syncThemeOverrideFromStorage(resolvedMode());

  try {
    const response = await fetch("/theme-dev-override.json", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as ThemeOverrideBundle;
    if (!data?.light && !data?.dark) return;
    const bundle = { light: data.light ?? {}, dark: data.dark ?? {} };
    writeStoredThemeOverride(bundle);
    applyThemeOverride(bundle, resolvedMode());
  } catch {
    // Missing file is expected until Theme Lab pushes.
  }
});

watch(mode, () => {
  if (!import.meta.env.DEV) return;
  syncThemeOverrideFromStorage(resolvedMode());
});
</script>

<template>
  <RouterView />
  <Toaster />
</template>
