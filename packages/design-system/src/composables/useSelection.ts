import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from "vue";

export interface UseSelectionOptions {
  items: MaybeRefOrGetter<readonly string[]>;
  initialSelected?: readonly string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface UseSelectionReturn {
  selectedIds: Ref<Set<string>>;
  selectedList: ComputedRef<string[]>;
  anchorId: Ref<string | null>;
  lastAction: Ref<"select" | "deselect" | null>;
  hasSelection: ComputedRef<boolean>;
  count: ComputedRef<number>;

  isSelected: (id: string) => boolean;
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectRange: (toId: string) => void;
  selectAll: () => void;
  clear: () => void;
  setSelected: (ids: Iterable<string>) => void;

  handleItemClick: (
    id: string,
    event: MouseEvent | PointerEvent | KeyboardEvent,
  ) => { wasSelectionAction: boolean };
  handleKeyDown: (event: KeyboardEvent) => void;
}

export function useSelection(options: UseSelectionOptions): UseSelectionReturn {
  const selectedIds = ref(new Set<string>(options.initialSelected ?? []));
  const anchorId = ref<string | null>(options.initialSelected?.[0] ?? null);
  const lastAction = ref<"select" | "deselect" | null>(
    options.initialSelected && options.initialSelected.length > 0 ? "select" : null,
  );

  const selectedList = computed(() => {
    const all = toValue(options.items);
    return all.filter((id) => selectedIds.value.has(id));
  });

  const hasSelection = computed(() => selectedIds.value.size > 0);
  const count = computed(() => selectedIds.value.size);

  function notify() {
    options.onSelectionChange?.(selectedList.value);
  }

  function isSelected(id: string): boolean {
    return selectedIds.value.has(id);
  }

  function select(id: string) {
    const next = new Set(selectedIds.value);
    next.add(id);
    selectedIds.value = next;
    anchorId.value = id;
    lastAction.value = "select";
    notify();
  }

  function deselect(id: string) {
    if (!selectedIds.value.has(id)) return;
    const next = new Set(selectedIds.value);
    next.delete(id);
    selectedIds.value = next;
    anchorId.value = id;
    lastAction.value = "deselect";
    notify();
  }

  function toggle(id: string) {
    if (selectedIds.value.has(id)) {
      deselect(id);
    } else {
      select(id);
    }
  }

  function selectRange(toId: string) {
    const all = toValue(options.items);
    const targetIndex = all.indexOf(toId);
    if (targetIndex === -1) return;

    const effectiveAnchor = anchorId.value && all.includes(anchorId.value) ? anchorId.value : toId;
    const anchorIndex = all.indexOf(effectiveAnchor);
    if (anchorIndex === -1) return;

    const startIndex = Math.min(anchorIndex, targetIndex);
    const endIndex = Math.max(anchorIndex, targetIndex);
    const slice = all.slice(startIndex, endIndex + 1);

    // Range select or deselect depending on whether the last action was select or deselect.
    // If no prior action, default to selecting the range.
    const isDeselecting = lastAction.value === "deselect";
    const next = new Set(selectedIds.value);

    if (isDeselecting) {
      for (const item of slice) {
        next.delete(item);
      }
    } else {
      for (const item of slice) {
        next.add(item);
      }
    }

    selectedIds.value = next;
    anchorId.value = toId;
    notify();
  }

  function selectAll() {
    const all = toValue(options.items);
    selectedIds.value = new Set(all);
    if (all.length > 0 && (!anchorId.value || !all.includes(anchorId.value))) {
      anchorId.value = all[0] ?? null;
    }
    lastAction.value = "select";
    notify();
  }

  function clear() {
    if (selectedIds.value.size === 0 && anchorId.value === null) return;
    selectedIds.value = new Set();
    anchorId.value = null;
    lastAction.value = null;
    notify();
  }

  function setSelected(ids: Iterable<string>) {
    selectedIds.value = new Set(ids);
    anchorId.value = selectedIds.value.values().next().value ?? null;
    lastAction.value = selectedIds.value.size > 0 ? "select" : null;
    notify();
  }

  function handleItemClick(
    id: string,
    event: MouseEvent | PointerEvent | KeyboardEvent,
  ): { wasSelectionAction: boolean } {
    if (event.metaKey || event.ctrlKey) {
      toggle(id);
      return { wasSelectionAction: true };
    }
    if (event.shiftKey) {
      selectRange(id);
      return { wasSelectionAction: true };
    }
    return { wasSelectionAction: false };
  }

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && (event.key === "a" || event.key === "A")) {
      event.preventDefault();
      selectAll();
    } else if (event.key === "Escape") {
      clear();
    }
  }

  return {
    selectedIds,
    selectedList,
    anchorId,
    lastAction,
    hasSelection,
    count,
    isSelected,
    select,
    deselect,
    toggle,
    selectRange,
    selectAll,
    clear,
    setSelected,
    handleItemClick,
    handleKeyDown,
  };
}
