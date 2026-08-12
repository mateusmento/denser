import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Label } from "./index";
import { Input } from "../input";

const meta = {
  title: "primitives/Label",
  component: Label,
  tags: ["autodocs"],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="grid w-64 gap-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>
    `,
  }),
};
