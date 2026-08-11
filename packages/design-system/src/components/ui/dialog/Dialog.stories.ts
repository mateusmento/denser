import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/Dialog",
  component: Dialog,
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogTrigger,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      Button,
    },
    template: `
      <Dialog>
        <DialogTrigger as-child>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Scaffold dialog content.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    `,
  }),
};
