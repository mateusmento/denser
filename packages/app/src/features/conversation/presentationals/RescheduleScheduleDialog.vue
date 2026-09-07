<script setup lang="ts">
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@denser/design-system";
import { computed, ref, watch } from "vue";
import type { ScheduleMatrixMember } from "../lib/scheduleMemberMatrix";
import type {
  ScheduleCommitPayload,
  SchedulePreset,
  ScheduleRecurrencePreset,
  ScheduledMessageView,
} from "../types";
import ScheduleMemberMatrix from "./ScheduleMemberMatrix.vue";
import SchedulePopover from "./SchedulePopover.vue";

const props = defineProps<{
  open: boolean;
  message?: ScheduledMessageView;
  presets: readonly SchedulePreset[];
  userTimezone?: string | null;
  scheduleTimezone?: string | null;
  schedulerUserId?: string | null;
  members?: readonly ScheduleMatrixMember[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  save: [payload: ScheduleCommitPayload];
}>();

const scheduleOpen = ref(false);
const dueAtIso = ref("");
const whenLabel = ref("");
const recurrence = ref<ScheduleRecurrencePreset>("once");
const weekdays = ref<number[]>([]);
const untilDate = ref("");
const until = ref<string | null>(null);

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

watch(
  () => props.message,
  (message) => {
    if (!message) return;
    dueAtIso.value = message.dueAt;
    whenLabel.value = message.dueAtLabel;
    recurrence.value =
      message.recurrenceLabel?.startsWith("Weekly")
        ? "weekly"
        : message.recurrenceLabel?.startsWith("Daily")
          ? "daily"
          : "once";
  },
  { immediate: true },
);

watch(recurrence, (value, previous) => {
  if (value === "weekly" && previous !== "weekly" && dueAtIso.value) {
    weekdays.value = [new Date(dueAtIso.value).getDay()];
  }
});

const customLocal = computed({
  get() {
    if (!dueAtIso.value) return "";
    const date = new Date(dueAtIso.value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },
  set(value: string) {
    if (!value) return;
    dueAtIso.value = new Date(value).toISOString();
    whenLabel.value = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  },
});

function toggleWeekday(day: number) {
  if (weekdays.value.includes(day)) {
    weekdays.value = weekdays.value.filter((value) => value !== day);
  } else {
    weekdays.value = [...weekdays.value, day].sort((a, b) => a - b);
  }
}

function canSave() {
  if (!dueAtIso.value) return false;
  if (recurrence.value === "weekly" && weekdays.value.length === 0) return false;
  return true;
}

function onCommit(payload: ScheduleCommitPayload) {
  dueAtIso.value = payload.dueAtIso;
  whenLabel.value = payload.whenLabel;
  recurrence.value = payload.recurrence;
  weekdays.value = payload.weekdays ?? [];
  until.value = payload.until ?? null;
  untilDate.value = payload.until
    ? new Date(payload.until).toISOString().slice(0, 10)
    : "";
  scheduleOpen.value = false;
}

function save() {
  if (!canSave()) return;
  emit("save", {
    whenLabel: whenLabel.value,
    dueAtIso: dueAtIso.value,
    timezone: props.userTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    recurrence: recurrence.value,
    weekdays: recurrence.value === "weekly" ? weekdays.value : undefined,
    until:
      recurrence.value !== "once" && untilDate.value
        ? new Date(`${untilDate.value}T23:59:59`).toISOString()
        : until.value,
  });
  emit("update:open", false);
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" class="flex w-full flex-col sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Reschedule message</SheetTitle>
      </SheetHeader>
      <div v-if="message" class="min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
        <p class="text-xs text-muted-foreground">
          Update when this message sends. Edit the message body from the composer.
        </p>
        <label class="flex flex-col gap-1 text-xs text-muted-foreground">
          Send time
          <input
            v-model="customLocal"
            type="datetime-local"
            class="h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs text-muted-foreground">
          Repeat
          <Select
            :model-value="recurrence"
            @update:model-value="recurrence = $event as ScheduleRecurrencePreset"
          >
            <SelectTrigger class="h-9 w-full">
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
        <div v-if="recurrence === 'weekly'" class="flex gap-1">
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
          class="flex flex-col gap-1 text-xs text-muted-foreground"
        >
          Ends (optional)
          <input
            v-model="untilDate"
            type="date"
            class="h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
          />
        </label>
        <p class="text-[11px] text-muted-foreground">
          Picker: {{ userTimezone ?? "local" }}
          <span v-if="scheduleTimezone"> · Schedule: {{ scheduleTimezone }}</span>
        </p>
        <ScheduleMemberMatrix
          v-if="schedulerUserId && scheduleTimezone && members?.length && dueAtIso"
          :scheduler-user-id="schedulerUserId"
          :members="members"
          :due-at-iso="dueAtIso"
          :recurrence="recurrence"
          :weekdays="weekdays"
          :until="untilDate ? new Date(`${untilDate}T23:59:59`).toISOString() : null"
          :schedule-timezone="scheduleTimezone"
        />
        <SchedulePopover
          v-model:open="scheduleOpen"
          :presets="presets"
          :timezone="userTimezone ?? undefined"
          :schedule-timezone="scheduleTimezone ?? undefined"
          :schedule-timezone-label="message.scheduleTimezone ?? null"
          :scheduler-user-id="schedulerUserId ?? undefined"
          :members="members"
          @commit="onCommit"
        >
          <template #trigger>
            <Button variant="outline" size="sm">Pick preset</Button>
          </template>
        </SchedulePopover>
      </div>
      <SheetFooter>
        <Button variant="outline" @click="emit('update:open', false)">Close</Button>
        <Button :disabled="!canSave()" @click="save">Save</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
