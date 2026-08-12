import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Separator } from "./index";

const meta = {
  title: "primitives/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="w-64 space-y-2">
        <p class="text-sm">Section above</p>
        <Separator />
        <p class="text-sm">Section below</p>
      </div>
    `,
  }),
};
