import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { toast } from "vue-sonner";
import { Button } from "../button";
import { Toaster } from "./index";

const meta = {
  title: "primitives/Toaster",
  component: Toaster,
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Toaster, Button },
    setup: () => ({
      showToast: () => toast("Artifact saved"),
    }),
    template: `
      <div>
        <Button @click="showToast">Show toast</Button>
        <Toaster />
      </div>
    `,
  }),
};
