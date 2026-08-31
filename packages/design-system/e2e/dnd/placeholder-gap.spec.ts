import { expect, test } from "@playwright/test"
import { dragSteps, gotoStory, itemBox, itemCenter, STORIES } from "./helpers"

test("placeholder after a single item keeps the list gap", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.sparse)
  const from = await itemCenter(page, "task-3")
  const target = await itemBox(page, "task-4")
  await dragSteps(page, from, { x: target.x + target.width / 2, y: target.y + target.height + 24 })

  const placeholder = await page.locator("[data-testid='dnd-placeholder']").boundingBox()
  const settled = await itemBox(page, "task-4")
  expect(placeholder).toBeTruthy()
  expect(placeholder!.y).toBeGreaterThan(settled.y + settled.height + 4)

  await page.mouse.up()
  runtime.assertClean()
})
