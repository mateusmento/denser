import { expect, test } from "@playwright/test"
import { distance, dragSteps, gotoStory, holdAfterPickup, itemCenter, overlayBox, STORIES, waitFly } from "./helpers"

test("swap grid exchanges on drop", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.swap)
  await expect(page).toHaveScreenshot("idle.png")

  const from = await itemCenter(page, "weather")
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 10, from.y + 6)
  await page.waitForTimeout(280)
  await expect(page).toHaveScreenshot("pickup.png")

  const to = await itemCenter(page, "notes")
  await dragSteps(page, { x: from.x + 10, y: from.y + 6 }, to)
  await expect(page.locator("[data-testid='dnd-slot-s4']")).toHaveAttribute("data-over", "true")
  await expect(page).toHaveScreenshot("dragging.png")

  await page.mouse.up()
  await waitFly(page)
  await expect(page.locator("[data-testid='dnd-slot-s4'] [data-testid='dnd-item-weather']")).toHaveCount(1)
  await expect(page).toHaveScreenshot("settled.png")

  const notes = await itemCenter(page, "notes")
  const weather = await itemCenter(page, "weather")
  await holdAfterPickup(page, notes)
  const overlay = await overlayBox(page)
  const overlayCenter = { x: overlay.x + overlay.width / 2, y: overlay.y + overlay.height / 2 }
  expect(distance(overlayCenter, notes)).toBeLessThan(distance(overlayCenter, weather))
  expect(distance(overlayCenter, notes)).toBeLessThan(80)
  await page.mouse.up()
  await waitFly(page)
  runtime.assertClean()
})
