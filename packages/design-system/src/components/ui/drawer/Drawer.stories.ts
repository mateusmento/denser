import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/Drawer",
  component: Drawer,
  tags: ["autodocs"],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Drawer,
      DrawerTrigger,
      DrawerContent,
      DrawerHeader,
      DrawerTitle,
      DrawerDescription,
      DrawerFooter,
      DrawerClose,
      Button,
    },
    template: `
      <Drawer>
        <DrawerTrigger as-child>
          <Button variant="outline">Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>Make changes here. Click save when done.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose as-child>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button>Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
};
