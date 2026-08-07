import type { Meta, StoryObj } from "@storybook/vue3";
import HealthStatusBadge from "./HealthStatusBadge.vue";

const meta = {
  title: "features/home/HealthStatusBadge",
  component: HealthStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["unknown", "ok", "error"],
    },
  },
} satisfies Meta<typeof HealthStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unknown: Story = {
  args: { status: "unknown" },
};

export const Ok: Story = {
  args: { status: "ok" },
};

export const ErrorState: Story = {
  args: { status: "error" },
};
