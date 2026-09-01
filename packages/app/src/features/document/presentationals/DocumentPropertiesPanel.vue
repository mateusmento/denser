<script setup lang="ts">
import type {
  ArtifactId,
  ArtifactSummary,
  PropertyDefinition,
  PropertyOption,
  SpaceId,
  SpaceMember,
} from "@denser/contracts";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  PropertyList,
  PropertyRow,
} from "@denser/design-system";
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  UserIcon,
  XIcon,
} from "@lucide/vue";
import { computed, ref, watch } from "vue";
import PropertyAddMenu, { type AddPropertyPayload } from "./PropertyAddMenu.vue";
import PropertyOptionPickerMenu from "./PropertyOptionPickerMenu.vue";
import RelationDocumentPickerMenu from "./RelationDocumentPickerMenu.vue";
import type { SpaceMoveNode } from "@/modules/spaces/lib/space-move-menu";

const props = withDefaults(
  defineProps<{
    properties?: PropertyDefinition[];
    values?: Record<string, unknown>;
    canManage?: boolean;
    editable?: boolean;
    members?: SpaceMember[];
    currentSpaceId?: SpaceId | null;
    currentDocumentId?: ArtifactId | null;
    relationSpaces?: readonly SpaceMoveNode[];
    getRelationDocuments?: (spaceId: SpaceId) => Promise<ArtifactSummary[]>;
    onExploreRelationSpace?: (spaceId: string) => void | Promise<void>;
  }>(),
  {
    properties: () => [],
    values: () => ({}),
    canManage: true,
    editable: true,
    members: () => [],
    relationSpaces: () => [],
  },
);

const emit = defineEmits<{
  updateValue: [key: string, value: unknown];
  addProperty: [payload: AddPropertyPayload];
  deleteProperty: [propertyId: string];
  renameProperty: [propertyId: string, newName: string];
  duplicateProperty: [propertyId: string];
  editProperty: [property: PropertyDefinition];
}>();

const addPropertyOpen = ref(false);
const optionPickerOpen = ref<Record<string, boolean>>({});
const relationPickerOpen = ref<Record<string, boolean>>({});
const relationDocuments = ref<Record<string, ArtifactSummary[]>>({});
const relationDocumentsLoading = ref<Record<string, boolean>>({});

const renameDialogOpen = ref(false);
const renamingProperty = ref<PropertyDefinition | null>(null);
const renameValue = ref("");

const editDialogOpen = ref(false);
const editingProperty = ref<PropertyDefinition | null>(null);
const editingOptions = ref<{ id: string; name: string; color?: string }[]>([]);
const newOptionName = ref("");

const OPTION_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

