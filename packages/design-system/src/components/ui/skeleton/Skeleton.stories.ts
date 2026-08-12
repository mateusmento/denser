import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Skeleton } from "./index";

const meta = {
  title: "primitives/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div class="flex w-64 items-center gap-4">
        <Skeleton class="size-12 rounded-full" />
        <div class="space-y-2">
          <Skeleton class="h-4 w-40" />
          <Skeleton class="h-4 w-28" />
        </div>
      </div>
    `,
  }),
};
