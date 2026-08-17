<script setup lang="ts">
import { Button, Skeleton } from "@denser/design-system";
import type { DocumentDraftView, DocumentSurfaceView } from "../types";
import DocumentComposer from "./DocumentComposer.vue";
import DocumentHeader from "./DocumentHeader.vue";
import PermissionEmpty from "./PermissionEmpty.vue";
import TitleEditor from "./TitleEditor.vue";

const draft = defineModel<DocumentDraftView>({ required: true });

defineProps<{
  view: DocumentSurfaceView;
  uploadImage?: (file: File) => Promise<string>;
}>();

const emit = defineEmits<{
  retry: [];
  move: [];
  share: [];
  mentionSearch: [query: string];
}>();
</script>

<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col" data-slot="document-surface">
    <div class="flex h-surface-header shrink-0 items-center">
      <DocumentHeader :header="view.header" @move="emit('move')" @share="emit('share')" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <template v-if="view.state === 'loading'">
          <Skeleton class="h-8 w-2/3" />
          <Skeleton class="h-24 w-full" />
        </template>

        <template v-else-if="view.state === 'error'">
          <p class="text-sm text-destructive">
            {{ view.errorMessage ?? "Couldn’t load this document." }}
          </p>
          <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')"> Retry </Button>
        </template>

        <PermissionEmpty v-else-if="view.state === 'forbidden'" />

        <template v-else>
          <TitleEditor
            v-model="draft.title"
            :placeholder="view.titlePlaceholder"
            :editable="view.canEdit"
          />
          <DocumentComposer
            v-model="draft.body"
            :placeholder="view.bodyPlaceholder"
            :editable="view.canEdit"
            :mention-items="view.mentionItems"
            :upload-image="uploadImage"
            @mention-search="emit('mentionSearch', $event)"
          />
        </template>
      </div>
    </div>
  </div>
</template>
