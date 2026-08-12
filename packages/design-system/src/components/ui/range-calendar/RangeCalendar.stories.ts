import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { DateRange } from "reka-ui";
import { ref } from "vue";
import { RangeCalendar } from "./index";

const meta = {
  title: "primitives/RangeCalendar",
  component: RangeCalendar,
  tags: ["autodocs"],
} satisfies Meta<typeof RangeCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup: () => {
      const value = ref<DateRange>({
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      return { value };
    },
    template: `<RangeCalendar v-model="value" class="rounded-lg border" />`,
  }),
};
