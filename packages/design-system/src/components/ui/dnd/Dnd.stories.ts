import type { Meta, StoryObj } from "@storybook/vue3-vite"
import { computed, ref } from "vue"
import {
  applySortCommit,
  commitSwapMap,
  DndItem,
  DndList,
  DndOverlay,
  DndRoot,
  DndSlot,
  DndTarget,
  type DndCommitPayload,
  type DndId,
} from "./index"

type DemoItem = { id: DndId; title: string }

const meta = {
  title: "primitives/Dnd",
  component: DndRoot,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DndRoot>

export default meta
type Story = StoryObj<typeof meta>

const cardClass =
  "rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm"

function onSortCommit(lists: NonNullable<ReturnType<typeof ref<Record<string, DemoItem[]>>>>, payload: DndCommitPayload) {
  if (payload.canceled || !payload.over || !("listId" in payload.over) || !("listId" in payload.from))
    return
  const sourceId = payload.sourceIds[0]
  if (!sourceId)
    return
  lists.value = applySortCommit(lists.value!, sourceId, payload.from.listId, payload.over)
}

export const SortableColumn: Story = {
  name: "Sortable column",
  render: () => ({
    components: { DndRoot, DndList, DndItem, DndOverlay },
    setup() {
      const lists = ref<Record<string, DemoItem[]>>({
        inbox: [
          { id: "alpha", title: "Write the pickup fly" },
          { id: "bravo", title: "Snapshot untransformed boxes" },
          { id: "charlie", title: "Open a slot with translates" },
          { id: "delta", title: "Settle on the real item" },
          { id: "echo", title: "Keep Vue as DOM owner" },
        ],
      })
      const byId = computed(() =>
        Object.fromEntries(Object.values(lists.value).flat().map((item) => [item.id, item])),
      )
      return {
        lists,
        byId,
        cardClass,
        onCommit: (payload: DndCommitPayload) => onSortCommit(lists, payload),
      }
    },
    template: `
      <div class="flex min-h-dvh justify-center bg-background p-10">
        <DndRoot class="w-80" policy="sort" settle="item" @commit="onCommit">
          <DndList list-id="inbox" as="ul" class="m-0 flex list-none flex-col gap-2 p-0">
            <DndItem
              v-for="(item, index) in lists.inbox"
              :key="item.id"
              as="li"
              :item-id="item.id"
              list-id="inbox"
              :index="index"
            >
              <div :class="cardClass">{{ item.title }}</div>
            </DndItem>
          </DndList>
          <DndOverlay #default="{ sourceId }">
            <div :class="[cardClass, 'rotate-1 scale-105 shadow-lg']">{{ byId[sourceId]?.title }}</div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}

export const MultiList: Story = {
  name: "Multi list",
  render: () => ({
    components: { DndRoot, DndList, DndItem, DndOverlay },
    setup() {
      const lists = ref<Record<string, DemoItem[]>>({
        todo: [
          { id: "one", title: "Board card A" },
          { id: "two", title: "Board card B" },
          { id: "three", title: "Board card C" },
        ],
        doing: [
          { id: "four", title: "Board card D" },
          { id: "five", title: "Board card E" },
        ],
      })
      const byId = computed(() =>
        Object.fromEntries(Object.values(lists.value).flat().map((item) => [item.id, item])),
      )
      return {
        lists,
        byId,
        cardClass,
        onCommit: (payload: DndCommitPayload) => onSortCommit(lists, payload),
      }
    },
    template: `
      <div class="flex min-h-dvh justify-center gap-6 bg-background p-10">
        <DndRoot class="flex gap-6" policy="sort" settle="item" @commit="onCommit">
          <section v-for="listId in ['todo', 'doing']" :key="listId" class="w-64">
            <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ listId }}</h2>
            <DndList :list-id="listId" class="flex min-h-64 flex-col gap-2 rounded-xl bg-muted/40 p-2">
              <DndItem
                v-for="(item, index) in lists[listId]"
                :key="item.id"
                :item-id="item.id"
                :list-id="listId"
                :index="index"
              >
                <div :class="cardClass">{{ item.title }}</div>
              </DndItem>
            </DndList>
          </section>
          <DndOverlay #default="{ sourceId }">
            <div :class="[cardClass, 'rotate-1 scale-105 shadow-lg']">{{ byId[sourceId]?.title }}</div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}

export const HighlightGrid: Story = {
  name: "Highlight grid",
  render: () => ({
    components: { DndRoot, DndItem, DndOverlay, DndTarget },
    setup() {
      const tiles = ref<DemoItem[]>([
        { id: "spec", title: "Spec" },
        { id: "notes", title: "Notes" },
        { id: "brief", title: "Brief" },
      ])
      const folders = [
        { id: "design", title: "Design" },
        { id: "eng", title: "Engineering" },
      ]
      const last = ref<string>("Drop a tile on a folder")
      const byId = computed(() => Object.fromEntries(tiles.value.map((item) => [item.id, item])))
      function onCommit(payload: DndCommitPayload) {
        if (payload.canceled || !payload.over || !("targetId" in payload.over))
          return
        last.value = `Moved ${payload.sourceIds.join(", ")} → ${payload.over.targetId}`
      }
      return { tiles, folders, last, byId, cardClass, onCommit }
    },
    template: `
      <div class="flex min-h-dvh flex-col items-center gap-8 bg-background p-10">
        <p class="text-sm text-muted-foreground" data-testid="dnd-highlight-status">{{ last }}</p>
        <DndRoot policy="highlight" settle="item" @commit="onCommit">
          <div class="mb-8 flex gap-3">
            <DndItem v-for="(tile, index) in tiles" :key="tile.id" :item-id="tile.id" :index="index">
              <div :class="[cardClass, 'w-28 text-center']">{{ tile.title }}</div>
            </DndItem>
          </div>
          <div class="flex gap-4">
            <DndTarget
              v-for="folder in folders"
              :key="folder.id"
              :target-id="folder.id"
              class="flex size-36 items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground data-over:border-primary data-over:bg-primary/10 data-over:text-primary"
            >
              {{ folder.title }}
            </DndTarget>
          </div>
          <DndOverlay #default="{ sourceId }">
            <div :class="[cardClass, 'w-28 rotate-2 scale-105 text-center shadow-lg']">{{ byId[sourceId]?.title }}</div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}

export const SparseLists: Story = {
  name: "Sparse lists",
  render: () => ({
    components: { DndRoot, DndList, DndItem, DndOverlay },
    setup() {
      const lists = ref<Record<string, DemoItem[]>>({
        todo: [{ id: "task-3", title: "Task 3" }],
        done: [{ id: "task-4", title: "Task 4" }],
      })
      const byId = computed(() =>
        Object.fromEntries(Object.values(lists.value).flat().map((item) => [item.id, item])),
      )
      return {
        lists,
        byId,
        cardClass,
        onCommit: (payload: DndCommitPayload) => onSortCommit(lists, payload),
      }
    },
    template: `
      <div class="flex min-h-dvh justify-center gap-6 bg-background p-10">
        <DndRoot class="flex gap-6" policy="sort" settle="item" @commit="onCommit">
          <section v-for="listId in ['todo', 'done']" :key="listId" class="w-64">
            <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ listId }}</h2>
            <DndList :list-id="listId" class="flex min-h-64 flex-col gap-2 rounded-xl bg-muted/40 p-2">
              <DndItem
                v-for="(item, index) in lists[listId]"
                :key="item.id"
                :item-id="item.id"
                :list-id="listId"
                :index="index"
              >
                <div :class="cardClass">{{ item.title }}</div>
              </DndItem>
            </DndList>
          </section>
          <DndOverlay #default="{ sourceId }">
            <div :class="[cardClass, 'rotate-1 scale-105 shadow-lg']">{{ byId[sourceId]?.title }}</div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}

export const InFlowTabs: Story = {
  name: "In-flow tabs",
  render: () => ({
    components: { DndRoot, DndList, DndItem },
    setup() {
      const lists = ref<Record<string, DemoItem[]>>({
        tabs: [
          { id: "home", title: "Home" },
          { id: "board", title: "Board" },
          { id: "docs", title: "Docs" },
          { id: "chat", title: "Chat" },
        ],
      })
      return {
        lists,
        onCommit: (payload: DndCommitPayload) => onSortCommit(lists, payload),
      }
    },
    template: `
      <div class="flex min-h-dvh items-start justify-center bg-background p-10">
        <DndRoot policy="sort" orientation="horizontal" settle="item" @commit="onCommit">
          <DndList list-id="tabs" as="ul" orientation="horizontal" class="m-0 flex list-none gap-2 p-0">
            <DndItem
              v-for="(tab, index) in lists.tabs"
              :key="tab.id"
              as="li"
              :item-id="tab.id"
              list-id="tabs"
              :index="index"
            >
              <div class="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium shadow-sm">
                {{ tab.title }}
              </div>
            </DndItem>
          </DndList>
        </DndRoot>
      </div>
    `,
  }),
}

export const SwapGrid: Story = {
  name: "Swap grid",
  render: () => ({
    components: { DndRoot, DndSlot, DndItem, DndOverlay },
    setup() {
      const widgets: Record<string, DemoItem> = {
        weather: { id: "weather", title: "Weather" },
        calendar: { id: "calendar", title: "Calendar" },
        tasks: { id: "tasks", title: "Tasks" },
        notes: { id: "notes", title: "Notes" },
      }
      const slotIds = ["s1", "s2", "s3", "s4"]
      const slotItemMap = ref<Record<string, string | null>>({
        s1: "weather",
        s2: "calendar",
        s3: "tasks",
        s4: "notes",
      })
      function onCommit(payload: DndCommitPayload) {
        if (payload.canceled || !payload.over || !("slotId" in payload.over) || !("slotId" in payload.from))
          return
        slotItemMap.value = commitSwapMap(slotItemMap.value, payload.from.slotId, payload.over.slotId)
      }
      return { widgets, slotIds, slotItemMap, cardClass, onCommit }
    },
    template: `
      <div class="flex min-h-dvh justify-center bg-background p-10">
        <DndRoot class="w-md" policy="swap" swap-mode="drop" settle="item" @commit="onCommit">
          <div class="grid grid-cols-2 gap-3">
            <DndSlot
              v-for="slotId in slotIds"
              :key="slotId"
              :slot-id="slotId"
              :occupant-id="slotItemMap[slotId]"
              class="min-h-28 rounded-xl border-2 border-transparent p-1 data-over:border-primary data-over:bg-primary/5"
            >
              <DndItem
                v-if="slotItemMap[slotId]"
                :key="slotItemMap[slotId]"
                :item-id="slotItemMap[slotId]"
                :slot-id="slotId"
                :index="0"
              >
                <div :class="[cardClass, 'flex h-24 items-center justify-center']">
                  {{ widgets[slotItemMap[slotId]]?.title }}
                </div>
              </DndItem>
            </DndSlot>
          </div>
          <DndOverlay #default="{ sourceId }">
            <div :class="[cardClass, 'flex h-24 items-center justify-center shadow-lg']">
              {{ widgets[sourceId]?.title }}
            </div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}

export const OverlayFlock: Story = {
  name: "Overlay flock",
  render: () => ({
    components: { DndRoot, DndItem, DndOverlay, DndTarget },
    setup() {
      const tiles = [
        { id: "one", title: "Alpha" },
        { id: "two", title: "Bravo" },
        { id: "three", title: "Charlie" },
        { id: "four", title: "Delta" },
        { id: "five", title: "Echo" },
      ]
      const selected = ["one", "two", "three", "four"]
      const last = ref("Drag the selected tiles")
      function sourceIdsFor(id: string) {
        return selected.includes(id) ? selected : [id]
      }
      function onCommit(payload: DndCommitPayload) {
        if (payload.canceled || !payload.over || !("targetId" in payload.over))
          return
        last.value = `${payload.sourceIds.length} tiles → ${payload.over.targetId}`
      }
      return { tiles, selected, last, sourceIdsFor, onCommit, cardClass }
    },
    template: `
      <div class="flex min-h-dvh flex-col items-center gap-8 bg-background p-10">
        <p class="text-sm text-muted-foreground">{{ last }}</p>
        <DndRoot policy="highlight" :source-ids-for="sourceIdsFor" settle="item" @commit="onCommit">
          <div class="mb-8 flex gap-3">
            <DndItem
              v-for="(tile, index) in tiles"
              :key="tile.id"
              :item-id="tile.id"
              :index="index"
              :source-ids="selected.includes(tile.id) ? selected : undefined"
            >
              <div
                :class="[cardClass, 'w-24 text-center', selected.includes(tile.id) ? 'ring-2 ring-primary' : '']"
              >
                {{ tile.title }}
              </div>
            </DndItem>
          </div>
          <DndTarget
            target-id="inbox"
            class="flex h-28 w-80 items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm data-over:border-primary data-over:bg-primary/10"
          >
            Inbox
          </DndTarget>
          <DndOverlay #default="{ sourceId, index }">
            <div
              class="gallery-drag-tile w-24 rounded-lg border border-border bg-card px-3 py-2.5 text-center text-sm font-medium shadow-lg"
              :data-stack="index"
              :style="index === 1 ? 'translate: -6px 6px' : index === 2 ? 'translate: -12px 12px' : undefined"
            >
              {{ tiles.find((tile) => tile.id === sourceId)?.title }}
            </div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}

export const ItemSettle: Story = {
  name: "Item settle",
  render: () => ({
    components: { DndRoot, DndList, DndItem, DndOverlay },
    setup() {
      const lists = ref<Record<string, DemoItem[]>>({
        inbox: [
          { id: "a", title: "First" },
          { id: "b", title: "Second" },
          { id: "c", title: "Third" },
        ],
      })
      const byId = computed(() =>
        Object.fromEntries(lists.value.inbox!.map((item) => [item.id, item])),
      )
      return {
        lists,
        byId,
        cardClass,
        onCommit: (payload: DndCommitPayload) => onSortCommit(lists, payload),
      }
    },
    template: `
      <div class="flex min-h-dvh justify-center bg-background p-10">
        <DndRoot class="w-80" policy="sort" settle="item" data-settle="item" @commit="onCommit">
          <DndList list-id="inbox" class="flex flex-col gap-2">
            <DndItem
              v-for="(item, index) in lists.inbox"
              :key="item.id"
              :item-id="item.id"
              list-id="inbox"
              :index="index"
            >
              <div :class="cardClass">{{ item.title }}</div>
            </DndItem>
          </DndList>
          <DndOverlay #default="{ sourceId }">
            <div :class="[cardClass, 'rotate-1 scale-105 shadow-lg']">{{ byId[sourceId]?.title }}</div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}

export const ClickableItems: Story = {
  name: "Clickable items",
  render: () => ({
    components: { DndRoot, DndList, DndItem },
    setup() {
      const lists = ref<Record<string, DemoItem[]>>({
        inbox: [
          { id: "alpha", title: "Alpha" },
          { id: "bravo", title: "Bravo" },
          { id: "charlie", title: "Charlie" },
        ],
      })
      const lastClick = ref("none")
      return {
        lists,
        lastClick,
        onCommit: (payload: DndCommitPayload) => onSortCommit(lists, payload),
        onOpen: (id: string) => {
          lastClick.value = `open:${id}`
        },
        onClose: (id: string) => {
          lastClick.value = `close:${id}`
        },
      }
    },
    template: `
      <div class="flex min-h-dvh flex-col items-center gap-4 bg-background p-10">
        <p data-testid="dnd-last-click" class="text-sm text-muted-foreground">{{ lastClick }}</p>
        <DndRoot class="w-80" policy="sort" settle="item" @commit="onCommit">
          <DndList list-id="inbox" class="flex flex-col gap-2">
            <DndItem
              v-for="(item, index) in lists.inbox"
              :key="item.id"
              :item-id="item.id"
              list-id="inbox"
              :index="index"
              class="flex items-center gap-2"
              @click="onOpen(item.id)"
            >
              <button
                type="button"
                :data-testid="'dnd-open-' + item.id"
                class="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm font-medium"
              >
                {{ item.title }}
              </button>
              <button
                type="button"
                data-dnd-ignore
                :data-testid="'dnd-close-' + item.id"
                class="rounded-lg border border-border px-2 py-1 text-xs"
                @click.stop="onClose(item.id)"
              >
                Close
              </button>
            </DndItem>
          </DndList>
        </DndRoot>
      </div>
    `,
  }),
}

export const OverlaySettle: Story = {
  name: "Overlay settle",
  render: () => ({
    components: { DndRoot, DndList, DndItem, DndOverlay },
    setup() {
      const lists = ref<Record<string, DemoItem[]>>({
        inbox: [
          { id: "a", title: "First" },
          { id: "b", title: "Second" },
          { id: "c", title: "Third" },
        ],
      })
      const byId = computed(() =>
        Object.fromEntries(lists.value.inbox!.map((item) => [item.id, item])),
      )
      return {
        lists,
        byId,
        cardClass,
        onCommit: (payload: DndCommitPayload) => onSortCommit(lists, payload),
      }
    },
    template: `
      <div class="flex min-h-dvh justify-center bg-background p-10">
        <DndRoot class="w-80" policy="sort" settle="overlay" data-settle="overlay" @commit="onCommit">
          <DndList list-id="inbox" class="flex flex-col gap-2">
            <DndItem
              v-for="(item, index) in lists.inbox"
              :key="item.id"
              :item-id="item.id"
              list-id="inbox"
              :index="index"
            >
              <div :class="cardClass">{{ item.title }}</div>
            </DndItem>
          </DndList>
          <DndOverlay #default="{ sourceId }">
            <div :class="[cardClass, 'rotate-1 scale-105 shadow-lg']">{{ byId[sourceId]?.title }}</div>
          </DndOverlay>
        </DndRoot>
      </div>
    `,
  }),
}
