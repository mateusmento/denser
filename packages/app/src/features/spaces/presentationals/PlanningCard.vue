<script setup lang="ts">
import type { ArtifactId, ArtifactSummary, DocumentTypeView, SpaceMember } from "@denser/contracts";
import { computed } from "vue";
import DocumentCard from "./DocumentCard.vue";
import IssueCard from "./IssueCard.vue";

const props = defineProps<{
  document: ArtifactSummary;
  documentTypes: readonly DocumentTypeView[];
  members: readonly SpaceMember[];
  variant: "backlog" | "board";
  relationTitles?: Partial<Record<ArtifactId, string>>;
  preview?: boolean;
}>();

const schema = computed(() => {
  const byId = props.document.documentTypeId
    ? props.documentTypes.find((type) => type.id === props.document.documentTypeId)
    : undefined;
  const byKey =
    byId == null && props.document.documentTypeKey
      ? props.documentTypes.find((type) => type.key === props.document.documentTypeKey)
      : undefined;
  return (byId ?? byKey)?.properties ?? [];
});
</script>

<template>
  <IssueCard
    v-if="document.documentTypeKey === 'issue'"
    :document="document"
    :schema="schema"
    :members="members"
    :variant="variant"
    :relation-titles="relationTitles"
    :preview="preview"
  />
  <DocumentCard
    v-else
    :document="document"
    :schema="schema"
    :members="members"
    :variant="variant"
    :relation-titles="relationTitles"
    :preview="preview"
  />
</template>
