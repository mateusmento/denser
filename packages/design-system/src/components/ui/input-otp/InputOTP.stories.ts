import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "./index";

const meta = {
  title: "primitives/InputOTP",
  component: InputOTP,
  tags: ["autodocs"],
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator },
    setup: () => {
      const value = ref("");
      return { value };
    },
    template: `
      <InputOTP v-model="value" :maxlength="6">
        <InputOTPGroup>
          <InputOTPSlot :index="0" />
          <InputOTPSlot :index="1" />
          <InputOTPSlot :index="2" />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot :index="3" />
          <InputOTPSlot :index="4" />
          <InputOTPSlot :index="5" />
        </InputOTPGroup>
      </InputOTP>
    `,
  }),
};
