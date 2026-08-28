<script setup lang="ts">
import { SEED_USER_ALICE, SEED_USER_BOB } from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceMembersPanel from "../presentationals/SpaceMembersPanel.vue";
import type { SpaceMembersView } from "../types";

const { Story } = defineMeta({
  title: "features/spaces/SpaceMembersPanel",
  component: SpaceMembersPanel,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";

const rootView: SpaceMembersView = {
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

const nestedView: SpaceMembersView = {
  ...rootView,
  isNested: true,
  visibility: "public",
};

const publicRootView: SpaceMembersView = {
  members: [],
  canManage: true,
  isNested: false,
  visibility: "public",
  isUpdatingVisibility: false,
  isAddingMember: false,
  removingMemberId: null,
};
</script>

<template>
  <Story as-child name="RootManageable">
    <SpaceMembersPanel
      :view="rootView"
      @add-member="action('addMember')()"
      @remove-member="action('removeMember')($event)"
      @update-visibility="action('updateVisibility')($event)"
    />
  </Story>
  <Story as-child name="NestedPublic">
    <SpaceMembersPanel
      :view="nestedView"
      @add-member="action('addMember')()"
      @remove-member="action('removeMember')($event)"
      @update-visibility="action('updateVisibility')($event)"
    />
  </Story>

  <Story as-child name="PublicHomeFolder">
    <SpaceMembersPanel
      :view="publicRootView"
      @add-member="action('addMember')()"
      @remove-member="action('removeMember')($event)"
      @update-visibility="action('updateVisibility')($event)"
    />
  </Story>

  <Story as-child name="Loading">
    <SpaceMembersPanel loading />
  </Story>
</template>
