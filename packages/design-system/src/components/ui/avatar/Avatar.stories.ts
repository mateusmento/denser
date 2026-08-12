import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Avatar, AvatarFallback, AvatarImage } from "./index";

const meta = {
  title: "primitives/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup: () => ({ args }),
    template: `
      <Avatar v-bind="args">
        <AvatarImage src="https://github.com/shadcn.png" alt="User" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    `,
  }),
  args: { size: "default" },
};

export const Sm: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
    `,
  }),
};

export const Lg: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    `,
  }),
};
