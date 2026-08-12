import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./index";

const meta = {
  title: "primitives/Stepper",
  component: Stepper,
  tags: ["autodocs"],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Stepper,
      StepperItem,
      StepperTrigger,
      StepperIndicator,
      StepperTitle,
      StepperDescription,
      StepperSeparator,
    },
    setup: () => {
      const step = ref(1);
      return { step };
    },
    template: `
      <Stepper v-model="step" class="w-96">
        <StepperItem :step="1">
          <StepperTrigger>
            <StepperIndicator />
            <div class="text-left">
              <StepperTitle>Details</StepperTitle>
              <StepperDescription>Basic information</StepperDescription>
            </div>
          </StepperTrigger>
        </StepperItem>
        <StepperSeparator />
        <StepperItem :step="2">
          <StepperTrigger>
            <StepperIndicator />
            <div class="text-left">
              <StepperTitle>Review</StepperTitle>
              <StepperDescription>Confirm settings</StepperDescription>
            </div>
          </StepperTrigger>
        </StepperItem>
      </Stepper>
    `,
  }),
};
