import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { FileIcon } from "@lucide/vue";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./index";

const meta = {
  title: "primitives/Item",
  component: Item,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "muted"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "xs"],
    },
  },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, FileIcon },
    setup: () => ({ args }),
    template: `
      <Item v-bind="args" class="w-80">
        <ItemMedia variant="icon">
          <FileIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Artifact spec</ItemTitle>
          <ItemDescription>Updated 2 hours ago</ItemDescription>
        </ItemContent>
      </Item>
    `,
  }),
  args: { variant: "default", size: "default" },
};

export const Outline: Story = {
  render: () => ({
    components: { Item, ItemContent, ItemTitle, FileIcon, ItemMedia },
    template: `
      <Item variant="outline" class="w-80">
        <ItemMedia variant="icon"><FileIcon /></ItemMedia>
        <ItemContent><ItemTitle>Outline item</ItemTitle></ItemContent>
      </Item>
    `,
  }),
};

export const Muted: Story = {
  render: () => ({
    components: { Item, ItemContent, ItemTitle },
    template: `
      <Item variant="muted" class="w-80">
        <ItemContent><ItemTitle>Muted item</ItemTitle></ItemContent>
      </Item>
    `,
  }),
};

export const Sm: Story = {
  render: () => ({
    components: { Item, ItemContent, ItemTitle },
    template: `
      <Item size="sm" class="w-80">
        <ItemContent><ItemTitle>Small item</ItemTitle></ItemContent>
      </Item>
    `,
  }),
};

export const Xs: Story = {
  render: () => ({
    components: { Item, ItemContent, ItemTitle },
    template: `
      <Item size="xs" class="w-80">
        <ItemContent><ItemTitle>Extra small item</ItemTitle></ItemContent>
      </Item>
    `,
  }),
};
