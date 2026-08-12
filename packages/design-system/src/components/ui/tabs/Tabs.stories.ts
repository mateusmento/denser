import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./index";

const meta = {
  title: "primitives/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "line"],
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent },
    setup: () => ({ args }),
    template: `
      <Tabs default-value="account" class="w-80">
        <TabsList v-bind="args">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account" class="text-sm">Account settings.</TabsContent>
        <TabsContent value="password" class="text-sm">Password settings.</TabsContent>
      </Tabs>
    `,
  }),
  args: { variant: "default" },
};

export const Line: Story = {
  render: () => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent },
    template: `
      <Tabs default-value="board" class="w-80">
        <TabsList variant="line">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="board" class="text-sm">Board view.</TabsContent>
        <TabsContent value="calendar" class="text-sm">Calendar view.</TabsContent>
      </Tabs>
    `,
  }),
};
