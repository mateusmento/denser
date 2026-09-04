<script setup lang="ts">
import { DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref, computed } from "vue";
import { issuePropertiesSchema, samplePropertyValues } from "../fixtures";
import { toDocumentPropertiesView } from "../lib/document-properties-view";
import DocumentPropertiesPanel from "../presentationals/DocumentPropertiesPanel.vue";

const { Story } = defineMeta({
  title: "features/document/DocumentPropertiesPanel",
  component: DocumentPropertiesPanel,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const values = ref({ ...samplePropertyValues });

const editableView = computed(() =>
  toDocumentPropertiesView({
    schema: issuePropertiesSchema,
    values: values.value,
    canManage: true,
    supportsPropertySchema: true,
    editable: true,
    members: [],
    relationSpaces: [],
    relationDocumentsBySpaceId: {},
  }),
);

function onUpdateValue(key: string, value: unknown) {
  values.value = { ...values.value, [key]: value };
  action("updateValue")(key, value);
}
</script>

<template>
  <Story as-child name="Editable">
    <DocumentPropertiesPanel
      :view="editableView"
      @update-value="onUpdateValue"
      @add-property="action('addProperty')($event)"
      @delete-property="action('deleteProperty')($event)"
      @rename-property="action('renameProperty')($event)"
      @duplicate-property="action('duplicateProperty')($event)"
      @edit-property="action('editProperty')($event)"
      @create-option-and-select="action('createOptionAndSelect')($event)"
      @load-relation-documents="action('loadRelationDocuments')($event)"
      @explore-relation-space="action('exploreRelationSpace')($event)"
    />
  </Story>

  <Story as-child name="EmptySchema">
    <DocumentPropertiesPanel
      :view="
        toDocumentPropertiesView({
          schema: [],
          values: {},
          canManage: true,
          supportsPropertySchema: true,
          editable: true,
          members: [],
          relationSpaces: [],
          relationDocumentsBySpaceId: {},
        })
      "
      @add-property="action('addProperty')($event)"
    />
  </Story>

  <Story as-child name="ReadOnly">
    <DocumentPropertiesPanel
      :view="
        toDocumentPropertiesView({
          schema: issuePropertiesSchema,
          values: samplePropertyValues,
          canManage: false,
          supportsPropertySchema: true,
          editable: false,
          members: [],
          relationSpaces: [],
          relationDocumentsBySpaceId: {},
        })
      "
    />
  </Story>
</template>
