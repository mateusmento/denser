import { expect, test } from "@playwright/test";
import { dragSteps, gotoStory, itemCenter, STORIES, waitFly } from "./helpers";

test("highlight grid over a folder", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.highlight);
  await expect(page).toHaveScreenshot("idle.png");

  const from = await itemCenter(page, "spec");
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 10, from.y);
  await page.waitForTimeout(280);
  await expect(page).toHaveScreenshot("pickup.png");

  const folder = await page.locator("[data-testid='dnd-target-eng']").boundingBox();
  if (!folder) throw new Error("Missing folder");
  await dragSteps(
    page,
    { x: from.x + 10, y: from.y },
    { x: folder.x + folder.width / 2, y: folder.y + folder.height / 2 },
  );
  await expect(page.locator("[data-testid='dnd-target-eng']")).toHaveAttribute("data-over", "true");
  await expect(page).toHaveScreenshot("dragging.png");

  await page.mouse.up();
  await waitFly(page);
  await expect(page.locator("[data-testid='dnd-highlight-status']")).toContainText("eng");
  await expect(page).toHaveScreenshot("settled.png");
  runtime.assertClean();
});
