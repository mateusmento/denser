import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import pluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

const vueAndTs = ["**/*.vue", "**/*.ts", "**/*.mts", "**/*.cts"];

const tailwindIgnore = ["^rt-", "^cn-", "^toaster$"];

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/storybook-static/**",
      "**/coverage/**",
      "packages/api/drizzle/meta/**",
      ".cursor/**",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  {
    files: vueAndTs,
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      "no-undef": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "error",
    },
  },
  {
    files: ["packages/app/**/*.{ts,vue}", "packages/design-system/**/*.{ts,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      "packages/api/**/*.ts",
      "packages/e2e/**/*.ts",
      "packages/*/*.config.ts",
      "packages/*/.storybook/**/*.{ts,js}",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["packages/design-system/**/*.{ts,vue}"],
    ...pluginBetterTailwindcss.configs.correctness,
    settings: {
      "better-tailwindcss": {
        cwd: "packages/design-system",
        entryPoint: "src/styles.css",
        detectComponentClasses: true,
      },
    },
    rules: {
      ...pluginBetterTailwindcss.configs.correctness.rules,
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-unknown-classes": ["error", { ignore: tailwindIgnore }],
    },
  },
  {
    files: ["packages/app/**/*.{ts,vue}"],
    ...pluginBetterTailwindcss.configs.correctness,
    settings: {
      "better-tailwindcss": {
        cwd: "packages/design-system",
        entryPoint: "src/styles.css",
        detectComponentClasses: true,
      },
    },
    rules: {
      ...pluginBetterTailwindcss.configs.correctness.rules,
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-unknown-classes": ["error", { ignore: tailwindIgnore }],
    },
  },
  {
    files: ["packages/design-system/src/components/ui/**/*.{ts,vue}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "better-tailwindcss/no-unknown-classes": [
        "error",
        {
          ignore: [
            ...tailwindIgnore,
            "^text-md$",
            "^origin-top-center$",
            "text-destructive-foreground",
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
);
