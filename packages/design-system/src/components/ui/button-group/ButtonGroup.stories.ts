import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { ButtonGroup, Button, ButtonGroupText },
    setup: () => ({ args }),
    template: `
      <ButtonGroup v-bind="args">
        <Button variant="outline">Left</Button>
        <ButtonGroupText>or</ButtonGroupText>
        <Button variant="outline">Right</Button>
      </ButtonGroup>
    `,
  }),
  args: { orientation: "horizontal" },
};

export const Vertical: Story = {
  render: () => ({
    components: { ButtonGroup, Button, ButtonGroupSeparator },
    template: `
      <ButtonGroup orientation="vertical">
        <Button variant="outline">Top</Button>
        <ButtonGroupSeparator />
        <Button variant="outline">Bottom</Button>
      </ButtonGroup>
    `,
  }),
};
