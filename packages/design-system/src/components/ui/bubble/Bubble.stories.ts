import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Bubble, BubbleContent } from "./index";

const meta = {
  title: "primitives/Bubble",
  component: Bubble,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"],
    },
  },
} satisfies Meta<typeof Bubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Bubble, BubbleContent },
    setup: () => ({ args }),
    template: `
      <Bubble v-bind="args">
        <BubbleContent>Hello from the design system.</BubbleContent>
      </Bubble>
    `,
  }),
  args: { variant: "default" },
};

export const Secondary: Story = {
  render: () => ({
    components: { Bubble, BubbleContent },
    template: `
      <Bubble variant="secondary">
        <BubbleContent>Secondary bubble</BubbleContent>
      </Bubble>
    `,
  }),
};

export const Muted: Story = {
  render: () => ({
    components: { Bubble, BubbleContent },
    template: `
      <Bubble variant="muted">
        <BubbleContent>Muted bubble</BubbleContent>
      </Bubble>
    `,
  }),
};

export const Tinted: Story = {
  render: () => ({
    components: { Bubble, BubbleContent },
    template: `
      <Bubble variant="tinted">
        <BubbleContent>Tinted bubble</BubbleContent>
      </Bubble>
    `,
  }),
};

export const Outline: Story = {
  render: () => ({
    components: { Bubble, BubbleContent },
    template: `
      <Bubble variant="outline">
        <BubbleContent>Outline bubble</BubbleContent>
      </Bubble>
    `,
  }),
};

export const Ghost: Story = {
  render: () => ({
    components: { Bubble, BubbleContent },
    template: `
      <Bubble variant="ghost">
        <BubbleContent>Ghost bubble</BubbleContent>
      </Bubble>
    `,
  }),
};

export const Destructive: Story = {
  render: () => ({
    components: { Bubble, BubbleContent },
    template: `
      <Bubble variant="destructive">
        <BubbleContent>Something failed</BubbleContent>
      </Bubble>
    `,
  }),
};
