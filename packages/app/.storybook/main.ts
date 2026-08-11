import type { StorybookConfig } from "@storybook/vue3-vite";
import { mergeConfig } from "vite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

const designSystemSrc = path.resolve(import.meta.dirname, "../../design-system/src");

const config: StorybookConfig = {
  stories: [
    "../src/features/**/stories/**/*.stories.@(js|jsx|mjs|ts|tsx|vue)",
    "../src/modules/**/stories/**/*.stories.@(js|jsx|mjs|ts|tsx|vue)",
  ],
  addons: ["sb-addon-vue-csf", "@storybook/addon-docs"],
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
          { find: "@", replacement: path.resolve(import.meta.dirname, "../src") },
        ],
      },
    });
  },
};

export default config;
