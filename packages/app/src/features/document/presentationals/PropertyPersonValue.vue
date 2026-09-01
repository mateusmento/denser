<script setup lang="ts">
import type { PersonPropertyDefinition, SpaceMember, UserId } from "@denser/contracts";
import { memberDisplayLabel, parsePersonPropertyValue } from "@denser/contracts";
import { Badge, DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { ChevronDownIcon, PlusIcon, UserIcon, XIcon } from "@lucide/vue";
import { computed } from "vue";
import PropertyPersonPickerMenu from "./PropertyPersonPickerMenu.vue";

const props = defineProps<{
  prop: PersonPropertyDefinition;
  value: unknown;
  editable: boolean;
  members: SpaceMember[];
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  update: [value: unknown];
}>();

const selectedUserIds = computed(() =>
  parsePersonPropertyValue(props.value, props.prop.allowMultiple),
);

function memberLabel(userId: UserId): string {
  const member = props.members.find((entry) => entry.userId === userId);
  if (member) return memberDisplayLabel(member);
  if (typeof props.value === "string" && props.value === userId) return props.value;
  return "Unknown member";
}

function memberInitial(userId: UserId): string {
  return memberLabel(userId).slice(0, 1).toUpperCase();
}

function onSelect(userId: UserId) {
  if (props.prop.allowMultiple) {
    const current = selectedUserIds.value;
    if (current.includes(userId)) return;
    emit("update", [...current, userId]);
    return;
  }
  emit("update", userId);
}

function onRemove(userId: UserId) {
  if (props.prop.allowMultiple) {
    const next = selectedUserIds.value.filter((id) => id !== userId);
    emit("update", next.length ? next : null);
    return;
  }
  emit("update", null);
}

function onClear() {
  emit("update", null);
}

const singleLabel = computed(() => {
  const ids = selectedUserIds.value;
  if (!ids.length) {
    if (typeof props.value === "string" && props.value) return props.value;
    return "Unassigned";
  }
  return memberLabel(ids[0]!);
});
</script>

<template>
  <div v-if="editable" class="flex flex-wrap items-center gap-1">
    <template v-if="prop.allowMultiple">
      <Badge
        v-for="userId in selectedUserIds"
        :key="userId"
        variant="secondary"
        class="h-5 gap-1 py-0 text-xs"
      >
        <span
          class="inline-flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary"
        >
          {{ memberInitial(userId) }}
        </span>
        <span>{{ memberLabel(userId) }}</span>
        <button
          type="button"
          class="rounded-full p-0.5 hover:bg-muted-foreground/20"
          @click="onRemove(userId)"
        >
          <XIcon class="size-2.5" />
        </button>
      </Badge>
    </template>

    <DropdownMenu :open="open" @update:open="emit('update:open', $event)">
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-foreground transition-colors outline-none hover:bg-muted"
        >
          <UserIcon class="size-3.5 text-muted-foreground" />
          <template v-if="!prop.allowMultiple">
            <span>{{ singleLabel }}</span>
            <ChevronDownIcon class="ml-0.5 size-3 text-muted-foreground" />
          </template>
          <template v-else>
            <PlusIcon class="size-3" />
            <span>{{ selectedUserIds.length ? "Add" : "Unassigned" }}</span>
          </template>
        </button>
      </DropdownMenuTrigger>
      <PropertyPersonPickerMenu
        :open="open"
        :members="members"
        :selected-user-ids="selectedUserIds"
        :allow-multiple="prop.allowMultiple"
        @update:open="emit('update:open', $event)"
        @select="onSelect"
        @remove="onRemove"
        @clear="onClear"
      />
    </DropdownMenu>
  </div>
  <span v-else class="inline-flex flex-wrap items-center gap-1 text-xs text-foreground">
    <template v-if="prop.allowMultiple && selectedUserIds.length">
      <span v-for="userId in selectedUserIds" :key="userId">{{ memberLabel(userId) }}</span>
    </template>
    <template v-else>{{ singleLabel }}</template>
  </span>
</template>
