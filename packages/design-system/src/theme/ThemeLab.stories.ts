import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed } from "vue";
import { ThemeLabGallery, ThemeLabPanel } from "./index";

const meta = {
  title: "foundations/ThemeLab",
  component: ThemeLabPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ThemeLabPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_args, { globals }) => ({
    components: { ThemeLabPanel, ThemeLabGallery },
    setup() {
      const mode = computed(() => (globals.theme === "dark" ? "dark" : "light") as "light" | "dark");
      return { mode };
    },
    template: `
      <div class="flex min-h-svh flex-col gap-4 bg-background text-foreground lg:flex-row lg:items-stretch lg:gap-0">
        <aside class="z-10 w-full shrink-0 border-b border-border bg-card lg:sticky lg:top-0 lg:h-svh lg:w-80 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <ThemeLabPanel :mode="mode" />
        </aside>
        <div class="min-h-0 min-w-0 flex-1 overflow-auto p-4">
          <ThemeLabGallery />
        </div>
      </div>
    `,
  }),
};
