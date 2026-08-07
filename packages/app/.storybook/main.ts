import type { StorybookConfig } from "@storybook/vue3-vite";
import { mergeConfig } from "vite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

const designSystemSrc = path.resolve(__dirname, "../../design-system/src");

const config: StorybookConfig = {
  stories: [
    "../src/features/**/presentationals/**/*.stories.@(ts|tsx|mdx)",
    "../src/modules/**/presentationals/**/*.stories.@(ts|tsx|mdx)",
  ],
  addons: ["@storybook/addon-essentials", "@storybook/addon-links"],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          {
            find: "@/lib/utils",
            replacement: path.join(designSystemSrc, "lib/utils.ts"),
          },
          {
            find: "@/components",
            replacement: path.join(designSystemSrc, "components"),
          },
          {
            find: "@/composables",
            replacement: path.join(designSystemSrc, "composables"),
          },
          { find: "@", replacement: path.resolve(__dirname, "../src") },
        ],
      },
    });
  },
};

export default config;
