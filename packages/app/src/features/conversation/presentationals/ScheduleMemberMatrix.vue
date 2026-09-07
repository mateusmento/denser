<script setup lang="ts">
import { computed, ref } from "vue";
import type { ScheduleMatrixMember } from "../lib/scheduleMemberMatrix";
import { buildScheduleMemberMatrix } from "../lib/scheduleMemberMatrix";
import type { ScheduleRecurrencePreset } from "../types";

const props = defineProps<{
  schedulerUserId: string;
  members: readonly ScheduleMatrixMember[];
  dueAtIso: string;
  recurrence: ScheduleRecurrencePreset;
  weekdays?: number[];
  until?: string | null;
  scheduleTimezone: string;
}>();

const expanded = ref(false);

const matrix = computed(() => {
  if (!props.dueAtIso) return null;
  return buildScheduleMemberMatrix({
    schedulerUserId: props.schedulerUserId,
    members: props.members,
    dueAtIso: props.dueAtIso,
    recurrence: props.recurrence,
    weekdays: props.weekdays,
    until: props.until,
    scheduleTimezone: props.scheduleTimezone,
  });
});

const columnCount = computed(() => (props.recurrence === "once" ? 1 : 3));
</script>

<template>
  <div v-if="members.length > 0" class="mt-2">
    <button
      type="button"
      class="text-xs text-muted-foreground underline"
      @click="expanded = !expanded"
    >
      {{ expanded ? "Hide member times" : "See member times" }}
    </button>
    <div v-if="expanded && matrix" class="mt-2 overflow-x-auto rounded-md border border-border">
      <table class="w-full text-left text-[11px]">
        <thead class="border-b border-border text-muted-foreground">
          <tr>
            <th class="px-2 py-1 font-medium">Member</th>
            <th
              v-for="index in columnCount"
              :key="index"
              class="px-2 py-1 font-medium"
            >
              {{ recurrence === "once" ? "Sends" : `Fire ${index}` }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in matrix.rows"
            :key="row.userId"
            class="border-b border-border/60 last:border-0"
          >
            <td class="px-2 py-1 text-foreground">{{ row.name }}</td>
            <td
              v-for="(time, index) in row.times"
              :key="index"
              class="px-2 py-1 text-muted-foreground"
            >
              {{ time }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="matrix.overflowCount > 0" class="px-2 py-1 text-[11px] text-muted-foreground">
        +{{ matrix.overflowCount }} others
      </p>
    </div>
  </div>
</template>
