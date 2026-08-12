import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { HoverCard, HoverCardTrigger, HoverCardContent, Button },
    template: `
      <HoverCard>
        <HoverCardTrigger as-child>
          <Button variant="link">@denser</Button>
        </HoverCardTrigger>
        <HoverCardContent class="w-64">
          <div class="space-y-1">
            <p class="text-sm font-medium">Denser</p>
            <p class="text-sm text-muted-foreground">Design system primitives for evolving artifacts.</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    `,
  }),
};
