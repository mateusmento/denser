<script setup lang="ts">
import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@denser/design-system";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "@lucide/vue";
import { computed, ref } from "vue";
import {
  childrenForLocation,
  destinationForLocation,
  matchesSearch,
  MOVE_HOME,
  titleForLocation,
  type SpaceMoveDestination,
  type SpaceMoveLocation,
  type SpaceMoveNode,
} from "../lib/space-move-menu";

const props = defineProps<{
  spaces: readonly SpaceMoveNode[];
  currentDestination?: string | null;
  blockedIds?: readonly string[];
}>();

const emit = defineEmits<{
  explore: [spaceId: string];
  select: [destination: SpaceMoveDestination];
}>();

const trail = ref<SpaceMoveLocation[]>([MOVE_HOME]);
const search = ref("");
const direction = ref<"forward" | "back">("forward");

const location = computed(() => trail.value.at(-1) ?? MOVE_HOME);
const blocked = computed(() => new Set(props.blockedIds ?? []));

const items = computed(() => {
  const entries = childrenForLocation(props.spaces, location.value, blocked.value);
  return entries.filter((entry) => matchesSearch(entry.title, search.value));
});

const destination = computed(() => destinationForLocation(location.value));
const title = computed(() => titleForLocation(location.value, props.spaces));

const canGoBack = computed(() => trail.value.length > 1);

const canMoveHere = computed(() => {
  const target = destination.value;
  if (target.kind === "home") return props.currentDestination != null;
  if (blocked.value.has(target.spaceId)) return false;
  return target.spaceId !== props.currentDestination;
});

function goTo(next: SpaceMoveLocation, way: "forward" | "back") {
  direction.value = way;
  search.value = "";
  trail.value = way === "forward" ? [...trail.value, next] : trail.value.slice(0, -1);
  const current = trail.value.at(-1);
  if (current && current !== MOVE_HOME) {
    emit("explore", current);
  }
}

function onBack(event: Event) {
  event.preventDefault();
  if (trail.value.length <= 1) return;
  goTo(trail.value.at(-2) ?? MOVE_HOME, "back");
}

function onNavigate(event: Event, next: SpaceMoveLocation) {
  event.preventDefault();
  goTo(next, "forward");
}

function onMoveHere() {
  const target = destination.value;
  if (target) emit("select", target);
}
</script>

<template>
  <div class="w-56" data-slot="space-move-menu">
    <label class="mx-1 flex items-center gap-2 px-2">
      <SearchIcon class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        v-model="search"
        type="search"
        placeholder="Search"
        aria-label="Filter spaces"
        class="h-8 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        @keydown.stop
        @pointerdown.stop
      />
    </label>
    <ContextMenuSeparator />
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
        <ContextMenuLabel>{{ title }}</ContextMenuLabel>
        <ContextMenuItem v-if="canGoBack" @select="onBack">
          <ChevronLeftIcon class="size-3.5" />
          Back
        </ContextMenuItem>
        <ContextMenuItem v-if="canMoveHere" @select="onMoveHere"> Move here </ContextMenuItem>
        <ContextMenuItem
          v-for="item in items"
          :key="item.id"
          @select="onNavigate($event, item.location)"
        >
          <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
          <ChevronRightIcon class="size-3.5 text-muted-foreground" />
        </ContextMenuItem>
        <p
          v-if="!items.length && !canMoveHere && !canGoBack"
          class="px-3 py-1.5 text-xs text-muted-foreground"
        >
          No spaces
        </p>
      </div>
    </div>
  </div>
</template>
