<script setup lang="ts">
import type { ArtifactId, PropertyDefinition, PropertyOption, SpaceId } from "@denser/contracts";
import { propertyDefinitionHasEditor, sanitizePropertyDefinition } from "@denser/contracts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuTrigger,
  Input,
  Label,
  PropertyList,
  PropertyRow,
} from "@denser/design-system";
import { PlusIcon } from "@lucide/vue";
import { ref, watch } from "vue";
import type { DocumentPropertiesView } from "../types";
import PropertyAddMenu, { type AddPropertyPayload } from "./PropertyAddMenu.vue";
import PropertyDefinitionEditDialog from "./PropertyDefinitionEditDialog.vue";
import PropertyDateValue from "./PropertyDateValue.vue";
import PropertyMultiSelectValue from "./PropertyMultiSelectValue.vue";
import PropertyPersonValue from "./PropertyPersonValue.vue";
import PropertyRelationValue from "./PropertyRelationValue.vue";
import PropertyScalarValue from "./PropertyScalarValue.vue";
import PropertySelectValue from "./PropertySelectValue.vue";

const props = defineProps<{
  view: DocumentPropertiesView;
}>();

const emit = defineEmits<{
  updateValue: [key: string, value: unknown];
  addProperty: [payload: AddPropertyPayload];
  deleteProperty: [propertyId: string];
  renameProperty: [propertyId: string, newName: string];
  duplicateProperty: [propertyId: string];
  editProperty: [property: PropertyDefinition];
  createOptionAndSelect: [property: PropertyDefinition, name: string];
  loadRelationDocuments: [spaceId: SpaceId];
  exploreRelationSpace: [spaceId: string];
}>();

const addPropertyOpen = ref(false);
const optionPickerOpen = ref<Record<string, boolean>>({});
const relationPickerOpen = ref<Record<string, boolean>>({});
const personPickerOpen = ref<Record<string, boolean>>({});

const renameDialogOpen = ref(false);
const renamingProperty = ref<PropertyDefinition | null>(null);
const renameValue = ref("");

const editDialogOpen = ref(false);
const editingProperty = ref<PropertyDefinition | null>(null);

