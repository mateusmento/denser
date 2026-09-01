<script setup lang="ts">
import type { SpaceMember } from "@denser/contracts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "@denser/design-system";
import { CheckIcon, ChevronDownIcon, UserIcon } from "@lucide/vue";

defineProps<{
  value: unknown;
  editable: boolean;
  members: SpaceMember[];
}>();

const emit = defineEmits<{
  update: [value: unknown];
}>();

function onTextInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update", target.value);
}
</script>

<template>
  <DropdownMenu v-if="editable && members.length > 0">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-foreground transition-colors outline-none hover:bg-muted"
      >
        <UserIcon class="size-3.5 text-muted-foreground" />
        <span>{{ value || "Unassigned" }}</span>
        <ChevronDownIcon class="ml-0.5 size-3 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-44">
      <DropdownMenuItem @select="emit('update', null)">
        <span class="text-xs text-muted-foreground">Unassigned</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        v-for="member in members"
        :key="member.userId"
        class="flex items-center justify-between text-xs"
        @select="emit('update', member.name || member.username)"
      >
        <span>{{ member.name || member.username }}</span>
        <CheckIcon
          v-if="value === (member.name || member.username)"
          class="size-3.5 text-primary"
        />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <Input
    v-else-if="editable"
    :value="(value as string) ?? ''"
    placeholder="Assignee name..."
    class="h-6 w-48 border-transparent bg-transparent px-1.5 text-xs shadow-none hover:border-border focus:border-border"
    @change="onTextInput"
  />
  <span v-else class="text-xs text-foreground">{{ value || "Unassigned" }}</span>
</template>
