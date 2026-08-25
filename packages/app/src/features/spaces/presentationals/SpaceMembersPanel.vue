<script setup lang="ts">
import type { SpaceVisibility, UserId } from "@denser/contracts";
import { Badge, Button, Label, NativeSelect, NativeSelectOption } from "@denser/design-system";
import { computed } from "vue";
import type { SpaceMembersView } from "../types";

const props = defineProps<{
  view: SpaceMembersView;
}>();

const emit = defineEmits<{
  addMember: [];
  removeMember: [userId: UserId];
  updateVisibility: [visibility: SpaceVisibility];
}>();

const visibilityModel = computed({
  get: () => props.view.visibility,
  set: (value: SpaceVisibility) => emit("updateVisibility", value),
});
</script>

<template>
  <section class="space-y-4 rounded-lg border border-border p-4" data-slot="space-members">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h2 class="text-sm font-medium">Members</h2>
        <p class="text-xs text-muted-foreground">
          Root spaces are private. Nested spaces are public folders unless marked private.
        </p>
      </div>
      <Button
        v-if="view.canManage"
        variant="outline"
        size="sm"
        :disabled="view.isAddingMember"
        @click="emit('addMember')"
      >
        {{ view.isAddingMember ? "Adding…" : "Add member" }}
      </Button>
    </div>

    <div v-if="view.isNested && view.canManage" class="space-y-2">
      <Label for="space-visibility">Visibility</Label>
      <NativeSelect
        id="space-visibility"
        v-model="visibilityModel"
        class="w-full max-w-xs"
        :disabled="view.isUpdatingVisibility"
      >
        <NativeSelectOption value="public">Public folder</NativeSelectOption>
        <NativeSelectOption value="private">Private room</NativeSelectOption>
      </NativeSelect>
    </div>

    <ul v-if="view.members.length" class="divide-y divide-border rounded-lg border border-border">
      <li
        v-for="member in view.members"
        :key="member.userId"
        class="flex items-center justify-between gap-3 px-4 py-3"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">{{ member.name }}</p>
          <p v-if="member.username" class="truncate text-xs text-muted-foreground">
            @{{ member.username }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="secondary">{{ member.role }}</Badge>
          <Button
            v-if="view.canManage"
            variant="ghost"
            size="sm"
            :disabled="view.removingMemberId === member.userId"
            @click="emit('removeMember', member.userId)"
          >
            Remove
          </Button>
        </div>
      </li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">No members yet.</p>
  </section>
</template>
