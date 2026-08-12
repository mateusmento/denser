import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "./index";

const meta = {
  title: "primitives/Combobox",
  component: Combobox,
  tags: ["autodocs"],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Combobox,
      ComboboxAnchor,
      ComboboxInput,
      ComboboxTrigger,
      ComboboxList,
      ComboboxItem,
      ComboboxEmpty,
    },
    setup: () => {
      const value = ref("");
      const options = ["Board", "Calendar", "Timeline"];
      return { value, options };
    },
    template: `
      <Combobox v-model="value" class="w-64">
        <ComboboxAnchor>
          <ComboboxInput placeholder="Pick a view…" />
          <ComboboxTrigger />
        </ComboboxAnchor>
        <ComboboxList>
          <ComboboxEmpty>No results.</ComboboxEmpty>
          <ComboboxItem v-for="option in options" :key="option" :value="option">
            {{ option }}
          </ComboboxItem>
        </ComboboxList>
      </Combobox>
    `,
  }),
};
