import { expect, type Page } from "@playwright/test";

export const STORIES = {
  cameraEditorOn: "features-conversation-screenrecordingcameraeditor--webcam-overlay-on",
  cameraEditorEdit: "features-conversation-screenrecordingcameraeditor--webcam-overlay-edit-mode",
  cameraEditorOff: "features-conversation-screenrecordingcameraeditor--webcam-overlay-off",
  cameraEditorToggle: "features-conversation-screenrecordingcameraeditor--toggle-overlay-edit-mode",
  dialogWebcamOn: "features-conversation-screenrecordingsetupdialog--setup-webcam-on",
  dialogWebcamOff: "features-conversation-screenrecordingsetupdialog--setup-webcam-off",
  dialogToggle: "features-conversation-screenrecordingsetupdialog--toggle-webcam-overlay",
  dialogCombined: "features-conversation-screenrecordingsetupdialog--combined-screen-and-webcam",
  dialogCombinedEdit: "features-conversation-screenrecordingsetupdialog--combined-overlay-edit-mode",
} as const;

export const SELECTORS = {
  cameraEditorPreview: "[data-slot='video-recording-camera-editor-preview']",
  cameraEditorBbox: "[data-slot='video-recording-camera-editor-bbox']",
  cameraEditorHover: "[data-slot='video-recording-camera-editor-hover']",
  overlayToggle: "[data-slot='video-recording-overlay-toggle']",
  setupDialog: "[data-slot='video-recording-setup-dialog']",
  webcamToggle: "[data-slot='video-recording-webcam-toggle']",
  screenToggle: "[data-slot='video-recording-screen-toggle']",
  settingsTrigger: "[data-slot='video-recording-settings-trigger']",
  avatarFallback: "[data-slot='video-recording-avatar-fallback']",
} as const;

export async function gotoStory(page: Page, id: string, waitSelector: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.waitForSelector(waitSelector);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "* { caret-color: transparent !important; }" });

  return {
    assertClean() {
      expect(errors, errors.join("\n")).toEqual([]);
    },
  };
}

export async function waitForLayout(page: Page) {
  await page.waitForTimeout(150);
}
