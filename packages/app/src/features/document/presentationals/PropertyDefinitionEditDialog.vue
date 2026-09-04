<script setup lang="ts">
import type {
  DateFormat,
  DateNotificationConfig,
  DateReminderPreset,
  DateReminderUnit,
  PropertyDefinition,
  PropertyOption,
  SpaceId,
  TimeFormat,
} from "@denser/contracts";
import {
  isDatePropertyDefinition,
  isPersonPropertyDefinition,
  isRelationPropertyDefinition,
  isSelectPropertyDefinition,
  sanitizePropertyDefinition,
} from "@denser/contracts";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@denser/design-system";
import { XIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import type { SpaceMoveNode } from "@/modules/spaces/lib/space-move-menu";
import { createPropertyOption } from "../lib/property-options";
import PropertySettingSelect from "./PropertySettingSelect.vue";

const NO_RELATION_SPACE = "__none__";

const props = defineProps<{
  open: boolean;
  property: PropertyDefinition | null;
  relationSpaces?: readonly SpaceMoveNode[];
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  save: [property: PropertyDefinition];
}>();

const name = ref("");
const required = ref(false);
const options = ref<PropertyOption[]>([]);
const newOptionName = ref("");
const relationSpaceId = ref<SpaceId | null>(null);
const allowMultiple = ref(true);
const personSelectionMode = ref<"single" | "multiple">("single");
const dateFormat = ref<DateFormat>("full_date");
const timeFormat = ref<TimeFormat>("hidden");
const notificationPreset = ref<DateReminderPreset>("none");
const notificationCustomAmount = ref(1);
const notificationCustomUnit = ref<DateReminderUnit>("hours");

const dateFormatOptions: { value: DateFormat; label: string }[] = [
  { value: "full_date", label: "Full date" },
  { value: "short_date", label: "Short date" },
  { value: "mdy", label: "Month/Day/Year" },
  { value: "dmy", label: "Day/Month/Year" },
  { value: "ymd", label: "Year/Month/Day" },
  { value: "relative", label: "Relative" },
];

const timeFormatOptions: { value: TimeFormat; label: string }[] = [
  { value: "hidden", label: "Hidden" },
  { value: "12h", label: "12 hour" },
  { value: "24h", label: "24 hour" },
];

const reminderPresetOptions: { value: DateReminderPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "on_date", label: "On day of event" },
  { value: "1_min_before", label: "1 minute before" },
  { value: "1_hour_before", label: "1 hour before" },
  { value: "1_day_before", label: "1 day before" },
  { value: "custom", label: "Custom…" },
];

const reminderUnitOptions: { value: DateReminderUnit; label: string }[] = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
];

watch(
  () => [props.open, props.property] as const,
  ([isOpen, property]) => {
    if (!isOpen || !property) return;
    name.value = property.name;
    required.value = property.required ?? false;
    options.value = isSelectPropertyDefinition(property) ? [...property.options] : [];
    relationSpaceId.value = isRelationPropertyDefinition(property)
      ? property.relationSpaceId
      : null;
    allowMultiple.value = isRelationPropertyDefinition(property)
      ? property.allowMultiple
      : true;
    personSelectionMode.value =
      isPersonPropertyDefinition(property) && property.allowMultiple ? "multiple" : "single";
    if (isDatePropertyDefinition(property)) {
      dateFormat.value = property.dateFormat;
      timeFormat.value = property.timeFormat;
      notificationPreset.value = property.notification.preset;
      notificationCustomAmount.value = property.notification.customAmount ?? 1;
      notificationCustomUnit.value = property.notification.customUnit ?? "hours";
    }
    newOptionName.value = "";
  },
);

const dialogTitle = computed(() => {
  if (!props.property) return "Edit property";
  switch (props.property.type) {
    case "select":
    case "multi_select":
      return `Edit ${props.property.name} options`;
    case "relation":
      return `Edit ${props.property.name} relation`;
    case "person":
      return `Edit ${props.property.name} person`;
    case "date":
      return `Edit ${props.property.name} date`;
    default:
      return `Edit ${props.property.name}`;
  }
});

const dialogDescription = computed(() => {
  if (!props.property) return "";
  switch (props.property.type) {
    case "select":
    case "multi_select":
      return "Update the display name and available options for this property.";
    case "relation":
      return "Update the display name and target space for linked documents.";
    case "person":
      return "Configure how members are selected for this property.";
    case "date":
      return "Configure date display formats and optional reminder notifications.";
    default:
      return "Update the display name and whether this property is required.";
  }
});

const showOptionsEditor = computed(
  () => props.property != null && isSelectPropertyDefinition(props.property),
);

const showRelationEditor = computed(
  () => props.property != null && isRelationPropertyDefinition(props.property),
);

const showPersonEditor = computed(
  () => props.property != null && isPersonPropertyDefinition(props.property),
);

const showDateEditor = computed(
  () => props.property != null && isDatePropertyDefinition(props.property),
);

const showCustomReminder = computed(() => notificationPreset.value === "custom");

const relationSpaceOptions = computed(() => [
  { value: NO_RELATION_SPACE, label: "No space selected" },
  ...(props.relationSpaces ?? []).map((space) => ({ value: space.id, label: space.title })),
]);

const relationSpaceModel = computed({
  get: () => relationSpaceId.value ?? NO_RELATION_SPACE,
  set: (value: string) => {
    relationSpaceId.value = value === NO_RELATION_SPACE ? null : (value as SpaceId);
  },
});

const personSelectionOptions = [
  { value: "single", label: "Single member" },
  { value: "multiple", label: "Multiple members" },
] as const;