function selectedOptionNames(key: string): string[] {
  const raw = props.view.values[key];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

function onSelectOption(prop: PropertyDefinition, option: PropertyOption) {
  if (prop.type === "multi_select") {
    const current = selectedOptionNames(prop.key);
    if (current.includes(option.name)) return;
    emit("updateValue", prop.key, [...current, option.name]);
    return;
  }
  emit("updateValue", prop.key, option.name);
}

function onRemoveOption(prop: PropertyDefinition, optionName: string) {
  if (prop.type === "multi_select") {
    emit(
      "updateValue",
      prop.key,
      selectedOptionNames(prop.key).filter((name) => name !== optionName),
    );
    return;
  }
  emit("updateValue", prop.key, null);
}

function onCreateOption(prop: PropertyDefinition, name: string) {
  emit("createOptionAndSelect", prop, name);
}

function relationIds(key: string): ArtifactId[] {
  const raw = props.view.values[key];
  if (Array.isArray(raw)) return raw as ArtifactId[];
  if (typeof raw === "string" && raw) return [raw as ArtifactId];
  return [];
}

function relationSpaceTitle(spaceId: SpaceId | null | undefined): string {
  if (!spaceId) return "Space";
  return props.view.relationSpaces.find((space) => space.id === spaceId)?.title ?? "Space";
}

function onSelectRelation(prop: PropertyDefinition, documentId: ArtifactId) {
  if (prop.type !== "relation") return;
  const current = relationIds(prop.key);
  emit(
    "updateValue",
    prop.key,
    prop.allowMultiple === false ? documentId : [...current, documentId],
  );
}

function onRemoveRelation(prop: PropertyDefinition, documentId: ArtifactId) {
  if (prop.type !== "relation") return;
  const current = relationIds(prop.key);
  const next = current.filter((id) => id !== documentId);
  emit(
    "updateValue",
    prop.key,
    prop.allowMultiple === false ? (next[0] ?? null) : next,
  );
}

watch(
  () => props.view.schema.filter((prop) => prop.type === "relation"),
  (relationProps) => {
    for (const prop of relationProps) {
      if (prop.relationSpaceId && relationIds(prop.key).length > 0) {
        emit("loadRelationDocuments", prop.relationSpaceId);
      }
    }
  },
  { immediate: true },
);

function startRename(property: PropertyDefinition) {
  renamingProperty.value = property;
  renameValue.value = property.name;
  renameDialogOpen.value = true;
}

function submitRename() {
  if (renamingProperty.value && renameValue.value.trim()) {
    emit("renameProperty", renamingProperty.value.id, renameValue.value.trim());
    renameDialogOpen.value = false;
  }
}

function startEdit(property: PropertyDefinition) {
  editingProperty.value = property;
  editDialogOpen.value = true;
}

function submitEdit(property: PropertyDefinition) {
  emit("editProperty", sanitizePropertyDefinition(property));
  editDialogOpen.value = false;
  editingProperty.value = null;
}
</script>

<template>
  <div class="border-b border-border/60 pb-3" data-slot="document-properties-panel">
    <PropertyList :can-manage="view.canManage">
      <template #add-property>
        <DropdownMenu v-if="view.canManage" v-model:open="addPropertyOpen">
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none select-none hover:bg-muted/70 hover:text-foreground"
            >
              <PlusIcon class="size-3.5" />
              Add a property
            </button>
          </DropdownMenuTrigger>
          <PropertyAddMenu
            v-model:open="addPropertyOpen"
            :spaces="view.relationSpaces"
            :current-space-id="view.currentSpaceId"
            @add-property="emit('addProperty', $event)"
            @explore-space="emit('exploreRelationSpace', $event)"
          />
        </DropdownMenu>
      </template>

      <PropertyRow
        v-for="prop in view.schema"
        :key="prop.id"
        :property="prop"
        :can-manage="view.canManage"
        :show-edit="propertyDefinitionHasEditor(prop.type)"
        @edit="startEdit(prop)"
        @rename="startRename(prop)"
        @duplicate="emit('duplicateProperty', prop.id)"
        @delete="emit('deleteProperty', prop.id)"
      >
        <PropertySelectValue
          v-if="prop.type === 'select'"
          :prop="prop"
          :value="view.values[prop.key]"
          :editable="view.editable"
          :open="optionPickerOpen[prop.key] ?? false"
          @update:open="optionPickerOpen[prop.key] = $event"
          @select="onSelectOption(prop, $event)"
          @remove="onRemoveOption(prop, $event)"
          @create="onCreateOption(prop, $event)"
        />

        <PropertyMultiSelectValue
          v-else-if="prop.type === 'multi_select'"
          :prop="prop"
          :value="view.values[prop.key]"
          :editable="view.editable"
          :open="optionPickerOpen[prop.key] ?? false"
          @update:open="optionPickerOpen[prop.key] = $event"
          @select="onSelectOption(prop, $event)"
          @remove="onRemoveOption(prop, $event)"
          @create="onCreateOption(prop, $event)"
        />

        <PropertyPersonValue
          v-else-if="prop.type === 'person'"
          :prop="prop"
          :value="view.values[prop.key]"
          :editable="view.editable"
          :members="view.members"
          :open="personPickerOpen[prop.key] ?? false"
          @update:open="personPickerOpen[prop.key] = $event"
          @update="emit('updateValue', prop.key, $event)"
        />

        <PropertyDateValue
          v-else-if="prop.type === 'date'"
          :prop="prop"
          :value="view.values[prop.key]"
          :editable="view.editable"
          @update="emit('updateValue', prop.key, $event)"
        />

        <PropertyScalarValue
          v-else-if="prop.type === 'number'"
          type="number"
          :value="view.values[prop.key]"
          :editable="view.editable"
          placeholder="0"
          empty-label="—"
          @update="emit('updateValue', prop.key, $event)"
        />

        <PropertyRelationValue
          v-else-if="prop.type === 'relation'"
          :prop="prop"
          :value="view.values[prop.key]"
          :editable="view.editable"
          :open="relationPickerOpen[prop.key] ?? false"
          :current-document-id="view.currentDocumentId"
          :relation-entry="
            prop.relationSpaceId
              ? view.relationDocumentsBySpaceId[prop.relationSpaceId]
              : undefined
          "
          :space-title="relationSpaceTitle(prop.relationSpaceId)"
          @update:open="relationPickerOpen[prop.key] = $event"
          @load-documents="
            prop.relationSpaceId && emit('loadRelationDocuments', prop.relationSpaceId)
          "
          @select="onSelectRelation(prop, $event)"
          @remove="onRemoveRelation(prop, $event)"
        />

        <PropertyScalarValue
          v-else
          type="text"
          :value="view.values[prop.key]"
          :editable="view.editable"
          @update="emit('updateValue', prop.key, $event)"
        />
      </PropertyRow>
    </PropertyList>

    <Dialog v-model:open="renameDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Property</DialogTitle>
          <DialogDescription>Enter a new display name for this property.</DialogDescription>
        </DialogHeader>
        <div class="space-y-2 py-2">
          <Label for="rename-prop-input">Property Name</Label>
          <Input
            id="rename-prop-input"
            v-model="renameValue"
            class="h-9"
            @keydown.enter.prevent="submitRename"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="renameDialogOpen = false">Cancel</Button>
          <Button :disabled="!renameValue.trim()" @click="submitRename">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <PropertyDefinitionEditDialog
      v-model:open="editDialogOpen"
      :property="editingProperty"
      :relation-spaces="view.relationSpaces"
      @save="submitEdit"
    />
  </div>
</template>
