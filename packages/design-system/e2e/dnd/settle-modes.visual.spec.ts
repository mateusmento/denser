import { expect, test } from "@playwright/test";
import { dragSteps, gotoStory, itemCenter, STORIES, waitFly } from "./helpers";

for (const [name, story] of [
  ["item", STORIES.itemSettle],
  ["overlay", STORIES.overlaySettle],
] as const) {
  test(`${name} settle completes with overlay gone`, async ({ page }) => {
    const runtime = await gotoStory(page, story);
    await expect(page).toHaveScreenshot(`idle-${name}.png`);

    const from = await itemCenter(page, "b");
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 10, from.y + 8);
    await page.waitForTimeout(280);
    await expect(page).toHaveScreenshot(`pickup-${name}.png`);

    const to = await itemCenter(page, "c");
    await dragSteps(page, { x: from.x + 10, y: from.y + 8 }, to);
    await expect(page).toHaveScreenshot(`dragging-${name}.png`);

    await page.mouse.up();
    await waitFly(page);
    await expect(page.locator("[data-testid='dnd-overlay']")).toHaveCount(0);
    await expect(page).toHaveScreenshot(`settled-${name}.png`);
    runtime.assertClean();
  });
}