function addOption() {
  const trimmed = newOptionName.value.trim();
  if (!trimmed) return;
  if (options.value.some((opt) => opt.name.toLowerCase() === trimmed.toLowerCase())) {
    newOptionName.value = "";
    return;
  }
  options.value = [...options.value, createPropertyOption(trimmed, options.value.length)];
  newOptionName.value = "";
}

function removeOption(id: string) {
  options.value = options.value.filter((opt) => opt.id !== id);
}

function buildNotificationConfig(): DateNotificationConfig {
  if (notificationPreset.value === "custom") {
    return {
      preset: "custom",
      customAmount: Math.max(1, notificationCustomAmount.value),
      customUnit: notificationCustomUnit.value,
    };
  }
  return { preset: notificationPreset.value };
}

function submit() {
  if (!props.property) return;
  const trimmedName = name.value.trim();
  if (!trimmedName) return;

  emit("save", sanitizePropertyDefinition(buildDraftProperty(trimmedName)));
  emit("update:open", false);
}

function buildDraftProperty(trimmedName: string): PropertyDefinition {
  if (!props.property) {
    throw new Error("Missing property");
  }

  const base = {
    ...props.property,
    name: trimmedName,
    required: required.value,
  };

  if (isSelectPropertyDefinition(props.property)) {
    return {
      ...base,
      type: props.property.type,
      options: options.value,
    } as PropertyDefinition;
  }

  if (isRelationPropertyDefinition(props.property)) {
    return {
      ...base,
      type: "relation",
      relationSpaceId: relationSpaceId.value,
      allowMultiple: allowMultiple.value,
    } as PropertyDefinition;
  }

  if (isPersonPropertyDefinition(props.property)) {
    return {
      ...base,
      type: "person",
      allowMultiple: personSelectionMode.value === "multiple",
    } as PropertyDefinition;
  }

  if (isDatePropertyDefinition(props.property)) {
    return {
      ...base,
      type: "date",
      dateFormat: dateFormat.value,
      timeFormat: timeFormat.value,
      notification: buildNotificationConfig(),
    } as PropertyDefinition;
  }

  return {
    ...base,
    type: props.property.type,
  } as PropertyDefinition;
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>{{ dialogDescription }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="space-y-2">
          <Label for="property-edit-name">Name</Label>
          <Input
            id="property-edit-name"
            v-model="name"
            class="h-9"
            @keydown.enter.prevent="submit"
          />
        </div>

        <label class="flex items-center gap-2 text-sm">
          <Checkbox v-model:checked="required" />
          Required
        </label>

        <div v-if="showOptionsEditor" class="space-y-3">
          <Label>Options</Label>
          <div class="flex items-center gap-2">
            <Input
              v-model="newOptionName"
              placeholder="New option name..."
              class="h-8 text-xs"
              @keydown.enter.prevent="addOption"
            />
            <Button size="sm" variant="secondary" @click="addOption">Add</Button>
          </div>
          <div class="max-h-48 space-y-1.5 overflow-y-auto">
            <div
              v-for="opt in options"
              :key="opt.id"
              class="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-xs"
            >
              <div class="flex items-center gap-2">
                <span
                  v-if="opt.color"
                  class="size-2.5 rounded-full"
                  :style="{ backgroundColor: opt.color }"
                />
                <span class="font-medium">{{ opt.name }}</span>
              </div>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive"
                @click="removeOption(opt.id)"
              >
                <XIcon class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="showRelationEditor" class="space-y-3">
          <div class="space-y-2">
            <Label for="property-edit-relation-space">Target space</Label>
            <PropertySettingSelect
              id="property-edit-relation-space"
              v-model="relationSpaceModel"
              :options="relationSpaceOptions"
            />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox v-model:checked="allowMultiple" />
            Allow multiple links
          </label>
        </div>

        <div v-if="showPersonEditor" class="space-y-2">
          <Label for="property-edit-person-selection">Selection</Label>
          <PropertySettingSelect
            id="property-edit-person-selection"
            v-model="personSelectionMode"
            :options="personSelectionOptions"
          />
        </div>

        <div v-if="showDateEditor" class="space-y-3">
          <div class="space-y-2">
            <Label for="property-edit-date-format">Date format</Label>
            <PropertySettingSelect
              id="property-edit-date-format"
              v-model="dateFormat"
              :options="dateFormatOptions"
            />
          </div>
          <div class="space-y-2">
            <Label for="property-edit-time-format">Time format</Label>
            <PropertySettingSelect
              id="property-edit-time-format"
              v-model="timeFormat"
              :options="timeFormatOptions"
            />
          </div>
          <div class="space-y-2">
            <Label for="property-edit-notifications">Notifications</Label>
            <PropertySettingSelect
              id="property-edit-notifications"
              v-model="notificationPreset"
              :options="reminderPresetOptions"
            />
          </div>
          <div v-if="showCustomReminder" class="flex items-end gap-2 rounded-md border border-border p-3">
            <div class="flex-1 space-y-2">
              <Label for="property-edit-reminder-amount">Amount</Label>
              <Input
                id="property-edit-reminder-amount"
                v-model.number="notificationCustomAmount"
                type="number"
                min="1"
                class="h-9"
              />
            </div>
            <div class="flex-1 space-y-2">
              <Label for="property-edit-reminder-unit">Unit</Label>
              <PropertySettingSelect
                id="property-edit-reminder-unit"
                v-model="notificationCustomUnit"
                :options="reminderUnitOptions"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
        <Button :disabled="!name.trim()" @click="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
