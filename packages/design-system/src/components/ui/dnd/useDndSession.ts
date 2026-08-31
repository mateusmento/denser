import { createInjectionState, useEventListener, usePreferredReducedMotion } from "@vueuse/core";
import {
  computed,
  nextTick,
  onUnmounted,
  shallowRef,
  ref,
  toValue,
  type MaybeRefOrGetter,
} from "vue";
import { computeSortTransforms, hitTestSort, placeholderRect } from "./arrange/sort";
import { hitTestHighlight } from "./arrange/highlight";
import { computeSwapTransforms, hitTestSwap, previewSwapMap, slotIdForItem } from "./arrange/swap";
import { dndFly, easeOutCubic, flockOverlayRects, type DndFlyHandle } from "./DndFly";
import { dropRegistration, settleFromRect, invertSettleDelta } from "./settle";
import { applyScrollDelta, getUntransformedRect, readCssGap } from "./geometry";
import { autoScrollDelta } from "./scroll-port";
import { createPointerSensor } from "./sensors/pointer";
import type {
  DndAxis,
  DndCommitPayload,
  DndDelta,
  DndFrom,
  DndId,
  DndOver,
  DndPhase,
  DndPoint,
  DndPolicy,
  DndRect,
  DndScrollPort,
  DndSensor,
  DndSensorEvent,
  DndSettle,
  DndSourceMode,
  DndSwapMode,
  GeometrySnapshot,
  ItemSnapshot,
} from "./types";

export type DndSessionConfig = {
  policy?: DndPolicy;
  settle?: DndSettle;
  sourceMode?: DndSourceMode;
  swapMode?: DndSwapMode;
  orientation?: DndAxis;
  sensors?: DndSensor[];
  sourceIdsFor?: (id: DndId) => DndId[];
  onCommit?: (payload: DndCommitPayload) => void;
};

type ItemRegistration = {
  element: HTMLElement;
  listId?: DndId;
  slotId?: DndId;
  index: number;
};

type ListRegistration = {
  element: HTMLElement;
  orientation: DndAxis;
};

type SlotRegistration = {
  element: HTMLElement;
  occupantId: DndId | null;
};

type TargetRegistration = {
  element: HTMLElement;
};

const FLY_MS = 220;

function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  return new Map(map);
}

