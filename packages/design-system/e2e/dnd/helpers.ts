import { expect, type Page } from "@playwright/test";

export const STORIES = {
  sortable: "primitives-dnd--sortable-column",
  multiList: "primitives-dnd--multi-list",
  highlight: "primitives-dnd--highlight-grid",
  tabs: "primitives-dnd--in-flow-tabs",
  swap: "primitives-dnd--swap-grid",
  flock: "primitives-dnd--overlay-flock",
  itemSettle: "primitives-dnd--item-settle",
  overlaySettle: "primitives-dnd--overlay-settle",
  clickable: "primitives-dnd--clickable-items",
  sparse: "primitives-dnd--sparse-lists",
} as const;

export async function gotoStory(page: Page, id: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.waitForSelector("[data-slot='dnd-root']");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "* { caret-color: transparent !important; }" });
  return {
    assertClean() {
      expect(errors, errors.join("\n")).toEqual([]);
    },
  };
}

export async function itemBox(page: Page, id: string) {
  const box = await page.locator(`[data-testid="dnd-item-${id}"]`).boundingBox();
  if (!box) throw new Error(`No box for item ${id}`);
  return box;
}

export async function itemCenter(page: Page, id: string) {
  const box = await itemBox(page, id);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export async function dragSteps(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 12,
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(40);
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    );
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(200);
}

export async function waitFly(page: Page) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("[data-dnd-phase]");
      return root?.getAttribute("data-dnd-phase") === "idle";
    },
    { timeout: 4000 },
  );
}

export async function overlayBox(page: Page) {
  const box = await page.locator("[data-testid='dnd-overlay']").boundingBox();
  if (!box) throw new Error("No overlay box");
  return box;
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export async function holdAfterPickup(page: Page, from: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 12, from.y + 8);
  await page.waitForTimeout(280);
}
