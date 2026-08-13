<script setup lang="ts">
import { Button } from "@denser/design-system";
import { RouterLink } from "vue-router";
import { ThemeSwitcher } from "@/modules/theme";

const documentTo = { name: "document" as const, params: { documentId: "onboarding" } };
const conversationTo = { name: "conversation" as const, params: { channelId: "launch" } };
</script>

<template>
  <div class="flex h-svh min-h-0 flex-col bg-background text-foreground" data-slot="app-shell">
    <header
      class="flex h-surface-header shrink-0 items-center gap-3 border-b border-border px-4"
      data-slot="app-shell-header"
    >
      <span class="text-sm font-semibold tracking-tight">Denser</span>
      <nav class="flex items-center gap-1" aria-label="Surfaces">
        <RouterLink v-slot="{ isActive, navigate, href }" :to="documentTo" custom>
          <Button
            variant="ghost"
            size="sm"
            :class="isActive ? 'bg-accent text-accent-foreground' : undefined"
            as-child
          >
            <a :href="href" @click="navigate">Document</a>
          </Button>
        </RouterLink>
        <RouterLink v-slot="{ isActive, navigate, href }" :to="conversationTo" custom>
          <Button
            variant="ghost"
            size="sm"
            :class="isActive ? 'bg-accent text-accent-foreground' : undefined"
            as-child
          >
            <a :href="href" @click="navigate">Conversation</a>
          </Button>
        </RouterLink>
      </nav>
      <div class="ms-auto flex items-center gap-2">
        <ThemeSwitcher />
      </div>
    </header>
    <main class="flex min-h-0 flex-1 flex-col overflow-hidden" data-slot="app-shell-main">
      <slot />
    </main>
  </div>
</template>