export const [useProvideDndSession, useInjectDndSession] = createInjectionState(
  (config: MaybeRefOrGetter<DndSessionConfig>) => {
    const reducedMotion = usePreferredReducedMotion();
    const items = new Map<DndId, ItemRegistration>();
    const lists = new Map<DndId, ListRegistration>();
    const slots = new Map<DndId, SlotRegistration>();
    const targets = new Map<DndId, TargetRegistration>();
    const ports = new Map<DndId, DndScrollPort>();

    const phase = ref<DndPhase>("idle");
    const sourceIds = shallowRef<DndId[]>([]);
    const from = ref<DndFrom | null>(null);
    const over = ref<DndOver | null>(null);
    const pointer = ref<DndPoint>({ x: 0, y: 0 });
    const grabOffset = ref<DndPoint>({ x: 0, y: 0 });
    const startPointer = ref<DndPoint>({ x: 0, y: 0 });
    const transforms = shallowRef(new Map<DndId, DndDelta>());
    const flyDeltas = shallowRef(new Map<DndId, DndDelta>());
    const overlayRects = shallowRef(new Map<DndId, DndRect>());
    const overlayCount = ref(0);
    const snapshot = ref<GeometrySnapshot | null>(null);
    let fly: DndFlyHandle | null = null;
    let scrollStops: Array<() => void> = [];
    let autoScrollRaf = 0;

    const options = () => toValue(config);
    const policy = computed(() => options().policy ?? "sort");
    const settle = computed(() => options().settle ?? "item");
    const sourceMode = computed(() => options().sourceMode ?? "hide");
    const swapMode = computed(() => options().swapMode ?? "drop");
    const orientation = computed(() => options().orientation ?? "vertical");
    const defaultSensor = createPointerSensor();
    const sensors = computed(() => options().sensors ?? [defaultSensor]);

    const active = computed(() => phase.value !== "idle");
    const hasOverlay = computed(() => overlayCount.value > 0);
    const visibleSourceIds = computed(() => sourceIds.value);

    const slotItemMap = computed(() => {
      const map: Record<DndId, DndId | null> = {};
      for (const [id, slot] of slots) map[id] = slot.occupantId;
      return map;
    });

    function currentPortOffset(): DndPoint {
      const rootPort = ports.get("__root__");
      if (rootPort) return rootPort.offset;
      const first = ports.values().next().value as DndScrollPort | undefined;
      return first?.offset ?? { x: 0, y: 0 };
    }

    function liveSnapshot(): GeometrySnapshot | null {
      const frozen = snapshot.value;
      if (!frozen) return null;
      const scroll = currentPortOffset();
      return {
        items: frozen.items.map((item) => {
          const portId = item.listId;
          const port = portId ? ports.get(portId) : undefined;
          if (port && portId && frozen.portScrolls?.[portId]) {
            const startScroll = frozen.portScrolls[portId];
            const currentScroll = port.offset;
            return {
              ...item,
              ...applyScrollDelta(item, startScroll, currentScroll),
            };
          }
          return {
            ...item,
            ...applyScrollDelta(item, frozen.scroll, scroll),
          };
        }),
        lists: frozen.lists.map((list) => {
          const port = ports.get(list.id);
          const startScroll = frozen.portScrolls?.[list.id];
          if (port && startScroll) {
            return {
              ...list,
              ...applyScrollDelta(list, startScroll, port.offset),
            };
          }
          return {
            ...list,
            ...applyScrollDelta(list, frozen.scroll, scroll),
          };
        }),
        slots: frozen.slots.map((slot) => ({
          ...slot,
          ...applyScrollDelta(slot, frozen.scroll, scroll),
        })),
        targets: frozen.targets.map((target) => ({
          ...target,
          ...applyScrollDelta(target, frozen.scroll, scroll),
        })),
        scroll,
        portScrolls: frozen.portScrolls,
      };
    }

    function takeSnapshot(): GeometrySnapshot {
      const itemSnapshots: ItemSnapshot[] = [];
      for (const [id, item] of items) {
        itemSnapshots.push({
          id,
          listId: item.listId,
          slotId: item.slotId,
          index: item.index,
          ...getUntransformedRect(item.element),
        });
      }
      const portScrolls: Record<DndId, DndPoint> = {};
      for (const [id, port] of ports) {
        portScrolls[id] = { ...port.offset };
      }
      return {
        items: itemSnapshots,
        lists: [...lists].map(([id, list]) => ({
          id,
          orientation: list.orientation,
          gap: readCssGap(list.element, list.orientation),
          ...getUntransformedRect(list.element),
        })),
        slots: [...slots].map(([id, slot]) => ({
          id,
          occupantId: slot.occupantId,
          ...getUntransformedRect(slot.element),
        })),
        targets: [...targets].map(([id, target]) => ({
          id,
          ...getUntransformedRect(target.element),
        })),
        scroll: currentPortOffset(),
        portScrolls,
      };
    }

    function pointerOriginRect(source: ItemSnapshot): DndRect {
      return {
        x: pointer.value.x - grabOffset.value.x,
        y: pointer.value.y - grabOffset.value.y,
        width: source.width,
        height: source.height,
      };
    }

    function writeOverlayRects(rects: Map<DndId, DndRect>) {
      overlayRects.value = cloneMap(rects);
    }

    function setOverlayAtPointer() {
      const geometry = liveSnapshot();
      if (!geometry) return;
      const next = new Map<DndId, DndRect>();
      for (const id of visibleSourceIds.value) {
        const source = geometry.items.find((item) => item.id === id);
        if (source) next.set(id, pointerOriginRect(source));
      }
      writeOverlayRects(next);
    }

    function updateArrange() {
      const geometry = liveSnapshot();
      if (!geometry || sourceIds.value[0] === undefined) {
        transforms.value = new Map();
        return;
      }
      const primary = sourceIds.value[0];
      if (policy.value === "sort") {
        const sortOver = over.value && "listId" in over.value ? over.value : null;
        const listOrientation =
          geometry.lists.find((list) => list.id === sortOver?.listId)?.orientation ??
          geometry.lists.find(
            (list) => list.id === (from.value && "listId" in from.value ? from.value.listId : ""),
          )?.orientation ??
          orientation.value;
        transforms.value = computeSortTransforms(
          geometry.items,
          primary,
          sortOver,
          listOrientation,
          geometry.lists,
        );
        return;
      }
      if (policy.value === "swap") {
        const sourceSlot = from.value && "slotId" in from.value ? from.value.slotId : null;
        const overSlot = over.value && "slotId" in over.value ? over.value.slotId : null;
        const preview = sourceSlot
          ? previewSwapMap(slotItemMap.value, sourceSlot, overSlot, swapMode.value)
          : slotItemMap.value;
        transforms.value = computeSwapTransforms(geometry.slots, slotItemMap.value, preview);
        return;
      }
      transforms.value = new Map();
    }

    function updateOver() {
      const geometry = liveSnapshot();
      if (!geometry) {
        over.value = null;
        return;
      }
      if (policy.value === "sort") {
        over.value = hitTestSort(geometry.items, geometry.lists, pointer.value, sourceIds.value);
        return;
      }
      if (policy.value === "highlight") {
        over.value = hitTestHighlight(geometry.targets, pointer.value, sourceIds.value);
        return;
      }
      over.value = hitTestSwap(geometry.slots, pointer.value);
    }

    function placeholder(): { listId: DndId; rect: DndRect } | null {
      if (policy.value !== "sort" || phase.value === "idle" || phase.value === "settling")
        return null;
      const geometry = liveSnapshot();
      const sortOver = over.value && "listId" in over.value ? over.value : null;
      const primary = sourceIds.value[0];
      const source = geometry?.items.find((item) => item.id === primary);
      if (!geometry || !sortOver || !source) return null;
      const list = geometry.lists.find((entry) => entry.id === sortOver.listId);
      if (!list) return null;
      return {
        listId: sortOver.listId,
        rect: placeholderRect(
          geometry.items,
          source,
          sortOver,
          list,
          list.orientation,
          geometry.lists,
        ),
      };
    }

    const placeholderView = computed(() => {
      void transforms.value;
      void over.value;
      void phase.value;
      return placeholder();
    });

    function stopAutoScroll() {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = 0;
    }

    function tickAutoScroll() {
      if (phase.value !== "dragging" && phase.value !== "pickup") return;
      for (const port of ports.values()) {
        const delta = autoScrollDelta(port, pointer.value);
        if (delta) port.scrollBy(delta);
      }
      updateOver();
      updateArrange();
      if (phase.value === "dragging") setOverlayAtPointer();
      autoScrollRaf = requestAnimationFrame(tickAutoScroll);
    }

    function bindScroll() {
      unbindScroll();
      scrollStops = [...ports.values()].map((port) =>
        port.subscribe(() => {
          updateOver();
          updateArrange();
        }),
      );
    }

    function unbindScroll() {
      for (const stop of scrollStops) stop();
      scrollStops = [];
    }

    function lockSelect(lock: boolean) {
      document.body.style.userSelect = lock ? "none" : "";
    }

    function destinationRect(id: DndId): DndRect | null {
      const item = items.get(id);
      if (item) return getUntransformedRect(item.element);
      const geometry = liveSnapshot();
      const view = placeholder();
      if (view) return view.rect;
      return geometry?.items.find((entry) => entry.id === id) ?? null;
    }

    function finishSession() {
      fly?.stop();
      fly = null;
      stopAutoScroll();
      unbindScroll();
      lockSelect(false);
      sourceIds.value = [];
      from.value = null;
      over.value = null;
      snapshot.value = null;
      transforms.value = new Map();
      flyDeltas.value = new Map();
      overlayRects.value = new Map();
      phase.value = "idle";
    }

    async function settleDrop(canceled: boolean) {
      const currentOver = canceled ? null : over.value;
      const payload: DndCommitPayload = {
        sourceIds: [...sourceIds.value],
        from: from.value ?? { listId: "" },
        over: currentOver,
        canceled,
      };
      const lastOverlays = cloneMap(overlayRects.value);
      const partnerId =
        policy.value === "swap" && currentOver && "slotId" in currentOver
          ? slotItemMap.value[currentOver.slotId]
          : null;
      const movingIds =
        settle.value === "item" && partnerId
          ? uniqueIds([...sourceIds.value, partnerId])
          : [...sourceIds.value];
      const preCommitRects = new Map<DndId, DndRect>();
      for (const id of movingIds) {
        const registered = items.get(id);
        if (registered) preCommitRects.set(id, getUntransformedRect(registered.element));
      }
      options().onCommit?.(payload);

      phase.value = "settling";

      if (settle.value === "item" || !hasOverlay.value) {
        overlayRects.value = new Map();
        transforms.value = new Map();
        await nextTick();
        const duration = reducedMotion.value === "reduce" ? 0 : FLY_MS;
        const nextFly = new Map<DndId, DndDelta>();
        const origins = new Map<DndId, DndRect>();
        for (const id of movingIds) {
          const to = destinationRect(id);
          if (!to) continue;
          const fromRect = settleFromRect(lastOverlays.get(id), preCommitRects.get(id), to);
          const delta = invertSettleDelta(fromRect, to);
          origins.set(id, { ...delta, width: to.width, height: to.height });
          nextFly.set(id, delta);
        }
        flyDeltas.value = nextFly;
        const hasMovement = [...origins.values()].some(
          (delta) => Math.hypot(delta.x, delta.y) >= 0.5,
        );
        if (!hasMovement || duration === 0) {
          finishSession();
          return;
        }
        const first = movingIds[0];
        const firstOrigin = first ? origins.get(first) : undefined;
        const origin = firstOrigin ?? Array.from(origins.values())[0];
        if (!origin) {
          finishSession();
          return;
        }
        fly = dndFly({
          from: origin,
          to: { x: 0, y: 0, width: origin.width, height: origin.height },
          duration,
          onUpdate(_rect, t) {
            const eased = easeOutCubic(t);
            const deltas = new Map<DndId, DndDelta>();
            for (const id of movingIds) {
              const start = origins.get(id);
              if (!start) continue;
              deltas.set(id, { x: start.x * (1 - eased), y: start.y * (1 - eased) });
            }
            flyDeltas.value = deltas;
          },
          onFinish: finishSession,
        });
        return;
      }

      const duration = reducedMotion.value === "reduce" ? 0 : FLY_MS;
      await nextTick();
      transforms.value = new Map();
      const destinations = new Map<DndId, DndRect>();
      for (const id of sourceIds.value) {
        const to = destinationRect(id);
        if (to) destinations.set(id, to);
      }
      const primary = sourceIds.value[0];
      const primaryFrom = primary ? lastOverlays.get(primary) : null;
      const primaryTo = primary ? destinations.get(primary) : null;
      if (!primaryFrom || !primaryTo || duration === 0) {
        finishSession();
        return;
      }
      fly = dndFly({
        from: primaryFrom,
        to: primaryTo,
        duration,
        onUpdate(_rect, t) {
          const eased = easeOutCubic(t);
          const next = new Map<DndId, DndRect>();
          for (let i = 0; i < sourceIds.value.length; i++) {
            const id = sourceIds.value[i]!;
            const fromRect = lastOverlays.get(id);
            const toRect = destinations.get(id) ?? primaryTo;
            if (!fromRect) continue;
            next.set(id, {
              x: fromRect.x + (toRect.x - fromRect.x) * eased,
              y: fromRect.y + (toRect.y - fromRect.y) * eased,
              width: fromRect.width + (toRect.width - fromRect.width) * eased,
              height: fromRect.height + (toRect.height - fromRect.height) * eased,
            });
          }
          writeOverlayRects(next);
        },
        onFinish: finishSession,
      });
    }

    async function startDrag(itemId: DndId, ids: DndId[], point: DndPoint) {
      const item = items.get(itemId);
      if (!item) return;
      snapshot.value = takeSnapshot();
      const source = snapshot.value.items.find((entry) => entry.id === itemId);
      if (!source) return;
      pointer.value = point;
      startPointer.value = point;
      grabOffset.value = { x: point.x - source.x, y: point.y - source.y };
      sourceIds.value = ids;
      from.value = item.slotId ? { slotId: item.slotId } : { listId: item.listId ?? "" };
      phase.value = "pickup";
      lockSelect(true);
      bindScroll();
      updateOver();
      updateArrange();

      const initial = new Map<DndId, DndRect>();
      for (const id of visibleSourceIds.value) {
        const rect = snapshot.value.items.find((entry) => entry.id === id);
        if (rect) initial.set(id, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
      writeOverlayRects(initial);
      await nextTick();

      const duration = reducedMotion.value === "reduce" ? 0 : FLY_MS;
      const primary = snapshot.value.items.find((entry) => entry.id === itemId);
      if (!primary) {
        phase.value = "dragging";
        return;
      }
      fly = dndFly({
        from: initial.get(itemId) ?? pointerOriginRect(primary),
        to: () => pointerOriginRect(primary),
        duration,
        onUpdate(_rect, t) {
          writeOverlayRects(flockOverlayRects(initial, pointerOriginRect(primary), t));
        },
        onFinish() {
          if (phase.value === "pickup") phase.value = "dragging";
          setOverlayAtPointer();
        },
      });
      autoScrollRaf = requestAnimationFrame(tickAutoScroll);
    }

    function handleSensor(event: DndSensorEvent, itemId: DndId, ids: DndId[]) {
      if (event.type === "start") {
        void startDrag(itemId, ids, event.point);
        return;
      }
      if (!active.value) return;
      if (event.type === "move") {
        pointer.value = event.point;
        updateOver();
        updateArrange();
        if (phase.value === "dragging") setOverlayAtPointer();
        return;
      }
      if (event.type === "cancel") {
        void settleDrop(true);
        return;
      }
      void settleDrop(over.value === null);
    }

    function bindActivator(element: HTMLElement, itemId: DndId, getSourceIds: () => DndId[]) {
      const stops = sensors.value.map((sensor) =>
        sensor.bind(element, (event) => {
          const ids = uniqueIds(getSourceIds().length > 0 ? getSourceIds() : [itemId]);
          handleSensor(event, itemId, ids);
        }),
      );
      return () => {
        for (const stop of stops) stop();
      };
    }

    useEventListener(document, "keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape" && active.value) void settleDrop(true);
    });

    onUnmounted(() => {
      finishSession();
    });

    return {
      phase,
      active,
      sourceIds,
      visibleSourceIds,
      from,
      over,
      pointer,
      hasOverlay,
      overlayRects,
      policy,
      settle,
      placeholder: placeholderView,
      registerItem(id: DndId, registration: ItemRegistration) {
        items.set(id, registration);
        return () => {
          dropRegistration(items, id, registration);
        };
      },
      updateItem(id: DndId, patch: Partial<ItemRegistration>) {
        const current = items.get(id);
        if (current) items.set(id, { ...current, ...patch });
      },
      registerList(id: DndId, registration: ListRegistration) {
        lists.set(id, registration);
        return () => {
          lists.delete(id);
        };
      },
      registerSlot(id: DndId, registration: SlotRegistration) {
        slots.set(id, registration);
        return () => {
          slots.delete(id);
        };
      },
      updateSlot(id: DndId, patch: Partial<SlotRegistration>) {
        const current = slots.get(id);
        if (current) slots.set(id, { ...current, ...patch });
      },
      registerTarget(id: DndId, registration: TargetRegistration) {
        targets.set(id, registration);
        return () => {
          targets.delete(id);
        };
      },
      registerScrollPort(id: DndId, port: DndScrollPort) {
        ports.set(id, port);
        return () => {
          port.dispose();
          ports.delete(id);
        };
      },
      registerOverlay() {
        overlayCount.value += 1;
        return () => {
          overlayCount.value = Math.max(0, overlayCount.value - 1);
        };
      },
      bindActivator,
      sourceIdsFor(id: DndId) {
        return options().sourceIdsFor?.(id) ?? [id];
      },
      itemTransform(id: DndId): DndDelta {
        const arrange = transforms.value.get(id) ?? { x: 0, y: 0 };
        const flyDelta = flyDeltas.value.get(id) ?? { x: 0, y: 0 };
        const isSource = sourceIds.value.includes(id);
        if (
          isSource &&
          !hasOverlay.value &&
          (phase.value === "pickup" || phase.value === "dragging")
        ) {
          return {
            x: pointer.value.x - startPointer.value.x,
            y: pointer.value.y - startPointer.value.y,
          };
        }
        return { x: arrange.x + flyDelta.x, y: arrange.y + flyDelta.y };
      },
      isSource(id: DndId) {
        return sourceIds.value.includes(id);
      },
      sourceMode,
      hideSource(id: DndId) {
        if (!sourceIds.value.includes(id) || !hasOverlay.value) return false;
        if (sourceMode.value === "clone" || sourceMode.value === "dim") return false;
        if (phase.value === "settling") return settle.value === "overlay";
        return phase.value === "pickup" || phase.value === "dragging";
      },
      isOverTarget(id: DndId) {
        return over.value !== null && "targetId" in over.value && over.value.targetId === id;
      },
      isOverSlot(id: DndId) {
        return over.value !== null && "slotId" in over.value && over.value.slotId === id;
      },
      overlayIndex(id: DndId) {
        return visibleSourceIds.value.indexOf(id);
      },
      overlayStyle(id: DndId) {
        const rect = overlayRects.value.get(id);
        if (!rect) return { display: "none" as const };
        return {
          position: "fixed" as const,
          left: "0",
          top: "0",
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          transform: `translate(${rect.x}px, ${rect.y}px)`,
          zIndex: String(1100 + visibleSourceIds.value.length - visibleSourceIds.value.indexOf(id)),
          pointerEvents: "none" as const,
        };
      },
    };
  },
);

function uniqueIds(ids: DndId[]): DndId[] {
  return [...new Set(ids)];
}

export function useDndSession() {
  const session = useInjectDndSession();
  if (!session) throw new Error("useDndSession must be used within a <DndRoot />");
  return session;
}

export function slotFromItem(slotItemMap: Record<DndId, DndId | null>, itemId: DndId) {
  return slotIdForItem(slotItemMap, itemId);
}
