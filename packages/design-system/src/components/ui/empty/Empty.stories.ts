import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { FolderOpenIcon } from "@lucide/vue";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./index";
import { Button } from "../button";

const meta = {
  title: "primitives/Empty",
  component: Empty,
  tags: ["autodocs"],
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Empty,
      EmptyHeader,
      EmptyMedia,
      EmptyTitle,
      EmptyDescription,
      EmptyContent,
      Button,
      FolderOpenIcon,
    },
    template: `
      <Empty class="w-96 border rounded-lg">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpenIcon />
          </EmptyMedia>
          <EmptyTitle>No artifacts yet</EmptyTitle>
          <EmptyDescription>Create your first artifact to get started.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Create artifact</Button>
        </EmptyContent>
      </Empty>
    `,
  }),
};

export const Icon: Story = {
  render: () => ({
    components: { Empty, EmptyHeader, EmptyMedia, EmptyTitle, FolderOpenIcon },
    template: `
      <Empty class="w-80">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpenIcon />
          </EmptyMedia>
          <EmptyTitle>Icon media</EmptyTitle>
        </EmptyHeader>
      </Empty>
    `,
  }),
};
