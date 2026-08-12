import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { AspectRatio } from "./index";

const meta = {
  title: "primitives/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="w-80">
        <AspectRatio :ratio="16 / 9" class="overflow-hidden rounded-lg bg-muted">
          <div class="flex size-full items-center justify-center text-sm text-muted-foreground">
            16:9
          </div>
        </AspectRatio>
      </div>
    `,
  }),
};
