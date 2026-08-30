import { expect, test } from "@playwright/test"
import { dragSteps, gotoStory, holdAfterPickup, itemCenter, STORIES, waitFly } from "./helpers"

test("sortable column checkpoints", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.sortable)
  await expect(page).toHaveScreenshot("idle.png")

  const from = await itemCenter(page, "bravo")
  await holdAfterPickup(page, from)
  await expect(page.locator("[data-testid='dnd-overlay']")).toBeVisible()
  await expect(page).toHaveScreenshot("pickup.png")

  const to = await itemCenter(page, "delta")
  await dragSteps(page, { x: from.x + 12, y: from.y + 8 }, to, 10)
  await expect(page.locator("[data-testid='dnd-placeholder']")).toBeVisible()
  await expect(page).toHaveScreenshot("dragging.png")

  await page.mouse.up()
  await waitFly(page)
  await expect(page.locator("[data-testid='dnd-overlay']")).toHaveCount(0)
  const order = await page.locator("[data-testid^='dnd-item-']").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-testid")),
  )
  expect(order).toContain("dnd-item-bravo")
  await expect(page).toHaveScreenshot("settled.png")
  runtime.assertClean()
})
