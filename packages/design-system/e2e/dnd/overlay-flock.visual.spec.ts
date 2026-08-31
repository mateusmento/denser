import { expect, test } from "@playwright/test";
import { dragSteps, gotoStory, itemCenter, STORIES, waitFly } from "./helpers";

test("overlay flock shows at most three tiles", async ({ page }) => {
  const runtime = await gotoStory(page, STORIES.flock);
  await expect(page).toHaveScreenshot("idle.png");

  const from = await itemCenter(page, "one");
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 12, from.y + 8);
  await page.waitForTimeout(280);
  await expect(page.locator("[data-slot='dnd-overlay']")).toHaveCount(3);
  const flock = await page.locator("[data-slot='dnd-overlay']").all();
  const boxes = await Promise.all(flock.map(async (overlay) => overlay.boundingBox()));
  const roots = boxes.filter((box): box is NonNullable<typeof box> => box !== null);
  const span = Math.max(
    ...roots.flatMap((a) => roots.map((b) => Math.hypot(a.x - b.x, a.y - b.y))),
  );
  expect(span).toBeLessThan(40);
  await expect(page).toHaveScreenshot("pickup.png");

  const inbox = await page.locator("[data-testid='dnd-target-inbox']").boundingBox();
  if (!inbox) throw new Error("Missing inbox");
  await dragSteps(
    page,
    { x: from.x + 12, y: from.y + 8 },
    { x: inbox.x + inbox.width / 2, y: inbox.y + inbox.height / 2 },
  );
  await expect(page.locator("[data-slot='dnd-overlay']")).toHaveCount(3);
  await expect(page).toHaveScreenshot("dragging.png");

  await page.mouse.up();
  await waitFly(page);
  await expect(page.locator("[data-slot='dnd-overlay']")).toHaveCount(0);
  await expect(page).toHaveScreenshot("settled.png");
  runtime.assertClean();
});
