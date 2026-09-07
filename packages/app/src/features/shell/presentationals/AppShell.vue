<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@denser/design-system";
import { RouterLink } from "vue-router";
import { ref } from "vue";
import { ThemeSwitcher } from "@/modules/theme";
import { useAuthSession, useAuthSync } from "@/modules/auth";
import UserPreferencesDialog from "@/modules/auth/presentationals/UserPreferencesDialog.vue";

const { user } = useAuthSession();
const { signOut } = useAuthSync();
const preferencesOpen = ref(false);

async function onSignOut() {
  await signOut();
}
</script>

<template>
  <SidebarProvider class="h-full">
    <Sidebar>
      <SidebarHeader
        class="flex h-surface-header shrink-0 flex-row items-center border-b border-sidebar-border px-3"
      >
        <RouterLink to="/" class="text-sm font-semibold tracking-tight">Denser</RouterLink>
      </SidebarHeader>
      <slot name="sidebar" />
    </Sidebar>

    <SidebarInset class="flex min-h-svh min-w-0 flex-col" data-slot="app-shell">
      <header
        class="flex h-surface-header shrink-0 items-center gap-2 border-b border-border px-4"
        data-slot="app-shell-header"
      >
        <SidebarTrigger />
        <div class="ms-auto flex items-center gap-2">
          <span v-if="user?.name" class="hidden text-xs text-muted-foreground sm:inline">
            {{ user.name }}
          </span>
          <DropdownMenu v-if="user">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm">Account</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="preferencesOpen = true">Preferences</DropdownMenuItem>
              <DropdownMenuItem @select="onSignOut">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeSwitcher />
        </div>
      </header>
      <main class="flex min-h-0 flex-1 flex-col overflow-hidden" data-slot="app-shell-main">
        <slot />
      </main>
    </SidebarInset>
    <UserPreferencesDialog v-model:open="preferencesOpen" />
  </SidebarProvider>
</template>
