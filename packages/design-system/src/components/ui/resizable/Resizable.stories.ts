import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./index";

const meta = {
  title: "primitives/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <ResizablePanelGroup direction="horizontal" class="min-h-48 max-w-lg rounded-lg border">
        <ResizablePanel :default-size="50">
          <div class="flex h-full items-center justify-center p-6 text-sm">Panel A</div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel :default-size="50">
          <div class="flex h-full items-center justify-center p-6 text-sm">Panel B</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    `,
  }),
};
