<script setup lang="ts">
import type { PropertyType, SpaceId } from "@denser/contracts";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Input,
  PropertyTypeIcon,
} from "@denser/design-system";
import { ArrowLeftIcon, ChevronRightIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import RelationSpacePickerMenu from "@/modules/spaces/presentationals/RelationSpacePickerMenu.vue";
import type { SpaceMoveNode } from "@/modules/spaces/lib/space-move-menu";

export type AddPropertyPayload = {
  name: string;
  type: PropertyType;
  relationSpaceId?: SpaceId | null;
  allowMultiple?: boolean;
};

const props = defineProps<{
  open: boolean;
  spaces: readonly SpaceMoveNode[];
  currentSpaceId?: SpaceId | null;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  addProperty: [payload: AddPropertyPayload];
  exploreSpace: [spaceId: string];
}>();

type Step = "types" | "relation-space" | "name";

const propertyTypes: { type: PropertyType; label: string; description: string }[] = [
  { type: "text", label: "Text", description: "Single-line text" },
  { type: "number", label: "Number", description: "Points, estimates, amounts" },
  { type: "select", label: "Select", description: "Single option from a list" },
  { type: "multi_select", label: "Multi-select", description: "Multiple tags or labels" },
  { type: "date", label: "Date", description: "Due date or timestamp" },
  { type: "person", label: "Person", description: "Member of the space" },
  { type: "relation", label: "Relation", description: "Link documents from another space" },
];

const step = ref<Step>("types");
const selectedType = ref<PropertyType | null>(null);
const selectedRelationSpaceId = ref<SpaceId | null>(null);
const propertyName = ref("");
const direction = ref<"forward" | "back">("forward");

const selectedTypeLabel = computed(() => {
  if (!selectedType.value) return "";
  return selectedType.value.replace("_", " ");
});

const selectedSpaceTitle = computed(() => {
  if (!selectedRelationSpaceId.value) return "";
  return (
    props.spaces.find((space) => space.id === selectedRelationSpaceId.value)?.title ?? "Space"
  );
});

function reset() {
  step.value = "types";
  selectedType.value = null;
  selectedRelationSpaceId.value = null;
  propertyName.value = "";
  direction.value = "forward";
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) reset();
  },
);

function onSelectType(event: Event, type: PropertyType) {
  event.preventDefault();
  direction.value = "forward";
  selectedType.value = type;
  if (type === "relation") {
    selectedRelationSpaceId.value = props.currentSpaceId ?? null;
    step.value = "relation-space";
    return;
  }
  step.value = "name";
}

function onSelectRelationSpace(spaceId: SpaceId) {
  direction.value = "forward";
  selectedRelationSpaceId.value = spaceId;
  step.value = "name";
}

function goBack(event: Event) {
  event.preventDefault();
  direction.value = "back";
  if (step.value === "name") {
    step.value = selectedType.value === "relation" ? "relation-space" : "types";
    return;
  }
  if (step.value === "relation-space") {
    step.value = "types";
  }
}

function submitName(event: Event) {
  event.preventDefault();
  const name = propertyName.value.trim();
  if (!name || !selectedType.value) return;
  emit("addProperty", {
    name,
    type: selectedType.value,
    relationSpaceId:
      selectedType.value === "relation"
        ? (selectedRelationSpaceId.value ?? props.currentSpaceId ?? null)
        : undefined,
    allowMultiple: selectedType.value === "relation" ? true : undefined,
  });
  emit("update:open", false);
}
</script>

<template>
  <DropdownMenuContent align="start" class="w-60">
    <div
      :key="step"
      class="overflow-hidden"
      :class="
        direction === 'forward'
          ? 'animate-in duration-150 fade-in slide-in-from-right-4'
          : 'animate-in duration-150 fade-in slide-in-from-left-4'
      "
    >
      <template v-if="step === 'types'">
        <DropdownMenuLabel class="text-xs font-medium text-muted-foreground">
          Property Types
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-for="item in propertyTypes"
          :key="item.type"
          class="flex items-start gap-2.5 py-2"
          @select="onSelectType($event, item.type)"
        >
          <PropertyTypeIcon :type="item.type" class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div class="min-w-0 flex flex-col gap-0.5">
            <span class="text-xs font-medium leading-tight text-foreground">{{ item.label }}</span>
            <span class="text-[11px] leading-snug text-muted-foreground">{{ item.description }}</span>
          </div>
        </DropdownMenuItem>
      </template>

      <template v-else-if="step === 'relation-space'">
        <DropdownMenuItem class="text-xs" @select="goBack">
          <ArrowLeftIcon class="size-3.5" />
          Property types
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <RelationSpacePickerMenu
          :key="currentSpaceId ?? 'no-space'"
          :spaces="spaces"
          :current-space-id="currentSpaceId"
          :selected-space-id="selectedRelationSpaceId"
          @explore="emit('exploreSpace', $event)"
          @select="onSelectRelationSpace"
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="flex items-center justify-between text-xs"
          :disabled="!selectedRelationSpaceId"
          @select="
            (event: Event) => {
              event.preventDefault();
              if (selectedRelationSpaceId) onSelectRelationSpace(selectedRelationSpaceId);
            }
          "
        >
          <span>Continue with selected space</span>
          <ChevronRightIcon class="size-3.5 text-muted-foreground" />
        </DropdownMenuItem>
      </template>

      <template v-else>
        <DropdownMenuItem class="text-xs" @select="goBack">
          <ArrowLeftIcon class="size-3.5" />
          {{ selectedType === "relation" ? selectedSpaceTitle : "Property types" }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div class="space-y-2 px-3 py-1.5">
          <DropdownMenuLabel class="flex items-center gap-2 px-0 py-0 text-xs font-medium text-muted-foreground">
            <PropertyTypeIcon v-if="selectedType" :type="selectedType" class="size-3.5" />
            <span class="capitalize">{{ selectedTypeLabel }}</span>
          </DropdownMenuLabel>
          <form @submit="submitName">
            <Input
              v-model="propertyName"
              placeholder="Property name"
              class="h-8 text-xs"
              autofocus
              @keydown.stop
              @pointerdown.stop
            />
            <button type="submit" class="sr-only">Create property</button>
          </form>
          <DropdownMenuItem
            class="justify-center text-xs font-medium"
            :disabled="!propertyName.trim()"
            @select="submitName"
          >
            Create property
          </DropdownMenuItem>
        </div>
      </template>
    </div>
  </DropdownMenuContent>
</template>
