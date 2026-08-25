<script setup lang="ts">
import { cn, Dialog, DialogContent, DialogTitle } from "@denser/design-system";
import type { SpaceSettingsSection } from "../types";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  title: string;
  activeSection: SpaceSettingsSection;
}>();

const emit = defineEmits<{
  "update:activeSection": [section: SpaceSettingsSection];
}>();

const navItems = [{ id: "members" as const, label: "Members" }];

function selectSection(section: SpaceSettingsSection) {
  emit("update:activeSection", section);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex h-[min(32rem,calc(100vh-2rem))] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      data-slot="space-settings-dialog"
    >
      <DialogTitle class="sr-only">{{ title }} settings</DialogTitle>

      <div class="flex min-h-0 flex-1">
        <nav
          class="flex w-44 shrink-0 flex-col gap-1 border-r border-border bg-muted/70 p-3 sm:w-52"
          aria-label="Space settings"
        >
          <p class="truncate px-2 pb-2 text-xs font-medium text-muted-foreground">
            {{ title }}
          </p>
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            :class="
              cn(
                'rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                props.activeSection === item.id
                  ? 'bg-background font-medium text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            "
            @click="selectSection(item.id)"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="min-w-0 flex-1 overflow-y-auto p-6">
          <slot />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
