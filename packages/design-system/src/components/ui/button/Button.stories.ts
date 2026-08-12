import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "./index";

const meta = {
  title: "primitives/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: `<Button v-bind="args">Continue</Button>`,
  }),
  args: { variant: "default", size: "default" },
};

export const Outline: Story = {
  render: () => ({
    components: { Button },
    template: `<Button variant="outline">Outline</Button>`,
  }),
};

export const Secondary: Story = {
  render: () => ({
    components: { Button },
    template: `<Button variant="secondary">Secondary</Button>`,
  }),
};

export const Ghost: Story = {
  render: () => ({
    components: { Button },
    template: `<Button variant="ghost">Ghost</Button>`,
  }),
};

export const Destructive: Story = {
  render: () => ({
    components: { Button },
    template: `<Button variant="destructive">Destructive</Button>`,
  }),
};

export const Link: Story = {
  render: () => ({
    components: { Button },
    template: `<Button variant="link">Link</Button>`,
  }),
};
