import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { StickyMarker } from "./index";

const meta = {
  title: "primitives/StickyMarker",
  component: StickyMarker,
  tags: ["autodocs"],
} satisfies Meta<typeof StickyMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { StickyMarker },
    setup: () => ({ args }),
    template: `
      <div class="h-64 overflow-y-auto rounded-lg border border-border">
        <StickyMarker v-bind="args" class="bg-background">
          <template #label>Fri, Aug 14</template>
          <div class="space-y-3 px-3 pb-8 pt-2 text-sm text-muted-foreground">
            <p v-for="n in 12" :key="n">Scrollable row {{ n }} — sticky pill stays at the top.</p>
          </div>
        </StickyMarker>
        <StickyMarker class="bg-background">
          <template #label>Sat, Aug 15</template>
          <div class="space-y-3 px-3 pb-8 pt-2 text-sm text-muted-foreground">
            <p v-for="n in 8" :key="n">Next day row {{ n }}.</p>
          </div>
        </StickyMarker>
      </div>
    `,
  }),
};
