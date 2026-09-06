import { expect, test } from "@playwright/test";
import { gotoStory, SELECTORS, STORIES, waitForLayout } from "./helpers";

test.describe("ScreenRecordingCameraEditor", () => {
  test("shows resize overlay when webcam is enabled", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.cameraEditorOn, SELECTORS.cameraEditorPreview);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(1);
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-overlay-on.png",
    );
    runtime.assertClean();
  });

  test("removes resize overlay from the DOM when webcam is disabled", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.cameraEditorOff, SELECTORS.cameraEditorPreview);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-overlay-off.png",
    );
    runtime.assertClean();
  });

  test("toggles resize overlay visibility with webcam switch state", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.cameraEditorToggle, SELECTORS.cameraEditorPreview);
    await waitForLayout(page);

    const toggle = page.getByRole("checkbox", { name: "Webcam enabled" });
    await expect(toggle).toBeChecked();
    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(1);

    await toggle.setChecked(false);
    await waitForLayout(page);
    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-toggled-off.png",
    );

    await toggle.setChecked(true);
    await waitForLayout(page);
    await expect(page.locator(SELECTORS.cameraEditorBbox)).toHaveCount(1);
    await expect(page.locator(SELECTORS.cameraEditorPreview)).toHaveScreenshot(
      "webcam-toggled-on.png",
    );
    runtime.assertClean();
  });
});
