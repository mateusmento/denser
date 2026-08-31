import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { SearchIcon } from "@lucide/vue";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "./index";

const meta = {
  title: "primitives/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, SearchIcon },
    template: `
      <InputGroup class="w-72">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search artifacts…" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>⌘K</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    `,
  }),
};
