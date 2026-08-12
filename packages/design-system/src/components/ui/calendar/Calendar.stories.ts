import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Calendar } from "./index";

const meta = {
  title: "primitives/Calendar",
  component: Calendar,
  tags: ["autodocs"],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Calendar },
    setup: () => {
      const value = ref(new Date());
      return { value };
    },
    template: `<Calendar v-model="value" class="rounded-lg border" />`,
  }),
};
