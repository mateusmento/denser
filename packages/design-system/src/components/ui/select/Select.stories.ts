import type { Meta, StoryObj } from "@storybook/vue3";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./index";

const meta = {
  title: "primitives/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
    template: `
      <Select>
        <SelectTrigger class="w-48">
          <SelectValue placeholder="Pick a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="board">Board</SelectItem>
          <SelectItem value="calendar">Calendar</SelectItem>
          <SelectItem value="timeline">Timeline</SelectItem>
        </SelectContent>
      </Select>
    `,
  }),
};
