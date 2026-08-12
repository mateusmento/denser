import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "@lucide/vue";
import { ToggleGroup, ToggleGroupItem } from "./index";

const meta = {
  title: "primitives/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, BoldIcon, ItalicIcon, UnderlineIcon },
    setup: () => {
      const value = ref<string[]>(["bold"]);
      return { value };
    },
    template: `
      <ToggleGroup v-model="value" type="multiple">
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};

export const Outline: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, BoldIcon, ItalicIcon, UnderlineIcon },
    setup: () => {
      const value = ref<string[]>(["bold"]);
      return { value };
    },
    template: `
      <ToggleGroup v-model="value" type="multiple" variant="outline">
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};

export const Single: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem },
    setup: () => {
      const value = ref("system");
      return { value };
    },
    template: `
      <ToggleGroup v-model="value" type="single" variant="outline">
        <ToggleGroupItem value="light">Light</ToggleGroupItem>
        <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
        <ToggleGroupItem value="system">System</ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, BoldIcon, ItalicIcon, UnderlineIcon },
    setup: () => {
      const value = ref<string[]>(["bold"]);
      return { value };
    },
    template: `
      <ToggleGroup v-model="value" type="multiple" variant="outline" orientation="vertical">
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};
