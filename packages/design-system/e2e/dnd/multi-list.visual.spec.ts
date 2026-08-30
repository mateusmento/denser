import { expect, test } from "@playwright/test"
import { dragSteps, gotoStory, itemCenter, STORIES, waitFly } from "./helpers"

test("multi-list drag across columns", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.multiList)
  await expect(page).toHaveScreenshot("idle.png")

  const from = await itemCenter(page, "one")
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 10, from.y + 6)
  await page.waitForTimeout(280)
  await expect(page).toHaveScreenshot("pickup.png")

  const to = await itemCenter(page, "four")
  await dragSteps(page, { x: from.x + 10, y: from.y + 6 }, to, 14)
  await expect(page).toHaveScreenshot("dragging.png")

  await page.mouse.up()
  await waitFly(page)
  await expect(page.locator("[data-testid='dnd-list-doing'] [data-testid='dnd-item-one']")).toHaveCount(1)
  await expect(page).toHaveScreenshot("settled.png")
  runtime.assertClean()
})
