<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import {
  applyThemeOverride,
  clearStoredThemeOverride,
  clearThemeOverride,
  detectDocumentThemeMode,
  pushThemeOverrideToLiveApp,
  readStoredThemeOverride,
  resolveThemeTokens,
  serializeThemeOverrideCss,
  THEME_OVERRIDE_EVENT,
  writeStoredThemeOverride,
} from "./apply";
import {
  emptyThemeOverrideBundle,
  THEME_TOKEN_GROUPS,
  THEME_TOKEN_META,
  type ThemeMode,
  type ThemeOverrideBundle,
  type ThemeTokenKey,
} from "./tokens";
import { ScrollArea } from "@/components/ui/scroll-area";

const props = withDefaults(
  defineProps<{
    /** When set, locks the mode used for pickers (Storybook theme toolbar). */
    mode?: ThemeMode;
    /** Show “Apply to live app” (Storybook → Vite :5173). */
    showLiveAppPush?: boolean;
  }>(),
  {
    showLiveAppPush: true,
  },
);

const bundle = ref<ThemeOverrideBundle>(emptyThemeOverrideBundle());
const status = ref("");
const editMode = computed<ThemeMode>(() => props.mode ?? detectDocumentThemeMode());

const resolved = computed(() => resolveThemeTokens(bundle.value, editMode.value));

const grouped = computed(() =>
  THEME_TOKEN_GROUPS.map((group) => ({
    ...group,
    tokens: THEME_TOKEN_META.filter((meta) => meta.group === group.id),
  })),
);

function load() {
  bundle.value = readStoredThemeOverride() ?? emptyThemeOverrideBundle();
  applyThemeOverride(bundle.value, editMode.value);
}

function persistAndApply() {
  writeStoredThemeOverride(bundle.value);
  applyThemeOverride(bundle.value, editMode.value);
}

function setToken(key: ThemeTokenKey, value: string) {
  bundle.value = {
    ...bundle.value,
    [editMode.value]: {
      ...bundle.value[editMode.value],
      [key]: value,
    },
  };
  persistAndApply();
}

function resetAll() {
  bundle.value = emptyThemeOverrideBundle();
  clearStoredThemeOverride();
  clearThemeOverride();
  status.value = "Reset to stylesheet defaults";
}

async function copyCss() {
  await navigator.clipboard.writeText(serializeThemeOverrideCss(bundle.value));
  status.value = "CSS copied";
}

async function copyJson() {
  await navigator.clipboard.writeText(JSON.stringify(bundle.value, null, 2));
  status.value = "JSON copied";
}

function downloadCss() {
  const blob = new Blob([serializeThemeOverrideCss(bundle.value)], { type: "text/css" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "denser-theme-override.css";
  a.click();
  URL.revokeObjectURL(url);
  status.value = "CSS downloaded";
}

async function pushLive() {
  try {
    await pushThemeOverrideToLiveApp(bundle.value);
    status.value = "Pushed to live app (reload if needed)";
  } catch {
    status.value = "Live app unreachable — start pnpm dev:app on :5173";
  }
}

function onExternalOverride(event: Event) {
  const detail = (event as CustomEvent<ThemeOverrideBundle>).detail;
  if (detail) bundle.value = detail;
}

watch(editMode, (mode) => {
  applyThemeOverride(bundle.value, mode);
});

onMounted(() => {
  load();
  window.addEventListener(THEME_OVERRIDE_EVENT, onExternalOverride);
});

onUnmounted(() => {
  window.removeEventListener(THEME_OVERRIDE_EVENT, onExternalOverride);
});
</script>

<template>
  <div class="flex w-full h-full max-w-sm flex-col gap-4 text-sm text-foreground p-4">
    <header class="flex flex-col gap-1">
      <h2 class="text-base font-semibold tracking-tight">Theme Lab</h2>
      <p class="text-xs text-muted-foreground">
        Editing <span class="font-medium text-foreground">{{ editMode }}</span> tokens. Overrides
        apply to this Storybook session and persist in localStorage.
      </p>
    </header>

    <div class="flex flex-wrap gap-2">
      <Button size="xs" variant="secondary" @click="copyCss">Copy CSS</Button>
      <Button size="xs" variant="secondary" @click="copyJson">Copy JSON</Button>
      <Button size="xs" variant="secondary" @click="downloadCss">Download CSS</Button>
      <Button v-if="showLiveAppPush" size="xs" variant="default" @click="pushLive">
        Apply to live app
      </Button>
      <Button size="xs" variant="ghost" @click="resetAll">Reset</Button>
    </div>

    <p v-if="status" class="text-xs text-muted-foreground" role="status">{{ status }}</p>

    <ScrollArea class="!flex flex-1 min-h-0 flex-col gap-4 px-4 -mx-4">
      <div>
        <section v-for="group in grouped" :key="group.id" class="flex flex-col gap-2">
          <h3 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {{ group.label }}
          </h3>
          <ul class="flex flex-col gap-2">
            <li
              v-for="token in group.tokens"
              :key="token.key"
              class="flex items-center justify-between gap-3"
            >
              <label class="min-w-0 flex-1 truncate text-xs" :for="`theme-${token.key}`">
                {{ token.label }}
              </label>
              <input
                :id="`theme-${token.key}`"
                type="color"
                class="size-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
                :value="resolved[token.key]"
                @input="setToken(token.key, ($event.target as HTMLInputElement).value)"
              />
            </li>
          </ul>
        </section>
      </div>
    </ScrollArea>
  </div>
</template>
