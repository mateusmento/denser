import { ref } from "vue"
import { describe, expect, it, vi } from "vitest"
import { useSelection } from "./useSelection"

describe("useSelection", () => {
  const items = ["item-1", "item-2", "item-3", "item-4", "item-5"]

  it("initializes with empty selection", () => {
    const selection = useSelection({ items })
    expect(selection.hasSelection.value).toBe(false)
    expect(selection.count.value).toBe(0)
    expect(selection.selectedList.value).toEqual([])
    expect(selection.isSelected("item-1")).toBe(false)
  })

  it("selects and deselects single items", () => {
    const onChange = vi.fn()
    const selection = useSelection({ items, onSelectionChange: onChange })

    selection.select("item-2")
    expect(selection.isSelected("item-2")).toBe(true)
    expect(selection.count.value).toBe(1)
    expect(selection.anchorId.value).toBe("item-2")
    expect(onChange).toHaveBeenCalledWith(["item-2"])

    selection.deselect("item-2")
    expect(selection.isSelected("item-2")).toBe(false)
    expect(selection.count.value).toBe(0)
  })

  it("toggles items", () => {
    const selection = useSelection({ items })

    selection.toggle("item-3")
    expect(selection.isSelected("item-3")).toBe(true)

    selection.toggle("item-3")
    expect(selection.isSelected("item-3")).toBe(false)
  })

  it("handles range selection from anchor", () => {
    const selection = useSelection({ items })

    selection.select("item-2")
    selection.selectRange("item-4")

    expect(selection.selectedList.value).toEqual(["item-2", "item-3", "item-4"])
    expect(selection.count.value).toBe(3)
    expect(selection.anchorId.value).toBe("item-4")
  })

  it("handles backward range selection", () => {
    const selection = useSelection({ items })

    selection.select("item-4")
    selection.selectRange("item-2")

    expect(selection.selectedList.value).toEqual(["item-2", "item-3", "item-4"])
    expect(selection.count.value).toBe(3)
    expect(selection.anchorId.value).toBe("item-2")
  })

  it("accumulates multi-step ctrl and shift selections without losing items", () => {
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "I", "J"]
    const selection = useSelection({ items: alphabet })

    // 1. ctrl + click B
    selection.handleItemClick("B", { ctrlKey: true, shiftKey: false, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["B"])

    // 2. shift + click D -> B, C, D
    selection.handleItemClick("D", { ctrlKey: false, shiftKey: true, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["B", "C", "D"])

    // 3. ctrl + click F -> B, C, D, F
    selection.handleItemClick("F", { ctrlKey: true, shiftKey: false, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["B", "C", "D", "F"])

    // 4. shift + click I -> B, C, D, F, G, I
    selection.handleItemClick("I", { ctrlKey: false, shiftKey: true, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["B", "C", "D", "F", "G", "I"])

    // 5. ctrl + click E -> B, C, D, E, F, G, I
    selection.handleItemClick("E", { ctrlKey: true, shiftKey: false, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["B", "C", "D", "E", "F", "G", "I"])

    // 6. shift + click J -> B, C, D, E, F, G, I, J
    selection.handleItemClick("J", { ctrlKey: false, shiftKey: true, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["B", "C", "D", "E", "F", "G", "I", "J"])
  })

  it("handles range deselection when the last item action was deselect", () => {
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H"]
    const selection = useSelection({ items: alphabet })

    // 1. Select all
    selection.selectAll()
    expect(selection.selectedList.value).toEqual(alphabet)

    // 2. ctrl + click D -> deselects D (lastAction becomes 'deselect', anchor becomes D)
    selection.handleItemClick("D", { ctrlKey: true, shiftKey: false, metaKey: false } as MouseEvent)
    expect(selection.isSelected("D")).toBe(false)
    expect(selection.selectedList.value).toEqual(["A", "B", "C", "E", "F", "G", "H"])

    // 3. shift + click F -> range from D to F (D, E, F) are deselected
    selection.handleItemClick("F", { ctrlKey: false, shiftKey: true, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["A", "B", "C", "G", "H"])

    // 4. ctrl + click B -> deselects B
    selection.handleItemClick("B", { ctrlKey: true, shiftKey: false, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["A", "C", "G", "H"])

    // 5. shift + click A -> range from B to A (A, B) are deselected
    selection.handleItemClick("A", { ctrlKey: false, shiftKey: true, metaKey: false } as MouseEvent)
    expect(selection.selectedList.value).toEqual(["C", "G", "H"])
  })

  it("selects all items and clears selection", () => {
    const selection = useSelection({ items })

    selection.selectAll()
    expect(selection.count.value).toBe(5)
    expect(selection.selectedList.value).toEqual(items)

    selection.clear()
    expect(selection.count.value).toBe(0)
    expect(selection.anchorId.value).toBeNull()
  })

  it("handles modifier clicks via handleItemClick", () => {
    const selection = useSelection({ items })

    const plainRes = selection.handleItemClick("item-1", {
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
    } as MouseEvent)
    expect(plainRes.wasSelectionAction).toBe(false)
    expect(selection.count.value).toBe(0)

    const ctrlRes = selection.handleItemClick("item-1", {
      ctrlKey: true,
      shiftKey: false,
      metaKey: false,
    } as MouseEvent)
    expect(ctrlRes.wasSelectionAction).toBe(true)
    expect(selection.isSelected("item-1")).toBe(true)

    const shiftRes = selection.handleItemClick("item-3", {
      ctrlKey: false,
      shiftKey: true,
      metaKey: false,
    } as MouseEvent)
    expect(shiftRes.wasSelectionAction).toBe(true)
    expect(selection.selectedList.value).toEqual(["item-1", "item-2", "item-3"])
  })

  it("handles keyboard events via handleKeyDown", () => {
    const selection = useSelection({ items })

    const preventDefault = vi.fn()
    const ctrlA = {
      key: "a",
      ctrlKey: true,
      metaKey: false,
      preventDefault,
    } as unknown as KeyboardEvent

    selection.handleKeyDown(ctrlA)
    expect(preventDefault).toHaveBeenCalled()
    expect(selection.count.value).toBe(5)

    selection.handleKeyDown({
      key: "Escape",
      ctrlKey: false,
      metaKey: false,
    } as KeyboardEvent)
    expect(selection.count.value).toBe(0)
  })

  it("reacts when items ref changes", () => {
    const reactiveItems = ref(["a", "b", "c"])
    const selection = useSelection({ items: reactiveItems })

    selection.select("b")
    expect(selection.selectedList.value).toEqual(["b"])

    reactiveItems.value = ["b", "c", "d"]
    expect(selection.selectedList.value).toEqual(["b"])
  })
})
