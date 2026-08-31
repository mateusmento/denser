<script setup lang="ts">
import { ref } from "vue";
import { SEED_USER_ALICE, SEED_USER_BOB } from "@denser/contracts";
import { Button } from "@denser/design-system";
import { SpaceGeneralPanel } from "@/modules/spaces";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceMembersPanel from "../presentationals/SpaceMembersPanel.vue";
import SpaceSettingsDialog from "../presentationals/SpaceSettingsDialog.vue";
import type { SpaceMembersView, SpaceSettingsSection } from "../types";
import type { SpaceGeneralView } from "@/modules/spaces";

const { Story } = defineMeta({
  title: "features/spaces/SpaceSettingsDialog",
  component: SpaceSettingsDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

const open = ref(true);
const activeSection = ref<SpaceSettingsSection>("members");

const now = "2026-01-01T00:00:00.000Z";

const membersView: SpaceMembersView = {
  members: [
    {
      userId: SEED_USER_ALICE,
      name: "Alice Chen",
      username: "alice",
      role: "owner",
      createdAt: now,
    },
    {
      userId: SEED_USER_BOB,
      name: "Bob Rivera",
      username: "bob",
      role: "member",
      createdAt: now,
    },
  ],
  canManage: true,
  isNested: false,
  visibility: "private",
  isUpdatingVisibility: false,
  isAddingMember: false,
  removingMemberId: null,
};

const generalView: SpaceGeneralView = {
  title: "Acme",
  icon: "briefcase",
  canManage: true,
  isSaving: false,
};
</script>

<template>
  <Story as-child name="General">
    <Button @click="open = true">Open settings</Button>
    <SpaceSettingsDialog v-model:open="open" title="Acme" active-section="general">
      <SpaceGeneralPanel :view="generalView" @save="action('save')($event)" />
    </SpaceSettingsDialog>
  </Story>

  <Story as-child name="Members">
    <Button @click="open = true">Open settings</Button>
    <SpaceSettingsDialog
      v-model:open="open"
      title="Acme"
      :active-section="activeSection"
      @update:active-section="activeSection = $event"
    >
      <SpaceMembersPanel
        :view="membersView"
        @add-member="action('addMember')()"
        @remove-member="action('removeMember')($event)"
        @update-visibility="action('updateVisibility')($event)"
      />
    </SpaceSettingsDialog>
  </Story>
</template>
