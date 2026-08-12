import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button } from "../button";
import { toast } from "./index";
import Toaster from "./Sonner.vue";

const meta = {
  title: "primitives/Toaster",
  component: Toaster,
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => ({
    components: { Button, Toaster },
    setup: () => ({
      ping: () => toast("Scheduled for tomorrow morning"),
    }),
    template: `<div><Button @click="ping">Show toast</Button><Toaster /></div>`,
  }),
};
