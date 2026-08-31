import { setup, type Decorator, type Preview } from "@storybook/vue3-vite";
import { createMemoryHistory, createRouter } from "vue-router";
import { DecoratorHelpers } from "@storybook/addon-themes";
import { addons } from "storybook/preview-api";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import {
  syncThemeOverrideFromStorage,
  THEME_OVERRIDE_EVENT,
  Toaster,
  type ThemeMode,
} from "@denser/design-system";
import { useColorModeOwner } from "../src/modules/theme";
import "../src/styles.css";
import "./preview.css";

const storyRouter = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }],
});

setup((app) => {
  if (!app.config.globalProperties.$router) {
    app.use(storyRouter);
  }
});

const THEMES = ["light", "dark"] as const;
const DEFAULT_THEME = "light";

DecoratorHelpers.initializeThemeState([...THEMES], DEFAULT_THEME);

function themeMode(theme: string | undefined): ThemeMode {
  return theme === "dark" ? "dark" : "light";
}

function applyColorMode(theme: string | undefined, syncOwner = false) {
  const next = themeMode(theme);
  document.documentElement.classList.toggle("dark", next === "dark");
  syncThemeOverrideFromStorage(next);
  if (syncOwner) {
    useColorModeOwner().mode.value = next;
  }
}

let listeningForGlobals = false;
function ensureGlobalsListener() {
  if (listeningForGlobals || typeof window === "undefined") return;
  listeningForGlobals = true;
  addons.getChannel().on(GLOBALS_UPDATED, ({ globals }: { globals: { theme?: string } }) => {
    // Owner exists once any story setup has run; keep ThemeSwitcher aligned with toolbar.
    applyColorMode(globals.theme ?? DEFAULT_THEME, true);
  });
  window.addEventListener(THEME_OVERRIDE_EVENT, () => {
    syncThemeOverrideFromStorage(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  });
}

const withAppShell: Decorator = (story, context) => {
  ensureGlobalsListener();
  const theme = (context.globals.theme as string | undefined) ?? DEFAULT_THEME;
  applyColorMode(theme);

  const fillViewport =
    context.parameters.layout === "fullscreen" && context.parameters.fullHeight === true;
  const canvas = context.viewMode === "story";
  const shell = fillViewport
    ? canvas
      ? "flex h-svh min-h-0 flex-col overflow-hidden bg-background text-foreground"
      : "flex h-[40rem] min-h-0 flex-col overflow-hidden bg-background text-foreground"
    : "min-h-0 bg-background text-foreground";

  return {
    components: { Toaster },
    setup() {
      applyColorMode(theme, true);
      return { shell };
    },
    template: `<div :class="shell"><story /><Toaster /></div>`,
  };
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
  decorators: [withAppShell],
};

export default preview;
