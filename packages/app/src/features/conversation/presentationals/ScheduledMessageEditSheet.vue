<script setup lang="ts">
import { Button, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@denser/design-system";
import { computed, ref, watch } from "vue";
import { RichTextPreview } from "@/modules/rich-text";
import type { ScheduleCommitPayload, SchedulePreset, ScheduledMessageView } from "../types";
import SchedulePopover from "./SchedulePopover.vue";

const props = defineProps<{
  open: boolean;
  message?: ScheduledMessageView;
  presets: readonly SchedulePreset[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  save: [payload: { dueAtIso: string; whenLabel: string }];
}>();

const scheduleOpen = ref(false);
const dueAtIso = ref("");
const whenLabel = ref("");

watch(
  () => props.message,
  (message) => {
    if (!message) return;
    dueAtIso.value = message.dueAt;
    whenLabel.value = message.dueAtLabel;
  },
  { immediate: true },
);

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

function onCommit(payload: ScheduleCommitPayload) {
  dueAtIso.value = payload.dueAtIso;
  whenLabel.value = payload.whenLabel;
  scheduleOpen.value = false;
}

function save() {
  if (!dueAtIso.value) return;
  emit("save", { dueAtIso: dueAtIso.value, whenLabel: whenLabel.value });
  emit("update:open", false);
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" class="flex w-full flex-col sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Edit scheduled message</SheetTitle>
      </SheetHeader>
      <div v-if="message" class="min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
        <RichTextPreview :doc="message.body" />
        <label class="flex flex-col gap-1 text-xs text-muted-foreground">
          Send time
          <input
            v-model="customLocal"
            type="datetime-local"
            class="h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
          />
        </label>
        <SchedulePopover
          v-model:open="scheduleOpen"
          :presets="presets"
          :show-recurrence="false"
          @commit="onCommit"
        >
          <template #trigger>
            <Button variant="outline" size="sm">Pick preset</Button>
          </template>
        </SchedulePopover>
      </div>
      <SheetFooter>
        <Button variant="outline" @click="emit('update:open', false)">Close</Button>
        <Button :disabled="!dueAtIso" @click="save">Save</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
