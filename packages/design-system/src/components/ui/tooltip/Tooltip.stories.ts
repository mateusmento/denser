import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button },
    template: `
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    `,
  }),
};
