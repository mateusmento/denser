import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ScrollArea } from "./index";

const meta = {
  title: "primitives/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ScrollArea },
    template: `
      <ScrollArea class="h-48 w-64 rounded-lg border p-4">
        <div class="space-y-2 pr-4">
          <p v-for="index in 20" :key="index" class="text-sm">Scrollable line {{ index }}</p>
        </div>
      </ScrollArea>
    `,
  }),
};
