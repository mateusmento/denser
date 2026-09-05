<script setup lang="ts">
import { Button, Popover, PopoverContent, PopoverTrigger } from "@denser/design-system";
import { ClockIcon } from "@lucide/vue";
import { computed, ref } from "vue";
import type { ScheduleCommitPayload, SchedulePreset, ScheduleRecurrencePreset } from "../types";

const props = defineProps<{
  presets: readonly SchedulePreset[];
  open?: boolean;
  timezone?: string;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  commit: [payload: ScheduleCommitPayload];
}>();

const recurrence = ref<ScheduleRecurrencePreset>("once");
const customIso = ref("");

const resolvedTimezone = computed(
  () => props.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
);

const recurrenceOptions: readonly { value: ScheduleRecurrencePreset; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

function commitPreset(preset: SchedulePreset) {
  const dueAtIso = preset.dueAtIso ?? new Date().toISOString();
  emit("commit", {
    whenLabel: preset.whenLabel,
    dueAtIso,
    timezone: resolvedTimezone.value,
    recurrence: recurrence.value,
    presetId: preset.id,
  });
  emit("update:open", false);
}

function commitCustom() {
  if (!customIso.value) return;
  const dueAtIso = new Date(customIso.value).toISOString();
  emit("commit", {
    whenLabel: customIso.value,
    dueAtIso,
    timezone: resolvedTimezone.value,
    recurrence: recurrence.value,
    customIso: customIso.value,
  });
  emit("update:open", false);
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
      <label class="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
        Repeat
        <select
          v-model="recurrence"
          class="h-8 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
        >
          <option v-for="option in recurrenceOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <p class="mt-1 text-[11px] text-muted-foreground">Times shown in {{ resolvedTimezone }}</p>
      <Button class="mt-3 w-full" size="sm" :disabled="!customIso" @click="commitCustom">
        Schedule
      </Button>
    </PopoverContent>
  </Popover>
</template>
