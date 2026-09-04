<script setup lang="ts">
import type { DatePropertyDefinition } from "@denser/contracts";
import {
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type DateValue,
} from "@denser/design-system";
import { CalendarIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import {
  formatDatePropertyDisplay,
  from12HourParts,
  fromCalendarDateValue,
  parseDatePropertyValue,
  serializeDatePropertyValue,
  to12HourParts,
  toCalendarDateValue,
} from "../lib/date-property-value";

const props = defineProps<{
  prop: DatePropertyDefinition;
  value: unknown;
  editable: boolean;
}>();

const emit = defineEmits<{
  update: [value: unknown];
}>();

const open = ref(false);
const draft = ref(parseDatePropertyValue(props.value));
const meridiem = ref<"AM" | "PM">("AM");

watch(
  () => props.value,
  (next) => {
    draft.value = parseDatePropertyValue(next);
    meridiem.value = to12HourParts(draft.value.hour).meridiem;
  },
  { immediate: true },
);

const displayLabel = computed(() => formatDatePropertyDisplay(props.value, props.prop));

const calendarValue = computed({
  get: () => toCalendarDateValue(draft.value.date),
  set: (next: DateValue | undefined) => {
    draft.value = {
      ...draft.value,
      date: fromCalendarDateValue(next),
    };
    commit();
  },
});

const hour12Model = computed({
  get: () => String(to12HourParts(draft.value.hour).hour12),
  set: (value: string) => {
    const hour12 = Number.parseInt(value, 10);
    if (!Number.isFinite(hour12)) return;
    draft.value = {
      ...draft.value,
      hour: props.prop.timeFormat === "12h" ? from12HourParts(hour12, meridiem.value) : hour12,
    };
    commit();
  },
});

const hour24Model = computed({
  get: () => String(draft.value.hour).padStart(2, "0"),
  set: (value: string) => {
    const hour = Number.parseInt(value, 10);
    if (!Number.isFinite(hour)) return;
    draft.value = { ...draft.value, hour };
    commit();
  },
});

const minuteModel = computed({
  get: () => String(draft.value.minute).padStart(2, "0"),
  set: (value: string) => {
    const minute = Number.parseInt(value, 10);
    if (!Number.isFinite(minute)) return;
    draft.value = { ...draft.value, minute };
    commit();
  },
});

const meridiemModel = computed({
  get: () => meridiem.value,
  set: (value: string) => {
    if (value !== "AM" && value !== "PM") return;
    meridiem.value = value;
    const { hour12 } = to12HourParts(draft.value.hour);
    draft.value = { ...draft.value, hour: from12HourParts(hour12, value) };
    commit();
  },
});

const showTime = computed(() => props.prop.timeFormat !== "hidden");

function commit() {
  emit("update", serializeDatePropertyValue(draft.value, props.prop.timeFormat));
}

function clearDate() {
  draft.value = { date: null, hour: 9, minute: 0 };
  emit("update", null);
  open.value = false;
}
</script>

<template>
  <Popover v-if="editable" v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 text-xs text-foreground transition-colors outline-none hover:bg-muted"
      >
        <CalendarIcon class="size-3.5 text-muted-foreground" />
        <span>{{ displayLabel }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="calendarValue"
        class="rounded-md border-0 [--cell-size:--spacing(8)]"
        @update:model-value="calendarValue = $event"
      />
      <div v-if="showTime" class="space-y-2 border-t border-border p-3">
        <p class="text-xs font-medium text-muted-foreground">Time</p>
        <div class="flex items-center gap-2">
          <template v-if="prop.timeFormat === '12h'">
            <Input v-model="hour12Model" type="number" min="1" max="12" class="h-8 w-14 text-xs" />
            <span class="text-xs text-muted-foreground">:</span>
            <Input v-model="minuteModel" type="number" min="0" max="59" class="h-8 w-14 text-xs" />
            <Select v-model="meridiemModel">
              <SelectTrigger class="h-8 w-[4.5rem] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </template>
          <template v-else>
            <Input v-model="hour24Model" type="number" min="0" max="23" class="h-8 w-14 text-xs" />
            <span class="text-xs text-muted-foreground">:</span>
            <Input v-model="minuteModel" type="number" min="0" max="59" class="h-8 w-14 text-xs" />
          </template>
        </div>
      </div>
      <div class="flex items-center justify-between border-t border-border p-2">
        <Button variant="ghost" size="sm" class="h-7 text-xs" @click="clearDate">Clear</Button>
        <Button variant="secondary" size="sm" class="h-7 text-xs" @click="open = false">Done</Button>
      </div>
    </PopoverContent>
  </Popover>
  <span v-else class="text-xs text-foreground">{{ displayLabel }}</span>
</template>
