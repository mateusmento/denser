import { expect, test } from "@playwright/test";
import { gotoStory, SELECTORS, STORIES, waitForLayout } from "./helpers";

const dialogBbox = `${SELECTORS.setupDialog} ${SELECTORS.cameraEditorBbox}`;

test.describe("ScreenRecordingSetupDialog", () => {
  test("opens with webcam off and no camera overlay controls", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogWebcamOff, SELECTORS.setupDialog);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.webcamSwitch)).not.toBeChecked();
    await expect(page.locator(dialogBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot("setup-webcam-off.png");
    runtime.assertClean();
  });

  test("opens with webcam on and shows camera overlay controls", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogWebcamOn, SELECTORS.setupDialog);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.webcamSwitch)).toBeChecked();
    await expect(page.locator(dialogBbox)).toHaveCount(1);
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot("setup-webcam-on.png");
    runtime.assertClean();
  });

  test("toggles camera overlay controls from the webcam switch", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogToggle, SELECTORS.setupDialog);
    await waitForLayout(page);

    const webcamSwitch = page.locator(SELECTORS.webcamSwitch);
    await expect(webcamSwitch).toBeChecked();
    await expect(page.locator(dialogBbox)).toHaveCount(1);

    await webcamSwitch.click();
    await waitForLayout(page);
    await expect(webcamSwitch).not.toBeChecked();
    await expect(page.locator(dialogBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot(
      "dialog-webcam-toggled-off.png",
    );

    await webcamSwitch.click();
    await waitForLayout(page);
    await expect(webcamSwitch).toBeChecked();
    await expect(page.locator(dialogBbox)).toHaveCount(1);
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot(
      "dialog-webcam-toggled-on.png",
    );
    runtime.assertClean();
  });
});