function selectedOptionNames(key: string): string[] {
  const raw = props.values[key];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

function optionColor(prop: PropertyDefinition, name: string): string | undefined {
  return prop.options?.find((opt) => opt.name === name)?.color;
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
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = prop.options ?? [];
  if (existing.some((opt) => opt.name.toLowerCase() === trimmed.toLowerCase())) {
    onSelectOption(prop, existing.find((opt) => opt.name.toLowerCase() === trimmed.toLowerCase())!);
    return;
  }
  const option: PropertyOption = {
    id: `opt-${crypto.randomUUID()}`,
    name: trimmed,
    color: OPTION_COLORS[existing.length % OPTION_COLORS.length],
  };
  emit("editProperty", {
    ...prop,
    options: [...existing, option],
  });
  onSelectOption(prop, option);
}

function onOptionPickerOpenChange(key: string, open: boolean) {
  optionPickerOpen.value = { ...optionPickerOpen.value, [key]: open };
}

function onNumberInput(key: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const num = target.value === "" ? null : Number(target.value);
  emit("updateValue", key, num);
}

function onTextInput(key: string, event: Event) {
  const target = event.target as HTMLInputElement;
  emit("updateValue", key, target.value);
}

function relationIds(key: string): ArtifactId[] {
  const raw = props.values[key];
  if (Array.isArray(raw)) return raw as ArtifactId[];
  if (typeof raw === "string" && raw) return [raw as ArtifactId];
  return [];
}

function relationTitle(documentId: ArtifactId, prop: PropertyDefinition): string {
  const spaceId = prop.relationSpaceId;
  if (!spaceId) return documentId;
  const docs = relationDocuments.value[spaceId] ?? [];
  return docs.find((doc) => doc.id === documentId)?.title || "Untitled";
}

function relationSpaceTitle(spaceId: SpaceId | null | undefined): string {
  if (!spaceId) return "Space";
  return props.relationSpaces.find((space) => space.id === spaceId)?.title ?? "Space";
}

async function ensureRelationDocuments(prop: PropertyDefinition) {
  const spaceId = prop.relationSpaceId;
  if (!spaceId || !props.getRelationDocuments) return;
  if (relationDocuments.value[spaceId]) return;
  relationDocumentsLoading.value = { ...relationDocumentsLoading.value, [spaceId]: true };
  try {
    const docs = await props.getRelationDocuments(spaceId);
    relationDocuments.value = { ...relationDocuments.value, [spaceId]: docs };
  } finally {
    relationDocumentsLoading.value = { ...relationDocumentsLoading.value, [spaceId]: false };
  }
}

function onRelationPickerOpenChange(prop: PropertyDefinition, open: boolean) {
  relationPickerOpen.value = { ...relationPickerOpen.value, [prop.key]: open };
  if (open) {
    void ensureRelationDocuments(prop);
  }
}

function onSelectRelation(prop: PropertyDefinition, documentId: ArtifactId) {
  const current = relationIds(prop.key);
  const next = prop.allowMultiple === false ? [documentId] : [...current, documentId];
  emit("updateValue", prop.key, prop.allowMultiple === false ? documentId : next);
}

function onRemoveRelation(prop: PropertyDefinition, documentId: ArtifactId) {
  const current = relationIds(prop.key);
  const next = current.filter((id) => id !== documentId);
  emit(
    "updateValue",
    prop.key,
    prop.allowMultiple === false ? (next[0] ?? null) : next,
  );
}

function onRemoveRelationChip(prop: PropertyDefinition, documentId: ArtifactId) {
  onRemoveRelation(prop, documentId);
}

watch(
  () => props.properties.filter((prop) => prop.type === "relation" && prop.relationSpaceId),
  (relationProps) => {
    for (const prop of relationProps) {
      if (prop.relationSpaceId && relationIds(prop.key).length > 0) {
        void ensureRelationDocuments(prop);
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
  editingOptions.value = property.options ? [...property.options] : [];
  newOptionName.value = "";
  editDialogOpen.value = true;
}

function addEditingOption() {
  const name = newOptionName.value.trim();
  if (!name) return;
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
  const color = colors[editingOptions.value.length % colors.length];
  editingOptions.value.push({
    id: `opt-${Date.now()}`,
    name,
    color,
  });
  newOptionName.value = "";
}

function removeEditingOption(id: string) {
  editingOptions.value = editingOptions.value.filter((o) => o.id !== id);
}

function submitEdit() {
  if (editingProperty.value) {
    emit("editProperty", {
      ...editingProperty.value,
      options: editingOptions.value,
    });
    editDialogOpen.value = false;
  }
}

const activeProperties = computed<PropertyDefinition[]>(() => {
  if (props.properties && props.properties.length > 0) {
    return props.properties;
  }
  return [
    {
      id: "prop-priority" as any,
      key: "priority",
      name: "Priority",
      type: "select" as const,
      required: false,
      options: [
        { id: "urgent", name: "Urgent", color: "#ef4444" },
        { id: "high", name: "High", color: "#f97316" },
        { id: "medium", name: "Medium", color: "#eab308" },
        { id: "low", name: "Low", color: "#3b82f6" },
      ],
      order: 0,
    },
    {
      id: "prop-assignee" as any,
      key: "assignee",
      name: "Assignee",
      type: "person" as const,
      required: false,
      order: 1,
    },
    {
      id: "prop-labels" as any,
      key: "labels",
      name: "Labels",
      type: "multi_select" as const,
      required: false,
      options: [
        { id: "frontend", name: "Frontend", color: "#8b5cf6" },
        { id: "backend", name: "Backend", color: "#06b6d4" },
        { id: "design", name: "Design", color: "#ec4899" },
        { id: "bug", name: "Bug", color: "#ef4444" },
      ],
      order: 2,
    },
    {
      id: "prop-estimate" as any,
      key: "estimate",
      name: "Estimate",
      type: "number" as const,
      required: false,
      order: 3,
    },
  ];
});
</script>

<template>
  <div class="border-b border-border/60 pb-3" data-slot="document-properties-panel">
    <PropertyList :can-manage="canManage">
      <template #add-property>
        <DropdownMenu v-model:open="addPropertyOpen">
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground outline-none select-none"
            >
              <PlusIcon class="size-3.5" />
              Add a property
            </button>
          </DropdownMenuTrigger>
          <PropertyAddMenu
            v-model:open="addPropertyOpen"
            :spaces="relationSpaces"
            :current-space-id="currentSpaceId"
            @add-property="emit('addProperty', $event)"
            @explore-space="onExploreRelationSpace?.($event)"
          />
        </DropdownMenu>
      </template>

      <PropertyRow
        v-for="prop in activeProperties"
        :key="prop.id"
        :property="prop"
        :can-manage="canManage"
        @edit="startEdit(prop)"
        @rename="startRename(prop)"
        @duplicate="emit('duplicateProperty', prop.id)"
        @delete="emit('deleteProperty', prop.id)"
      >
        <!-- Select / Single Option (e.g. Priority) -->
        <template v-if="prop.type === 'select'">
          <DropdownMenu
            v-if="editable"
            :open="optionPickerOpen[prop.key] ?? false"
            @update:open="onOptionPickerOpenChange(prop.key, $event)"
          >
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted transition-colors outline-none"
              >
                <span
                  v-if="values[prop.key]"
                  class="size-1.5 rounded-full"
                  :style="{
                    backgroundColor: optionColor(prop, String(values[prop.key])) ?? 'var(--primary)',
                  }"
                />
                <span>{{ values[prop.key] || "Empty" }}</span>
                <ChevronDownIcon class="size-3 text-muted-foreground ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <PropertyOptionPickerMenu
              :open="optionPickerOpen[prop.key] ?? false"
              :options="prop.options ?? []"
              :selected-names="selectedOptionNames(prop.key)"
              placeholder="Search options…"
              @update:open="onOptionPickerOpenChange(prop.key, $event)"
              @select="onSelectOption(prop, $event)"
              @remove="onRemoveOption(prop, $event)"
              @create="onCreateOption(prop, $event)"
            />
          </DropdownMenu>
          <span v-else class="text-xs text-muted-foreground">{{ values[prop.key] || "Empty" }}</span>
        </template>

        <!-- Multi-Select (e.g. Labels) -->
        <template v-else-if="prop.type === 'multi_select'">
          <div class="flex flex-wrap items-center gap-1">
            <Badge
              v-for="tag in selectedOptionNames(prop.key)"
              :key="tag"
              variant="secondary"
              class="gap-1 text-xs py-0 h-5"
            >
              <span
                v-if="optionColor(prop, tag)"
                class="size-1.5 rounded-full"
                :style="{ backgroundColor: optionColor(prop, tag) }"
              />
              <span>{{ tag }}</span>
              <button
                v-if="editable"
                type="button"
                class="rounded-full hover:bg-muted-foreground/20 p-0.5"
                @click="onRemoveOption(prop, tag)"
              >
                <XIcon class="size-2.5" />
              </button>
            </Badge>

            <DropdownMenu
              v-if="editable"
              :open="optionPickerOpen[prop.key] ?? false"
              @update:open="onOptionPickerOpenChange(prop.key, $event)"
            >
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <PlusIcon class="size-3" />
                  {{ selectedOptionNames(prop.key).length ? "Add" : "Empty" }}
                </button>
              </DropdownMenuTrigger>
              <PropertyOptionPickerMenu
                :open="optionPickerOpen[prop.key] ?? false"
                :options="prop.options ?? []"
                :selected-names="selectedOptionNames(prop.key)"
                allow-multiple
                placeholder="Search or create…"
                @update:open="onOptionPickerOpenChange(prop.key, $event)"
                @select="onSelectOption(prop, $event)"
                @remove="onRemoveOption(prop, $event)"
                @create="onCreateOption(prop, $event)"
              />
            </DropdownMenu>

            <span
              v-else-if="!selectedOptionNames(prop.key).length"
              class="text-xs text-muted-foreground"
            >
              Empty
            </span>
          </div>
        </template>

        <!-- Person (Assignee / Members) -->
        <template v-else-if="prop.type === 'person'">
          <DropdownMenu v-if="editable && members.length > 0">
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-foreground hover:bg-muted transition-colors outline-none"
              >
                <UserIcon class="size-3.5 text-muted-foreground" />
                <span>{{ values[prop.key] || "Unassigned" }}</span>
                <ChevronDownIcon class="size-3 text-muted-foreground ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-44">
              <DropdownMenuItem @select="emit('updateValue', prop.key, null)">
                <span class="text-xs text-muted-foreground">Unassigned</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                v-for="member in members"
                :key="member.userId"
                class="flex items-center justify-between text-xs"
                @select="emit('updateValue', prop.key, member.name || member.username)"
              >
                <span>{{ member.name || member.username }}</span>
                <CheckIcon
                  v-if="values[prop.key] === (member.name || member.username)"
                  class="size-3.5 text-primary"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            v-else-if="editable"
            :value="(values[prop.key] as string) ?? ''"
            placeholder="Assignee name..."
            class="h-6 w-48 border-transparent hover:border-border focus:border-border bg-transparent px-1.5 text-xs shadow-none"
            @change="onTextInput(prop.key, $event)"
          />
          <span v-else class="text-xs text-foreground">{{ values[prop.key] || "Unassigned" }}</span>
        </template>

        <!-- Number (Estimate) -->
        <template v-else-if="prop.type === 'number'">
          <Input
            v-if="editable"
            type="number"
            :value="values[prop.key] ?? ''"
            placeholder="0"
            class="h-6 w-24 border-transparent hover:border-border focus:border-border bg-transparent px-1.5 font-mono text-xs shadow-none"
            @change="onNumberInput(prop.key, $event)"
          />
          <span v-else class="text-xs font-mono text-foreground">{{ values[prop.key] ?? "—" }}</span>
        </template>

        <!-- Relation -->
        <template v-else-if="prop.type === 'relation'">
          <div class="flex flex-wrap items-center gap-1">
            <Badge
              v-for="documentId in relationIds(prop.key)"
              :key="documentId"
              variant="secondary"
              class="gap-1 text-xs py-0 h-5"
            >
              <span>{{ relationTitle(documentId, prop) }}</span>
              <button
                v-if="editable"
                type="button"
                class="rounded-full hover:bg-muted-foreground/20 p-0.5"
                @click="onRemoveRelationChip(prop, documentId)"
              >
                <XIcon class="size-2.5" />
              </button>
            </Badge>

            <DropdownMenu
              v-if="editable && prop.relationSpaceId"
              :open="relationPickerOpen[prop.key] ?? false"
              @update:open="onRelationPickerOpenChange(prop, $event)"
            >
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <PlusIcon class="size-3" />
                  {{ relationIds(prop.key).length ? "Add" : "Empty" }}
                </button>
              </DropdownMenuTrigger>
              <RelationDocumentPickerMenu
                :open="relationPickerOpen[prop.key] ?? false"
                :documents="relationDocuments[prop.relationSpaceId] ?? []"
                :selected-ids="relationIds(prop.key)"
                :allow-multiple="prop.allowMultiple !== false"
                :exclude-document-id="currentDocumentId"
                :loading="relationDocumentsLoading[prop.relationSpaceId] ?? false"
                :space-title="relationSpaceTitle(prop.relationSpaceId)"
                @update:open="onRelationPickerOpenChange(prop, $event)"
                @select="onSelectRelation(prop, $event)"
                @remove="onRemoveRelation(prop, $event)"
              />
            </DropdownMenu>

            <span
              v-else-if="!editable && !relationIds(prop.key).length"
              class="text-xs text-muted-foreground"
            >
              Empty
            </span>
          </div>
        </template>

        <!-- Text / Other -->
        <template v-else>
          <Input
            v-if="editable"
            :value="(values[prop.key] as string) ?? ''"
            placeholder="Empty"
            class="h-6 border-transparent hover:border-border focus:border-border bg-transparent px-1.5 text-xs shadow-none"
            @change="onTextInput(prop.key, $event)"
          />
          <span v-else class="text-xs text-foreground">{{ values[prop.key] || "—" }}</span>
        </template>
      </PropertyRow>
    </PropertyList>

    <!-- Rename Property Dialog -->
    <Dialog v-model:open="renameDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Property</DialogTitle>
          <DialogDescription>
            Enter a new display name for this property.
          </DialogDescription>
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

    <!-- Edit Property Options Dialog -->
    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {{ editingProperty?.name }} Options</DialogTitle>
          <DialogDescription>
            Add, customize, or remove available options for this property.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-3 py-2">
          <div class="flex items-center gap-2">
            <Input
              v-model="newOptionName"
              placeholder="New option name..."
              class="h-8 text-xs"
              @keydown.enter.prevent="addEditingOption"
            />
            <Button size="sm" variant="secondary" @click="addEditingOption">Add Option</Button>
          </div>
          <div class="max-h-48 space-y-1.5 overflow-y-auto pt-1">
            <div
              v-for="opt in editingOptions"
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
                @click="removeEditingOption(opt.id)"
              >
                <XIcon class="size-3.5" />
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editDialogOpen = false">Cancel</Button>
          <Button @click="submitEdit">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
