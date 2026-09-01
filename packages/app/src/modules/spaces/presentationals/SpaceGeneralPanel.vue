<script setup lang="ts">
import type { ArtifactKind, DocumentTypeId, SpaceIcon } from "@denser/contracts";
import { Button, Checkbox, Input, Label, Skeleton, cn } from "@denser/design-system";
import { computed, ref, watch } from "vue";
import { DEFAULT_SPACE_ICON, SPACE_ICON_OPTIONS } from "@/modules/spaces/lib/space-icons";
import type { SpaceGeneralView } from "@/modules/spaces/types";

const props = defineProps<{
  view?: SpaceGeneralView;
  loading?: boolean;
}>();

const emit = defineEmits<{
  save: [input: {
    title: string;
    icon: SpaceIcon;
    allowedArtifactKinds?: ArtifactKind[] | null;
    allowedDocumentTypeIds?: DocumentTypeId[] | null;
    defaultDocumentTypeId?: DocumentTypeId | null;
  }];
}>();

const title = ref("");
const icon = ref<SpaceIcon>(DEFAULT_SPACE_ICON);
const allowDocuments = ref(true);
const allowConversations = ref(true);
const selectedDocumentTypeIds = ref<string[]>([]);
const defaultDocTypeId = ref<string | null>(null);

watch(
  () => props.view,
  (view) => {
    if (!view) return;
    title.value = view.title;
    icon.value = view.icon ?? DEFAULT_SPACE_ICON;
    if (view.allowedArtifactKinds) {
      allowDocuments.value = view.allowedArtifactKinds.includes("document");
      allowConversations.value = view.allowedArtifactKinds.includes("conversation");
    } else {
      allowDocuments.value = true;
      allowConversations.value = true;
    }
    selectedDocumentTypeIds.value = view.allowedDocumentTypeIds ? [...view.allowedDocumentTypeIds] : [];
    defaultDocTypeId.value = view.defaultDocumentTypeId ?? null;
  },
  { deep: true, immediate: true },
);

const isDirty = computed(() => {
  const view = props.view;
  if (!view) return false;
  return (
    title.value.trim() !== view.title ||
    icon.value !== (view.icon ?? DEFAULT_SPACE_ICON) ||
    allowDocuments.value !== (!view.allowedArtifactKinds || view.allowedArtifactKinds.includes("document")) ||
    allowConversations.value !== (!view.allowedArtifactKinds || view.allowedArtifactKinds.includes("conversation")) ||
    JSON.stringify(selectedDocumentTypeIds.value) !== JSON.stringify(view.allowedDocumentTypeIds ?? []) ||
    defaultDocTypeId.value !== (view.defaultDocumentTypeId ?? null)
  );
});

function selectIcon(next: SpaceIcon) {
  icon.value = icon.value === next ? DEFAULT_SPACE_ICON : next;
}

function toggleDocType(typeId: string) {
  if (selectedDocumentTypeIds.value.includes(typeId)) {
    selectedDocumentTypeIds.value = selectedDocumentTypeIds.value.filter((id) => id !== typeId);
  } else {
    selectedDocumentTypeIds.value.push(typeId);
  }
}

function onSave() {
  const trimmed = title.value.trim();
  if (!trimmed) return;
  const kinds: ArtifactKind[] = [];
  if (allowDocuments.value) kinds.push("document");
  if (allowConversations.value) kinds.push("conversation");

  emit("save", {
    title: trimmed,
    icon: icon.value,
    allowedArtifactKinds: kinds.length === 2 ? null : kinds,
    allowedDocumentTypeIds: selectedDocumentTypeIds.value.length === 0 ? null : (selectedDocumentTypeIds.value as any),
    defaultDocumentTypeId: (defaultDocTypeId.value as any) ?? null,
  });
}
</script>

<template>
  <section class="space-y-6" data-slot="space-general">
    <template v-if="loading || !view">
      <Skeleton class="h-5 w-24" />
      <Skeleton class="h-4 w-full max-w-sm" />
      <Skeleton class="h-9 w-full max-w-md" />
      <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
        <Skeleton v-for="index in 8" :key="index" class="h-16 rounded-lg" />
      </div>
    </template>

    <template v-else>
      <div class="space-y-1">
        <h2 class="text-sm font-medium">General</h2>
        <p class="text-xs text-muted-foreground">
          Update how this space appears in the sidebar and gallery.
        </p>
      </div>

      <div class="space-y-2">
        <Label for="space-name">Name</Label>
        <Input
          id="space-name"
          v-model="title"
          :disabled="!view.canManage || view.isSaving"
          maxlength="200"
          placeholder="Acme"
        />
      </div>

      <div class="space-y-3">
        <Label>Icon</Label>
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
          <button
            v-for="option in SPACE_ICON_OPTIONS"
            :key="option.id"
            type="button"
            :disabled="!view.canManage || view.isSaving"
            :class="
              cn(
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors',
                icon === option.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                (!view.canManage || view.isSaving) && 'pointer-events-none opacity-50',
              )
            "
            @click="selectIcon(option.id)"
          >
            <component :is="option.icon" class="size-5" aria-hidden="true" />
            <span>{{ option.label }}</span>
          </button>
        </div>
        <p class="text-xs text-muted-foreground">
          Select an icon, or tap again to reset to the folder.
        </p>
      </div>

      <!-- Allowed Artifact Kinds -->
      <div class="space-y-3 border-t border-border pt-4">
        <div class="space-y-1">
          <Label>Allowed Artifact Types</Label>
          <p class="text-xs text-muted-foreground">
            Restrict which types of content can be created in this space.
          </p>
        </div>
        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox
              :checked="allowDocuments"
              :disabled="!view.canManage || view.isSaving"
              @update:checked="allowDocuments = $event"
            />
            <span>Documents (Issues, Specs, Docs)</span>
          </label>
          <label class="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox
              :checked="allowConversations"
              :disabled="!view.canManage || view.isSaving"
              @update:checked="allowConversations = $event"
            />
            <span>Conversations (Discussions, Channels)</span>
          </label>
        </div>
      </div>

      <!-- Allowed Document Types -->
      <div v-if="allowDocuments && (view.availableDocumentTypes?.length ?? 0) > 0" class="space-y-3 border-t border-border pt-4">
        <div class="space-y-1">
          <Label>Allowed Document Templates</Label>
          <p class="text-xs text-muted-foreground">
            Select specific document templates allowed in this space (leave unchecked to allow all).
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="dt in view.availableDocumentTypes"
            :key="dt.id"
            type="button"
            :class="
              cn(
                'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                selectedDocumentTypeIds.includes(dt.id)
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            "
            @click="toggleDocType(dt.id)"
          >
            <span>{{ dt.name }}</span>
          </button>
        </div>
      </div>

      <Button
        v-if="view.canManage"
        size="sm"
        :disabled="!isDirty || !title.trim() || view.isSaving"
        @click="onSave"
      >
        {{ view.isSaving ? "Saving…" : "Save changes" }}
      </Button>
    </template>
  </section>
</template>
