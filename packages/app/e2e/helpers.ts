import { expect, type Page } from "@playwright/test";

export const STORIES = {
  cameraEditorOn: "features-conversation-screenrecordingcameraeditor--webcam-overlay-on",
  cameraEditorOff: "features-conversation-screenrecordingcameraeditor--webcam-overlay-off",
  cameraEditorToggle: "features-conversation-screenrecordingcameraeditor--toggle-webcam-overlay",
  dialogWebcamOn: "features-conversation-screenrecordingsetupdialog--setup-webcam-on",
  dialogWebcamOff: "features-conversation-screenrecordingsetupdialog--setup-webcam-off",
  dialogToggle: "features-conversation-screenrecordingsetupdialog--toggle-webcam-overlay",
} as const;

export const SELECTORS = {
  cameraEditorPreview: "[data-slot='screen-recording-camera-editor-preview']",
  cameraEditorBbox: "[data-slot='screen-recording-camera-editor-bbox']",
  setupDialog: "[data-slot='screen-recording-setup-dialog']",
  webcamSwitch: "#sr-webcam",
  cameraSelect: "#sr-webcam-device",
  micSelect: "#sr-mic-device",
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
