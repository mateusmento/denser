import { expect, test } from "@playwright/test"
import { dragSteps, gotoStory, itemCenter, STORIES, waitFly } from "./helpers"

test("inner buttons click unless a drag starts", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.clickable)

  await page.locator("[data-testid='dnd-open-bravo']").click()
  await expect(page.locator("[data-testid='dnd-last-click']")).toHaveText("open:bravo")

  await page.locator("[data-testid='dnd-close-bravo']").click()
  await expect(page.locator("[data-testid='dnd-last-click']")).toHaveText("close:bravo")

  const from = await itemCenter(page, "alpha")
  const to = await itemCenter(page, "charlie")
  await dragSteps(page, from, to)
  await page.mouse.up()
  await waitFly(page)

  await expect(page.locator("[data-testid='dnd-last-click']")).toHaveText("close:bravo")
  const order = await page.locator("[data-testid^='dnd-item-']").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-testid")),
  )
  expect(order[0]).toBe("dnd-item-bravo")

  await page.locator("[data-testid='dnd-open-charlie']").click()
  await expect(page.locator("[data-testid='dnd-last-click']")).toHaveText("open:charlie")
  runtime.assertClean()
})
