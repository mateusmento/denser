import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { AlertCircleIcon } from "@lucide/vue";
import { Alert, AlertDescription, AlertTitle } from "./index";

const meta = {
  title: "primitives/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, AlertCircleIcon },
    setup: () => ({ args }),
    template: `
      <Alert v-bind="args" class="w-96">
        <AlertCircleIcon />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>You can adjust artifact properties from the sidebar.</AlertDescription>
      </Alert>
    `,
  }),
  args: { variant: "default" },
};

export const Destructive: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, AlertCircleIcon },
    template: `
      <Alert variant="destructive" class="w-96">
        <AlertCircleIcon />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>Try saving again or refresh the page.</AlertDescription>
      </Alert>
    `,
  }),
};
