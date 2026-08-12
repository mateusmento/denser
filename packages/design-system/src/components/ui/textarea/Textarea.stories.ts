import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Textarea } from "./index";

const meta = {
  title: "primitives/Textarea",
  component: Textarea,
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Textarea },
    setup: () => ({ args }),
    template: `<Textarea v-bind="args" class="w-80" placeholder="Write a note…" />`,
  }),
};
