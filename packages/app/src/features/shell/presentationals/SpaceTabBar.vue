<script setup lang="ts">
import {
  Button,
  DndItem,
  DndList,
  DndRoot,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type DndCommitPayload,
} from "@denser/design-system";
import { FileTextIcon, MessageCircleIcon, PlusIcon, XIcon } from "@lucide/vue";
import type { SpaceSummary } from "@denser/contracts";
import { computed } from "vue";
import { RouterLink } from "vue-router";

export type SpaceTabItem = {
  tabKey: string;
  label: string;
  to: { name: string; params?: Record<string, string>; query?: Record<string, string> };
  isActive: boolean;
  closable: boolean;
};

const props = defineProps<{
  tabs: readonly SpaceTabItem[];
  childSpaces?: readonly Pick<SpaceSummary, "id" | "title">[];
}>();

const emit = defineEmits<{
  add: [action: "document" | "conversation"];
  openChildSpace: [spaceId: string];
  close: [tabKey: string];
  reorder: [payload: { tabKey: string; toIndex: number }];
}>();

const pinnedTabs = computed(() => props.tabs.filter((tab) => !tab.closable));
const workingTabs = computed(() => props.tabs.filter((tab) => tab.closable));

let suppressNavigate = false;

function onCommit(payload: DndCommitPayload) {
  suppressNavigate = true;
  requestAnimationFrame(() => {
    suppressNavigate = false;
  });
  if (payload.canceled || !payload.over || !("listId" in payload.over)) return;
  const tabKey = payload.sourceIds[0];
  if (!tabKey) return;
  emit("reorder", { tabKey, toIndex: payload.over.index });
}

function onTabNavigate(event: MouseEvent) {
  if (!suppressNavigate) return;
  event.preventDefault();
  suppressNavigate = false;
}

function tabButtonClass(tab: SpaceTabItem) {
  return tab.isActive ? "bg-muted text-foreground" : "text-muted-foreground";
}
</script>

<template>
  <nav
    class="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-4 py-1"
    data-slot="space-tab-bar"
  >
    <div v-for="tab in pinnedTabs" :key="tab.tabKey" class="flex shrink-0 items-center">
      <Button as-child variant="ghost" size="sm" :class="tabButtonClass(tab)">
        <RouterLink :to="tab.to" class="max-w-48 truncate">
          {{ tab.label }}
        </RouterLink>
      </Button>
    </div>

    <DndRoot
      v-if="workingTabs.length"
      class="flex items-center gap-1"
      policy="sort"
      orientation="horizontal"
      settle="item"
      @commit="onCommit"
    >
      <DndList list-id="working" orientation="horizontal" class="flex items-center gap-1">
        <DndItem
          v-for="(tab, index) in workingTabs"
          :key="tab.tabKey"
          :item-id="tab.tabKey"
          list-id="working"
          :index="index"
          class="flex shrink-0 items-center"
        >
          <Button as-child variant="ghost" size="sm" :class="tabButtonClass(tab)">
            <RouterLink :to="tab.to" class="max-w-48 truncate" @click="onTabNavigate">
              {{ tab.label }}
            </RouterLink>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 shrink-0 text-muted-foreground"
            data-dnd-ignore
            :aria-label="`Close ${tab.label}`"
            @click="emit('close', tab.tabKey)"
          >
            <XIcon class="size-3.5" />
          </Button>
        </DndItem>
      </DndList>
    </DndRoot>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="size-8 shrink-0"
          title="Add tab"
          aria-label="Add tab"
        >
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
            @select="emit('openChildSpace', space.id)"
          >
            Open {{ space.title }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </nav>
</template>
