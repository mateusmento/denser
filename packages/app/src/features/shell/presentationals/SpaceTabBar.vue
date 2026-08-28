<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@denser/design-system";
import { FileTextIcon, MessageCircleIcon, PlusIcon, XIcon } from "@lucide/vue";
import type { SpaceSummary } from "@denser/contracts";
import { RouterLink } from "vue-router";

export type SpaceTabItem = {
  tabKey: string;
  label: string;
  to: { name: string; params?: Record<string, string> };
  isActive: boolean;
  closable: boolean;
};

defineProps<{
  tabs: readonly SpaceTabItem[];
  childSpaces?: readonly Pick<SpaceSummary, "id" | "title">[];
}>();

const emit = defineEmits<{
  add: [action: "document" | "conversation"];
  pinChildSpace: [spaceId: string];
  close: [tabKey: string];
}>();
</script>

<template>
  <nav
    class="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-4 py-1"
    data-slot="space-tab-bar"
  >
    <div
      v-for="tab in tabs"
      :key="tab.tabKey"
      class="flex shrink-0 items-center"
    >
      <Button
        as-child
        variant="ghost"
        size="sm"
        :class="tab.isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'"
      >
        <RouterLink :to="tab.to" class="max-w-48 truncate">
          {{ tab.label }}
        </RouterLink>
      </Button>
      <Button
        v-if="tab.closable"
        variant="ghost"
        size="icon"
        class="size-7 shrink-0 text-muted-foreground"
        :aria-label="`Close ${tab.label}`"
        @click="emit('close', tab.tabKey)"
      >
        <XIcon class="size-3.5" />
      </Button>
    </div>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon" class="size-8 shrink-0" title="Add tab" aria-label="Add tab">
          <PlusIcon class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="min-w-44">
        <DropdownMenuItem @select="emit('add', 'document')">
          <FileTextIcon class="size-3.5" />
          New document
        </DropdownMenuItem>
        <DropdownMenuItem @select="emit('add', 'conversation')">
          <MessageCircleIcon class="size-3.5" />
          New conversation
        </DropdownMenuItem>
        <template v-if="childSpaces?.length">
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="space in childSpaces"
            :key="space.id"
            @select="emit('pinChildSpace', space.id)"
          >
            Open {{ space.title }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </nav>
</template>
