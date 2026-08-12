import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Kbd, KbdGroup } from "./index";

const meta = {
  title: "primitives/Kbd",
  component: Kbd,
  tags: ["autodocs"],
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Kbd, KbdGroup },
    template: `
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    `,
  }),
};
