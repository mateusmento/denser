import { expect, test } from "@playwright/test";
import { gotoStory, SELECTORS, STORIES, waitForLayout } from "./helpers";

test.describe("VideoRecordingCameraEditor", () => {
  test("shows edit affordance when screen and webcam are combined", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.cameraEditorOn, SELECTORS.cameraEditorPreview);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.cameraEditorHover)).toHaveCount(1);
    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.overlayToggle)).toHaveCount(0);

    await page.locator(SELECTORS.cameraEditorHover).hover();
    await expect(page.getByRole("button", { name: "Edit camera overlay" })).toBeVisible();
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-overlay-on.png",
    );
    runtime.assertClean();
  });

  test("shows resize handles in overlay edit mode", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.cameraEditorEdit, SELECTORS.cameraEditorPreview);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(1);
    await page.locator(SELECTORS.cameraEditorBbox).hover();
    await expect(page.getByRole("button", { name: "Confirm camera overlay" })).toBeVisible();
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-overlay-edit.png",
    );
    runtime.assertClean();
  });

  test("removes overlay region from the DOM when overlay editor is disabled", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.cameraEditorOff, SELECTORS.cameraEditorPreview);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.cameraEditorHover)).toHaveCount(0);
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-overlay-off.png",
    );
    runtime.assertClean();
  });

  test("toggles resize handles with overlay edit mode", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.cameraEditorToggle, SELECTORS.cameraEditorPreview);
    await waitForLayout(page);

    const toggle = page.getByRole("checkbox", { name: "Overlay edit mode" });
    await expect(toggle).not.toBeChecked();
    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.cameraEditorHover)).toHaveCount(1);
    await expect(page.locator(SELECTORS.overlayToggle)).toHaveCount(0);

    await page.locator(SELECTORS.cameraEditorHover).hover();
    await expect(page.getByRole("button", { name: "Edit camera overlay" })).toBeVisible();

    await toggle.setChecked(true);
    await waitForLayout(page);
    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(1);
    await expect(page.locator(SELECTORS.cameraEditorHover)).toHaveCount(0);
    await page.locator(SELECTORS.cameraEditorBbox).hover();
    await expect(page.getByRole("button", { name: "Confirm camera overlay" })).toBeVisible();
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-toggled-on.png",
    );

    await toggle.setChecked(false);
    await waitForLayout(page);
    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.cameraEditorHover)).toHaveCount(1);
    await page.locator(SELECTORS.cameraEditorHover).hover();
    await expect(page.getByRole("button", { name: "Edit camera overlay" })).toBeVisible();
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-toggled-off.png",
    );
    runtime.assertClean();
  });
});
