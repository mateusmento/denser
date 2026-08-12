import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { NativeSelect, NativeSelectOption } from "./index";

const meta = {
  title: "primitives/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { NativeSelect, NativeSelectOption },
    template: `
      <NativeSelect class="w-48">
        <NativeSelectOption value="board">Board</NativeSelectOption>
        <NativeSelectOption value="calendar">Calendar</NativeSelectOption>
        <NativeSelectOption value="timeline">Timeline</NativeSelectOption>
      </NativeSelect>
    `,
  }),
};
