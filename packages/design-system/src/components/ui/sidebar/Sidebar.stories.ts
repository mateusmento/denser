import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { HomeIcon, SettingsIcon } from "@lucide/vue";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./index";

const meta = {
  title: "primitives/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      SidebarProvider,
      Sidebar,
      SidebarHeader,
      SidebarContent,
      SidebarGroup,
      SidebarGroupLabel,
      SidebarGroupContent,
      SidebarMenu,
      SidebarMenuItem,
      SidebarMenuButton,
      SidebarInset,
      SidebarTrigger,
      HomeIcon,
      SettingsIcon,
    },
    template: `
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader class="border-b p-2">
            <span class="px-2 text-sm font-medium">Denser</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <HomeIcon />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <SettingsIcon />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header class="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span class="text-sm">Main content</span>
          </header>
          <div class="p-4 text-sm text-muted-foreground">Sidebar layout scaffold.</div>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
};
