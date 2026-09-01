<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { DropdownMenuItem, DropdownMenuSeparator } from "@denser/design-system";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import {
  childrenForLocation,
  matchesSearch,
  MOVE_HOME,
  parentLocation,
  titleForLocation,
  type SpaceMoveLocation,
  type SpaceMoveNode,
} from "../lib/space-move-menu";

const props = defineProps<{
  spaces: readonly SpaceMoveNode[];
  currentSpaceId?: SpaceId | null;
  selectedSpaceId?: SpaceId | null;
}>();

const emit = defineEmits<{
  explore: [spaceId: string];
  select: [spaceId: SpaceId];
}>();

const search = ref("");
const direction = ref<"forward" | "back">("forward");
const trail = ref<SpaceMoveLocation[]>(initialTrail());

function initialTrail(): SpaceMoveLocation[] {
  if (!props.currentSpaceId) return [MOVE_HOME];
  return [props.currentSpaceId];
}

function resetTrail() {
  trail.value = initialTrail();
  search.value = "";
  direction.value = "forward";
  exploreLocation(trail.value.at(-1));
}

function exploreLocation(location: SpaceMoveLocation | undefined) {
  if (location && location !== MOVE_HOME) {
    emit("explore", location);
  }
}

watch(
  () => props.currentSpaceId,
  () => resetTrail(),
  { immediate: true },
);

const location = computed(() => trail.value.at(-1) ?? MOVE_HOME);

const items = computed(() => {
  const entries = childrenForLocation(props.spaces, location.value);
  return entries.filter((entry) => matchesSearch(entry.title, search.value));
});

const title = computed(() => titleForLocation(location.value, props.spaces));

const canGoBack = computed(() => {
  if (trail.value.length > 1) return true;
  if (location.value === MOVE_HOME) return false;
  return parentLocation(location.value, props.spaces) !== location.value;
});

const backTitle = computed(() => {
  if (trail.value.length > 1) {
    return titleForLocation(trail.value.at(-2) ?? MOVE_HOME, props.spaces);
  }
  return titleForLocation(parentLocation(location.value, props.spaces), props.spaces);
});

const canSelectNavigatedSpace = computed(() => location.value !== MOVE_HOME);

function isCurrentSpace(spaceId: string) {
  return props.currentSpaceId != null && spaceId === props.currentSpaceId;
}

function goTo(next: SpaceMoveLocation, way: "forward" | "back") {
  direction.value = way;
  search.value = "";
  trail.value = way === "forward" ? [...trail.value, next] : trail.value.slice(0, -1);
  exploreLocation(trail.value.at(-1));
}

function onBack(event: Event) {
  event.preventDefault();
  if (trail.value.length > 1) {
    goTo(trail.value.at(-2) ?? MOVE_HOME, "back");
    return;
  }
  const parent = parentLocation(location.value, props.spaces);
  if (parent === location.value) return;
  direction.value = "back";
  search.value = "";
  trail.value = [parent];
  exploreLocation(parent === MOVE_HOME ? undefined : parent);
}

function onNavigate(event: Event, next: SpaceMoveLocation) {
  event.preventDefault();
  goTo(next, "forward");
}

function onSelectSpace(event: Event, spaceId: SpaceId) {
  event.preventDefault();
  emit("select", spaceId);
}
</script>

<template>
  <div class="w-full" data-slot="relation-space-picker-menu">
    <label class="mx-1 flex items-center gap-2 px-2">
      <SearchIcon class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        v-model="search"
        type="search"
        placeholder="Search spaces"
        aria-label="Filter spaces"
        class="h-8 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        @keydown.stop
        @pointerdown.stop
      />
    </label>
    <DropdownMenuSeparator />
    <div class="overflow-hidden">
      <div
        :key="location"
        class="flex flex-col"
        :class="
          direction === 'forward'
            ? 'animate-in duration-150 fade-in slide-in-from-right-4'
            : 'animate-in duration-150 fade-in slide-in-from-left-4'
        "
      >
        <DropdownMenuItem v-if="canGoBack" class="text-xs" @select="onBack">
          <ChevronLeftIcon class="size-3.5" />
          Back
          <span class="min-w-0 truncate ml-auto text-muted-foreground">{{ backTitle }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="canSelectNavigatedSpace"
          class="flex items-center gap-2 text-xs"
          @select="onSelectSpace($event, location as SpaceId)"
        >
          <span class="min-w-0 flex-1 truncate">Connect here</span>
          <span class="shrink-0 text-muted-foreground">{{ title }}</span>
          <CheckIcon
            v-if="selectedSpaceId === location"
            class="size-3.5 shrink-0 text-primary"
          />
        </DropdownMenuItem>
        <DropdownMenuItem
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-2 text-xs"
          @select="onNavigate($event, item.location)"
        >
          <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
          <span v-if="isCurrentSpace(item.id)" class="shrink-0 text-muted-foreground">
            This space
          </span>
          <CheckIcon
            v-if="selectedSpaceId === item.location"
            class="size-3.5 shrink-0 text-primary"
          />
          <ChevronRightIcon class="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuItem>
        <p
          v-if="!items.length && !canSelectNavigatedSpace && !canGoBack"
          class="px-3 py-1.5 text-xs text-muted-foreground"
        >
          No spaces
        </p>
      </div>
    </div>
  </div>
</template>
