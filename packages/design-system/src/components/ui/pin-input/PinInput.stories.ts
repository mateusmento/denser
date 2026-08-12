import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { PinInput, PinInputGroup, PinInputSlot } from "./index";

const meta = {
  title: "primitives/PinInput",
  component: PinInput,
  tags: ["autodocs"],
} satisfies Meta<typeof PinInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { PinInput, PinInputGroup, PinInputSlot },
    setup: () => {
      const value = ref<string[]>([]);
      return { value };
    },
    template: `
      <PinInput v-model="value" placeholder="○">
        <PinInputGroup>
          <PinInputSlot v-for="(_, index) in 4" :key="index" :index="index" />
        </PinInputGroup>
      </PinInput>
    `,
  }),
};
