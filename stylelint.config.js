/** @type {import("stylelint").Config} */
export default {
  extends: [
    "stylelint-config-recommended",
    "@dreamsicle.io/stylelint-config-tailwindcss",
    "stylelint-config-recommended-vue",
  ],
  ignoreFiles: ["**/dist/**", "**/storybook-static/**", "**/coverage/**", "**/node_modules/**"],
  rules: {
    "import-notation": null,
  },
};
