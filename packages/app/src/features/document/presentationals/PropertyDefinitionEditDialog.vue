<script setup lang="ts">
import type {
  PropertyDefinition,
  PropertyOption,
  SpaceId,
} from "@denser/contracts";
import {
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
            <select
              id="property-edit-relation-space"
              v-model="relationSpaceId"
              class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option :value="null">No space selected</option>
              <option v-for="space in relationSpaces ?? []" :key="space.id" :value="space.id">
                {{ space.title }}
              </option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox v-model:checked="allowMultiple" />
            Allow multiple links
          </label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
        <Button :disabled="!name.trim()" @click="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
