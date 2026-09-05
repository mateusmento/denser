<script setup lang="ts">
import type { SpaceVisibility, UserId } from "@denser/contracts";
import {
  Badge,
  Button,
  Label,
  NativeSelect,
  NativeSelectOption,
  Skeleton,
} from "@denser/design-system";
import { computed } from "vue";
import PresenceDot from "@/modules/presence/presentationals/PresenceDot.vue";
import type { SpaceMembersView } from "../types";

const props = defineProps<{
  view?: SpaceMembersView;
  loading?: boolean;
}>();

const emit = defineEmits<{
  addMember: [];
  removeMember: [userId: UserId];
  updateVisibility: [visibility: SpaceVisibility];
}>();

const visibilityModel = computed({
  get: () => props.view?.visibility ?? "public",
  set: (value: SpaceVisibility) => emit("updateVisibility", value),
});
</script>

<template>
  <section class="space-y-4 rounded-lg border border-border p-4" data-slot="space-members">
    <template v-if="loading || !view">
      <Skeleton class="h-5 w-24" />
      <Skeleton class="h-4 w-full max-w-sm" />
      <Skeleton class="h-24 w-full rounded-lg" />
    </template>

    <template v-else>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-sm font-medium">Members</h2>
          <p class="text-xs text-muted-foreground">
            Public spaces are folders. Make a space private to turn on membership — that cannot be
            undone.
          </p>
        </div>
        <Button
          v-if="view.canManage && (view.isNested || view.visibility === 'private')"
          variant="outline"
          size="sm"
          :disabled="view.isAddingMember"
          @click="emit('addMember')"
        >
          {{ view.isAddingMember ? "Adding…" : "Add member" }}
        </Button>
      </div>

      <div v-if="view.canManage && view.visibility === 'public'" class="space-y-2">
        <Label for="space-visibility">Visibility</Label>
        <NativeSelect
          id="space-visibility"
          v-model="visibilityModel"
          class="w-full max-w-xs"
          :disabled="view.isUpdatingVisibility"
        >
          <NativeSelectOption value="public">{{
            view.isNested ? "Public folder" : "Personal folder"
          }}</NativeSelectOption>
          <NativeSelectOption value="private">{{
            view.isNested ? "Private room" : "Workspace"
          }}</NativeSelectOption>
        </NativeSelect>
      </div>

      <ul v-if="view.members.length" class="divide-y divide-border rounded-lg border border-border">
        <li
          v-for="member in view.members"
          :key="member.userId"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span class="relative shrink-0">
              <span
                class="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium"
              >
                {{ member.name.slice(0, 2).toUpperCase() }}
              </span>
              <PresenceDot :online="member.online" class="border-background" />
            </span>
            <div class="min-w-0">
              <p class="truncate font-medium">{{ member.name }}</p>
              <p v-if="member.username" class="truncate text-xs text-muted-foreground">
                @{{ member.username }}
              </p>
            </div>
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
    </template>
  </section>
</template>
