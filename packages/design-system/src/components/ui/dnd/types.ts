export type DndId = string

export type DndPoint = {
  x: number
  y: number
}

export type DndRect = DndPoint & {
  width: number
  height: number
}

export type DndAxis = "horizontal" | "vertical"

export type DndPolicy = "sort" | "highlight" | "swap"

export type DndSettle = "item" | "overlay"

export type DndSwapMode = "drop" | "hover"

export type DndPhase = "idle" | "pickup" | "dragging" | "settling"

export type DndFrom = { listId: DndId } | { slotId: DndId }

export type DndOver =
  | { listId: DndId; index: number }
  | { slotId: DndId }
  | { targetId: DndId }

export type DndCommitPayload = {
  sourceIds: DndId[]
  from: DndFrom
  over: DndOver | null
  canceled: boolean
}

export type ItemSnapshot = DndRect & {
  id: DndId
  listId?: DndId
  slotId?: DndId
  index: number
}

export type ListSnapshot = DndRect & {
  id: DndId
  orientation: DndAxis
  gap: number
}

export type SlotSnapshot = DndRect & {
  id: DndId
  occupantId: DndId | null
}

export type TargetSnapshot = DndRect & {
  id: DndId
}

export type GeometrySnapshot = {
  items: ItemSnapshot[]
  lists: ListSnapshot[]
  slots: SlotSnapshot[]
  targets: TargetSnapshot[]
  scroll: DndPoint
}

export type DndDelta = DndPoint

export type DndSensorEvent =
  | { type: "start"; point: DndPoint; pointerId: number; event: PointerEvent }
  | { type: "move"; point: DndPoint; pointerId: number; event: PointerEvent }
  | { type: "end"; point: DndPoint; pointerId: number; event: PointerEvent }
  | { type: "cancel" }

export type DndSensor = {
  bind: (element: HTMLElement, emit: (event: DndSensorEvent) => void) => () => void
}

export type DndScrollPort = {
  readonly offset: DndPoint
  readonly viewportSize: { width: number; height: number }
  readonly viewportRect: DndRect
  scrollBy: (delta: DndPoint) => void
  subscribe: (fn: () => void) => () => void
  dispose: () => void
}
