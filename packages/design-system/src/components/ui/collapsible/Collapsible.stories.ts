import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, Button },
    template: `
      <Collapsible class="w-80 space-y-2">
        <CollapsibleTrigger as-child>
          <Button variant="outline" class="w-full justify-between">Toggle details</Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="rounded-lg border p-4 text-sm text-muted-foreground">
          Hidden content revealed on expand.
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
};
