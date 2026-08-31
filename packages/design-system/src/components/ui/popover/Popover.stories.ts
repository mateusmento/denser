import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/Popover",
  component: Popover,
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverTrigger,
      PopoverContent,
      PopoverHeader,
      PopoverTitle,
      PopoverDescription,
      Button,
    },
    template: `
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent class="w-72">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the width and height for the artifact canvas.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    `,
  }),
};
