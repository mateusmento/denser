<script setup lang="ts">
import type { SpaceIcon } from "@denser/contracts";
import { Button, Input, Label, cn } from "@denser/design-system";
import { computed, ref, watch } from "vue";
import { SPACE_ICON_OPTIONS } from "../lib/space-icons";
import type { SpaceGeneralView } from "../types";

const props = defineProps<{
  view: SpaceGeneralView;
}>();

const emit = defineEmits<{
  save: [input: { title: string; icon: SpaceIcon | null }];
}>();

const title = ref(props.view.title);
const icon = ref<SpaceIcon | null>(props.view.icon);

watch(
  () => props.view,
  (view) => {
    title.value = view.title;
    icon.value = view.icon;
  },
  { deep: true },
);

const isDirty = computed(
  () => title.value.trim() !== props.view.title || icon.value !== props.view.icon,
);

function selectIcon(next: SpaceIcon) {
  icon.value = icon.value === next ? null : next;
}

function onSave() {
  const trimmed = title.value.trim();
  if (!trimmed) return;
  emit("save", { title: trimmed, icon: icon.value });
}
</script>

<template>
  <section class="space-y-6" data-slot="space-general">
    <div class="space-y-1">
      <h2 class="text-sm font-medium">General</h2>
      <p class="text-xs text-muted-foreground">Update how this space appears in the sidebar and gallery.</p>
    </div>

    <div class="space-y-2">
      <Label for="space-name">Name</Label>
      <Input
        id="space-name"
        v-model="title"
        :disabled="!view.canManage || view.isSaving"
        maxlength="200"
        placeholder="Acme"
      />
    </div>

    <div class="space-y-3">
      <Label>Icon</Label>
      <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
        <button
          v-for="option in SPACE_ICON_OPTIONS"
          :key="option.id"
          type="button"
          :disabled="!view.canManage || view.isSaving"
          :class="
            cn(
              'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors',
              icon === option.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              (!view.canManage || view.isSaving) && 'pointer-events-none opacity-50',
            )
          "
          @click="selectIcon(option.id)"
        >
          <component :is="option.icon" class="size-5" aria-hidden="true" />
          <span>{{ option.label }}</span>
        </button>
      </div>
      <p class="text-xs text-muted-foreground">Select an icon, or tap again to use the default folder.</p>
    </div>

    <Button
      v-if="view.canManage"
      size="sm"
      :disabled="!isDirty || !title.trim() || view.isSaving"
      @click="onSave"
    >
      {{ view.isSaving ? "Saving…" : "Save changes" }}
    </Button>
  </section>
</template>
