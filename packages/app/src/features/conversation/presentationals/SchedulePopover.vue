<script setup lang="ts">
import { Button, Popover, PopoverContent, PopoverTrigger } from "@denser/design-system";
import { ClockIcon } from "@lucide/vue";
import { ref } from "vue";
import type { ScheduleCommitPayload, SchedulePreset } from "../types";

const props = defineProps<{
  presets: readonly SchedulePreset[];
  open?: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  commit: [payload: ScheduleCommitPayload];
}>();

const recurring = ref(false);
const customIso = ref("");

function commitPreset(preset: SchedulePreset) {
  emit("commit", {
    whenLabel: preset.whenLabel,
    recurringWeekly: recurring.value,
  });
}

function commitCustom() {
  if (!customIso.value) return;
  emit("commit", {
    whenLabel: customIso.value,
    recurringWeekly: recurring.value,
    customIso: customIso.value,
  });
}
</script>

<template>
  <Popover :open="open" @update:open="emit('update:open', $event)">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button variant="ghost" size="icon-sm" aria-label="Schedule">
          <ClockIcon class="size-4" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-3" align="end">
      <p class="mb-2 text-sm font-medium">Schedule send</p>
      <div class="flex flex-col gap-1">
        <Button
          v-for="preset in props.presets"
          :key="preset.id"
          variant="ghost"
          class="justify-start"
          @click="commitPreset(preset)"
        >
          {{ preset.label }}
        </Button>
      </div>
      <label class="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
        Custom
        <input
          v-model="customIso"
          type="datetime-local"
          class="h-8 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
        />
      </label>
      <label class="mt-2 flex items-center gap-2 text-sm">
        <input v-model="recurring" type="checkbox" />
        Repeat weekly
      </label>
      <Button class="mt-3 w-full" size="sm" :disabled="!customIso" @click="commitCustom">
        Schedule
      </Button>
    </PopoverContent>
  </Popover>
</template>
