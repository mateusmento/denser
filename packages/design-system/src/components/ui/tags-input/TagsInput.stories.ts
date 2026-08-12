import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText } from "./index";

const meta = {
  title: "primitives/TagsInput",
  component: TagsInput,
  tags: ["autodocs"],
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { TagsInput, TagsInputItem, TagsInputItemText, TagsInputItemDelete, TagsInputInput },
    setup: () => {
      const modelValue = ref(["design", "system"]);
      return { modelValue };
    },
    template: `
      <TagsInput v-model="modelValue" class="w-80">
        <TagsInputItem v-for="tag in modelValue" :key="tag" :value="tag">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="Add tag…" />
      </TagsInput>
    `,
  }),
};
