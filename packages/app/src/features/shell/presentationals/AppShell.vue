<script setup lang="ts">
import {
  Button,
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@denser/design-system";
import { RouterLink } from "vue-router";
import { ThemeSwitcher } from "@/modules/theme";
import { useAuthSession, useAuthSync } from "@/modules/auth";

const { user } = useAuthSession();
const { signOut } = useAuthSync();

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
          <Button v-if="user" variant="ghost" size="sm" @click="onSignOut">Sign out</Button>
          <ThemeSwitcher />
        </div>
      </header>
      <main class="flex min-h-0 flex-1 flex-col overflow-hidden" data-slot="app-shell-main">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
