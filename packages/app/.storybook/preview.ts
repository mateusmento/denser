import type { Preview } from "@storybook/vue3-vite";
import { Toaster } from "@denser/design-system";
import { useColorModeOwner } from "../src/modules/theme";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: "centered",
  },
  decorators: [
    (_story, context) => {
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
          useColorModeOwner();
          return { shell };
        },
        template: `<div :class="shell"><story /><Toaster /></div>`,
      };
    },
  ],
};

export default preview;
