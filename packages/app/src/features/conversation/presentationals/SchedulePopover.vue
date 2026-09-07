<script setup lang="ts">
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@denser/design-system";
import { ClockIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import type { ScheduleMatrixMember } from "../lib/scheduleMemberMatrix";
import ScheduleMemberMatrix from "./ScheduleMemberMatrix.vue";
import type { ScheduleCommitPayload, SchedulePreset, ScheduleRecurrencePreset } from "../types";

const props = defineProps<{
  presets: readonly SchedulePreset[];
  open?: boolean;
  timezone?: string;
  scheduleTimezoneLabel?: string | null;
  scheduleTimezone?: string;
  schedulerUserId?: string;
  members?: readonly ScheduleMatrixMember[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  commit: [payload: ScheduleCommitPayload];
}>();

const recurrence = ref<ScheduleRecurrencePreset>("once");
const customIso = ref("");
const weekdays = ref<number[]>([]);
const untilDate = ref("");

const resolvedTimezone = computed(
  () => props.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
);

const recurrenceOptions: readonly { value: ScheduleRecurrencePreset; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const weekdayOptions = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
] as const;

watch(recurrence, (value, previous) => {
  if (value === "weekly" && previous !== "weekly" && customIso.value) {
    weekdays.value = [new Date(customIso.value).getDay()];
  }
});

function toggleWeekday(day: number) {
  if (weekdays.value.includes(day)) {
    weekdays.value = weekdays.value.filter((value) => value !== day);
  } else {
    weekdays.value = [...weekdays.value, day].sort((a, b) => a - b);
  }
}

function canCommitWeekly() {
  return recurrence.value !== "weekly" || weekdays.value.length > 0;
}

function buildPayload(dueAtIso: string, whenLabel: string, extra?: Partial<ScheduleCommitPayload>) {
  return {
    whenLabel,
    dueAtIso,
    timezone: resolvedTimezone.value,
    recurrence: recurrence.value,
    weekdays: recurrence.value === "weekly" ? [...weekdays.value] : undefined,
    until:
      recurrence.value !== "once" && untilDate.value
        ? new Date(`${untilDate.value}T23:59:59`).toISOString()
        : null,
    ...extra,
  } satisfies ScheduleCommitPayload;
}

function commitPreset(preset: SchedulePreset) {
  const dueAtIso = preset.dueAtIso ?? new Date().toISOString();
  emit("commit", buildPayload(dueAtIso, preset.whenLabel, { presetId: preset.id }));
  emit("update:open", false);
}

function commitCustom() {
  if (!customIso.value || !canCommitWeekly()) return;
  const dueAtIso = new Date(customIso.value).toISOString();
  emit("commit", buildPayload(dueAtIso, customIso.value, { customIso: customIso.value }));
  emit("update:open", false);
}

const previewDueAtIso = computed(() =>
  customIso.value ? new Date(customIso.value).toISOString() : "",
);
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
    <PopoverContent class="w-72 p-3" align="end">
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
        <Select
          :model-value="recurrence"
          @update:model-value="recurrence = $event as ScheduleRecurrencePreset"
        >
          <SelectTrigger class="h-8 w-full">
            <SelectValue placeholder="Repeat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in recurrenceOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </label>
      <div v-if="recurrence === 'weekly'" class="mt-2 flex gap-1">
        <button
          v-for="option in weekdayOptions"
          :key="option.value"
          type="button"
          class="flex size-7 items-center justify-center rounded-md border text-xs"
          :class="
            weekdays.includes(option.value)
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground'
          "
          @click="toggleWeekday(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <label
        v-if="recurrence !== 'once'"
        class="mt-2 flex flex-col gap-1 text-xs text-muted-foreground"
      >
        Ends (optional)
        <input
          v-model="untilDate"
          type="date"
          class="h-8 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
        />
      </label>
      <p class="mt-2 text-[11px] text-muted-foreground">
        Picker: {{ resolvedTimezone }}
        <span v-if="scheduleTimezoneLabel"> · Schedule: {{ scheduleTimezoneLabel }}</span>
      </p>
      <ScheduleMemberMatrix
        v-if="schedulerUserId && scheduleTimezone && members?.length"
        :scheduler-user-id="schedulerUserId"
        :members="members"
        :due-at-iso="previewDueAtIso"
        :recurrence="recurrence"
        :weekdays="weekdays"
        :until="untilDate ? new Date(`${untilDate}T23:59:59`).toISOString() : null"
        :schedule-timezone="scheduleTimezone"
      />
      <Button
        class="mt-3 w-full"
        size="sm"
        :disabled="!customIso || !canCommitWeekly()"
        @click="commitCustom"
      >
        Schedule
      </Button>
    </PopoverContent>
  </Popover>
</template>
