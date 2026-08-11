import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./index";

const meta = {
  title: "primitives/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card class="w-80">
        <CardHeader>
          <CardTitle>Artifact</CardTitle>
          <CardDescription>Evolves with properties.</CardDescription>
        </CardHeader>
        <CardContent>Scaffold card body.</CardContent>
      </Card>
    `,
  }),
};
