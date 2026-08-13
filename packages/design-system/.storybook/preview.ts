import type { Decorator, Preview } from "@storybook/vue3-vite";
import { DecoratorHelpers } from "@storybook/addon-themes";
import { addons } from "storybook/preview-api";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import {
  syncThemeOverrideFromStorage,
  THEME_OVERRIDE_EVENT,
  type ThemeMode,
} from "../src/theme";
import "../src/styles.css";
import "./preview.css";

const THEMES = ["light", "dark"] as const;
const DEFAULT_THEME = "light";

DecoratorHelpers.initializeThemeState([...THEMES], DEFAULT_THEME);

function themeMode(theme: string | undefined): ThemeMode {
  return theme === "dark" ? "dark" : "light";
}

function applyColorMode(theme: string | undefined) {
  const mode = themeMode(theme);
  document.documentElement.classList.toggle("dark", mode === "dark");
  syncThemeOverrideFromStorage(mode);
}

// Docs autodocs remounts stories outside the preview-hooks context, so do not call
// useGlobals() inside Vue setup. Sync from decorator context + channel updates.
let listeningForGlobals = false;
function ensureGlobalsListener() {
  if (listeningForGlobals || typeof window === "undefined") return;
  listeningForGlobals = true;
  addons.getChannel().on(GLOBALS_UPDATED, ({ globals }: { globals: { theme?: string } }) => {
    applyColorMode(globals.theme ?? DEFAULT_THEME);
  });
  window.addEventListener(THEME_OVERRIDE_EVENT, () => {
    syncThemeOverrideFromStorage(themeMode(document.documentElement.classList.contains("dark") ? "dark" : "light"));
  });
}

/**
 * Drive `.dark` from Storybook theme globals without preview hooks in Vue setup.
 */
const withColorMode: Decorator = (story, context) => {
  ensureGlobalsListener();
  applyColorMode((context.globals.theme as string | undefined) ?? DEFAULT_THEME);
  return story();
};

const preview: Preview = {
  initialGlobals: {
    theme: DEFAULT_THEME,
  },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: "centered",
    backgrounds: { disable: true },
  },
  decorators: [withColorMode],
};

export default preview;
