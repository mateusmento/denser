import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "./index";

const meta = {
  title: "primitives/NumberField",
  component: NumberField,
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      NumberField,
      NumberFieldContent,
      NumberFieldDecrement,
      NumberFieldInput,
      NumberFieldIncrement,
    },
    setup: () => {
      const value = ref(10);
      return { value };
    },
    template: `
      <NumberField v-model="value" :min="0" :max="100" class="w-32">
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    `,
  }),
};
