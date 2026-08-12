import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { VisLine, VisXYContainer } from "@unovis/vue";
import { ChartContainer } from "./index";

const data = [
  { x: 0, y: 12 },
  { x: 1, y: 18 },
  { x: 2, y: 9 },
  { x: 3, y: 22 },
  { x: 4, y: 15 },
];

const meta = {
  title: "primitives/Chart",
  component: ChartContainer,
  tags: ["autodocs"],
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ChartContainer, VisXYContainer, VisLine },
    setup: () => ({
      data,
      config: {
        y: { label: "Value", color: "var(--chart-1)" },
      },
    }),
    template: `
      <ChartContainer :config="config" class="h-64 w-full max-w-lg">
        <VisXYContainer :data="data">
          <VisLine :x="(d) => d.x" :y="(d) => d.y" color="var(--chart-1)" />
        </VisXYContainer>
      </ChartContainer>
    `,
  }),
};
