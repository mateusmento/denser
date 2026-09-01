<script setup lang="ts">
import type { SpaceMember, UserId } from "@denser/contracts";
import { memberDisplayLabel } from "@denser/contracts";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ScrollArea,
} from "@denser/design-system";
import { CheckIcon, SearchIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  members: readonly SpaceMember[];
  selectedUserIds: readonly UserId[];
  allowMultiple?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  select: [userId: UserId];
  remove: [userId: UserId];
  clear: [];
}>();

const search = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) search.value = "";
  },
);

const needle = computed(() => search.value.trim().toLowerCase());

const filteredMembers = computed(() => {
  if (!needle.value) return props.members;
  return props.members.filter((member) => {
    const label = memberDisplayLabel(member).toLowerCase();
    const username = member.username?.toLowerCase() ?? "";
    return label.includes(needle.value) || username.includes(needle.value);
  });
});

function isSelected(userId: UserId) {
  return props.selectedUserIds.includes(userId);
}

function onToggle(event: Event, member: SpaceMember) {
  event.preventDefault();
  if (isSelected(member.userId)) {
    emit("remove", member.userId);
    return;
  }
  emit("select", member.userId);
  if (!props.allowMultiple) {
    emit("update:open", false);
  }
}

function onClear(event: Event) {
  event.preventDefault();
  emit("clear");
  if (!props.allowMultiple) {
    emit("update:open", false);
  }
}
</script>

<template>
  <DropdownMenuContent align="start" class="w-56 overflow-hidden">
    <label class="mx-1 flex items-center gap-2 px-2">
      <SearchIcon class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        v-model="search"
        type="search"
        :placeholder="placeholder ?? 'Search members…'"
        aria-label="Search members"
        class="h-6 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        @keydown.stop
        @pointerdown.stop
      />
    </label>
    <DropdownMenuSeparator />
    <ScrollArea class="h-56">
      <DropdownMenuItem class="text-xs" @select="onClear">
        <span class="text-muted-foreground">Unassigned</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        v-for="member in filteredMembers"
        :key="member.userId"
        class="flex items-center justify-between gap-2 text-xs"
        @select="onToggle($event, member)"
      >
        <div class="flex min-w-0 items-center gap-1.5">
          <span
            class="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary"
          >
            {{ memberDisplayLabel(member).slice(0, 1).toUpperCase() }}
          </span>
          <span class="truncate">{{ memberDisplayLabel(member) }}</span>
        </div>
        <CheckIcon v-if="isSelected(member.userId)" class="size-3.5 shrink-0 text-primary" />
      </DropdownMenuItem>
      <p v-if="!filteredMembers.length" class="px-3 py-1.5 text-xs text-muted-foreground">
        No members
      </p>
    </ScrollArea>
  </DropdownMenuContent>
</template>
