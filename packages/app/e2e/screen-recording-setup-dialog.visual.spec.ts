import { expect, test } from "@playwright/test";
import { gotoStory, SELECTORS, STORIES, waitForLayout } from "./helpers";

const dialogBbox = `${SELECTORS.setupDialog} ${SELECTORS.cameraEditorBbox}`;
const dialogHover = `${SELECTORS.setupDialog} ${SELECTORS.cameraEditorHover}`;

test.describe("ScreenRecordingSetupDialog", () => {
  test("opens with webcam off and no camera overlay controls", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogWebcamOff, SELECTORS.setupDialog);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.avatarFallback)).toBeVisible();
    await expect(page.locator(dialogBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot("setup-webcam-off.png");
    runtime.assertClean();
  });

  test("opens with webcam on and no overlay editor until screen is on", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogWebcamOn, SELECTORS.setupDialog);
    await waitForLayout(page);

    await expect(page.locator(SELECTORS.webcamToggle)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(dialogBbox)).toHaveCount(0);
    await expect(page.locator(dialogHover)).toHaveCount(0);
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot("setup-webcam-on.png");
    runtime.assertClean();
  });

  test("shows edit affordance when screen and webcam are combined", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogCombined, SELECTORS.setupDialog);
    await waitForLayout(page);

    await expect(page.locator(dialogHover)).toHaveCount(1);
    await expect(page.locator(dialogBbox)).toHaveCount(0);
    await expect(page.locator(SELECTORS.overlayToggle)).toHaveCount(0);

    await page.locator(dialogHover).hover();
    await expect(page.getByRole("button", { name: "Edit camera overlay" })).toBeVisible();
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot("setup-combined-hover.png");
    runtime.assertClean();
  });

  test("shows resize handles in combined overlay edit mode", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogCombinedEdit, SELECTORS.setupDialog);
    await waitForLayout(page);

    await expect(page.locator(dialogBbox)).toHaveCount(1);
    await page.locator(dialogBbox).hover();
    await expect(page.getByRole("button", { name: "Confirm camera overlay" })).toBeVisible();
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot("setup-combined-edit.png");
    runtime.assertClean();
  });

  test("toggles avatar fallback from the webcam control", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogToggle, SELECTORS.setupDialog);
    await waitForLayout(page);

    const webcamToggle = page.locator(SELECTORS.webcamToggle);
    await expect(webcamToggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(SELECTORS.avatarFallback)).toHaveCount(0);

    await webcamToggle.click();
    await waitForLayout(page);
    await expect(webcamToggle).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(SELECTORS.avatarFallback)).toBeVisible();
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot(
      "dialog-webcam-toggled-off.png",
    );

    await webcamToggle.click();
    await waitForLayout(page);
    await expect(webcamToggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(SELECTORS.avatarFallback)).toHaveCount(0);
    await expect(page.locator(SELECTORS.setupDialog)).toHaveScreenshot(
      "dialog-webcam-toggled-on.png",
    );
    runtime.assertClean();
  });

  test("opens settings popover with device menus", async ({ page }) => {
    const runtime = await gotoStory(page, STORIES.dialogWebcamOn, SELECTORS.setupDialog);
    await waitForLayout(page);

    await page.locator(SELECTORS.settingsTrigger).click();
    await expect(page.getByRole("menuitem", { name: "Camera" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Microphone" })).toBeVisible();
    await expect(page.getByText("Mirror camera")).toBeVisible();
    runtime.assertClean();
  });
});
