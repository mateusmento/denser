<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@denser/design-system";
import { useQueryClient } from "@tanstack/vue-query";
import { ref, watch } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthSession } from "@/modules/auth/composables/useAuthSession";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const { user } = useAuthSession();
const queryClient = useQueryClient();
const timezone = ref("UTC");
const saving = ref(false);
const timezoneOptions = Intl.supportedValuesOf("timeZone").map((zone) => ({
  value: zone,
  label: zone,
}));

watch(
  () => props.open,
  (open) => {
    if (!open || !user.value) return;
    timezone.value =
      user.value.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  },
  { immediate: true },
);

async function save() {
  saving.value = true;
  try {
    await apiClient.patchMe({ timezone: timezone.value, timezoneSource: "manual" });
    await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
    emit("update:open", false);
  } finally {
    saving.value = false;
  }
}

async function useAutoTimezone() {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  saving.value = true;
  try {
    await apiClient.patchMe({ timezone: detected, timezoneSource: "auto" });
    await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
    timezone.value = detected;
    emit("update:open", false);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Preferences</DialogTitle>
      </DialogHeader>
      <div class="space-y-3 py-2">
        <div class="space-y-1">
          <Label for="user-timezone">Your timezone</Label>
          <Select
            :model-value="timezone"
            :disabled="saving"
            @update:model-value="timezone = String($event ?? '')"
          >
            <SelectTrigger id="user-timezone" class="h-9 w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="zone in timezoneOptions" :key="zone.value" :value="zone.value">
                {{ zone.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            Used for schedule pickers. Choose auto-update to sync when you travel.
          </p>
        </div>
      </div>
      <DialogFooter class="gap-2 sm:justify-between">
        <Button variant="outline" :disabled="saving" @click="useAutoTimezone">
          Use auto timezone
        </Button>
        <Button :disabled="saving" @click="save">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
