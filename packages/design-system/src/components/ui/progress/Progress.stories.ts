import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Progress } from "./index";

const meta = {
  title: "primitives/Progress",
  component: Progress,
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Progress },
    setup: () => {
      const value = ref(60);
      return { value };
    },
    template: `<Progress v-model="value" class="w-64" />`,
  }),
};
