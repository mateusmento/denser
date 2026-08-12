import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Checkbox } from "./index";
import { Label } from "../label";

const meta = {
  title: "primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Checkbox, Label },
    template: `
      <div class="flex items-center gap-2">
        <Checkbox id="terms" />
        <Label for="terms">Accept terms</Label>
      </div>
    `,
  }),
};
