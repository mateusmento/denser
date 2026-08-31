import { expect, test } from "@playwright/test";
import { dragSteps, gotoStory, itemCenter, STORIES, waitFly } from "./helpers";

test("in-flow tabs reorder without an overlay", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.tabs);
  await expect(page).toHaveScreenshot("idle.png");

  const from = await itemCenter(page, "board");
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 16, from.y);
  await page.waitForTimeout(280);
  await expect(page.locator("[data-testid='dnd-overlay']")).toHaveCount(0);
  await expect(page).toHaveScreenshot("pickup.png");

  const to = await itemCenter(page, "chat");
  await dragSteps(page, { x: from.x + 16, y: from.y }, to);
  await expect(page).toHaveScreenshot("dragging.png");

  await page.mouse.up();
  await waitFly(page);
  await expect(page).toHaveScreenshot("settled.png");
  runtime.assertClean();
});
