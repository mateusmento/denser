import type { Meta, StoryObj } from "@storybook/vue3";
import { Input } from "./index";

const meta = {
  title: "primitives/Input",
  component: Input,
  tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Input },
    setup: () => ({ args }),
    template: `<Input v-bind="args" class="w-64" placeholder="Search…" />`,
  }),
};
