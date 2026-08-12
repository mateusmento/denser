import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { Label } from "../label";
import { Switch } from "./index";

const meta = {
  title: "primitives/Switch",
  component: Switch,
  tags: ["autodocs"],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Switch, Label },
    setup: () => {
      const checked = ref(false);
      return { checked };
    },
    template: `
      <div class="flex items-center gap-2">
        <Switch id="airplane" v-model:checked="checked" />
        <Label for="airplane">Airplane mode</Label>
      </div>
    `,
  }),
};
