import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Marker, MarkerContent } from "./index";

const meta = {
  title: "primitives/Marker",
  component: Marker,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "separator", "border"],
    },
  },
} satisfies Meta<typeof Marker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Marker, MarkerContent },
    setup: () => ({ args }),
    template: `
      <Marker v-bind="args" class="w-80">
        <MarkerContent>Today</MarkerContent>
      </Marker>
    `,
  }),
  args: { variant: "default" },
};

export const Separator: Story = {
  render: () => ({
    components: { Marker, MarkerContent },
    template: `
      <Marker variant="separator" class="w-80">
        <MarkerContent>Yesterday</MarkerContent>
      </Marker>
    `,
  }),
};

export const Border: Story = {
  render: () => ({
    components: { Marker, MarkerContent },
    template: `
      <Marker variant="border" class="w-80">
        <MarkerContent>Section</MarkerContent>
      </Marker>
    `,
  }),
};
