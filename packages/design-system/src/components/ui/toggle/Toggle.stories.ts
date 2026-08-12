import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { BoldIcon } from "@lucide/vue";
import { Toggle } from "./index";

const meta = {
  title: "primitives/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Toggle, BoldIcon },
    setup: () => ({ args }),
    template: `
      <Toggle v-bind="args" aria-label="Toggle bold">
        <BoldIcon />
      </Toggle>
    `,
  }),
  args: { variant: "default", size: "default" },
};

export const Outline: Story = {
  render: () => ({
    components: { Toggle, BoldIcon },
    template: `
      <Toggle variant="outline" aria-label="Toggle bold">
        <BoldIcon />
      </Toggle>
    `,
  }),
};

export const Sm: Story = {
  render: () => ({
    components: { Toggle, BoldIcon },
    template: `
      <Toggle size="sm" aria-label="Toggle bold">
        <BoldIcon />
      </Toggle>
    `,
  }),
};

export const Lg: Story = {
  render: () => ({
    components: { Toggle, BoldIcon },
    template: `
      <Toggle size="lg" aria-label="Toggle bold">
        <BoldIcon />
      </Toggle>
    `,
  }),
};
