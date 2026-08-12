import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Badge } from "./index";

const meta = {
  title: "primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: `<Badge v-bind="args">Status</Badge>`,
  }),
  args: { variant: "default" },
};

export const Secondary: Story = {
  render: () => ({
    components: { Badge },
    template: `<Badge variant="secondary">Secondary</Badge>`,
  }),
};

export const Destructive: Story = {
  render: () => ({
    components: { Badge },
    template: `<Badge variant="destructive">Destructive</Badge>`,
  }),
};

export const Outline: Story = {
  render: () => ({
    components: { Badge },
    template: `<Badge variant="outline">Outline</Badge>`,
  }),
};

export const Ghost: Story = {
  render: () => ({
    components: { Badge },
    template: `<Badge variant="ghost">Ghost</Badge>`,
  }),
};

export const Link: Story = {
  render: () => ({
    components: { Badge },
    template: `<Badge variant="link">Link</Badge>`,
  }),
};
