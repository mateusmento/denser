import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Slider } from "./index";

const meta = {
  title: "primitives/Slider",
  component: Slider,
  tags: ["autodocs"],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Slider },
    setup: () => {
      const value = ref([50]);
      return { value };
    },
    template: `<Slider v-model="value" :max="100" :step="1" class="w-64" />`,
  }),
};
