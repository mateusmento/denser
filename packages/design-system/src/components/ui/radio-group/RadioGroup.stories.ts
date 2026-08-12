import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "./index";

const meta = {
  title: "primitives/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup: () => {
      const value = ref("board");
      return { value };
    },
    template: `
      <RadioGroup v-model="value" class="grid gap-3">
        <div class="flex items-center gap-2">
          <RadioGroupItem id="board" value="board" />
          <Label for="board">Board</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem id="calendar" value="calendar" />
          <Label for="calendar">Calendar</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem id="timeline" value="timeline" />
          <Label for="timeline">Timeline</Label>
        </div>
      </RadioGroup>
    `,
  }),
};
