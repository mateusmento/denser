<script setup lang="ts">
import { SEED_ARTIFACT_ONBOARDING_NOTES } from "@denser/contracts";
import { Button } from "@denser/design-system";
import { RouterLink } from "vue-router";
import { ThemeSwitcher } from "@/modules/theme";
import { useAuthSession, useAuthSync } from "@/modules/auth";

const { user } = useAuthSession();
const { signOut } = useAuthSync();

const documentTo = {
  name: "document" as const,
  params: { documentId: SEED_ARTIFACT_ONBOARDING_NOTES },
};

const conversationTo = { name: "conversation" as const, params: { channelId: "launch" } };

async function onSignOut() {
  await signOut();
}
</script>

<template>
  <div class="flex h-svh min-h-0 flex-col" data-slot="app-shell">
    <header
      class="flex h-surface-header shrink-0 items-center gap-3 border-b border-border px-4"
      data-slot="app-shell-header"
    >
      <RouterLink to="/" class="text-sm font-semibold tracking-tight">Denser</RouterLink>
      <nav class="flex items-center gap-1" aria-label="Surfaces">
        <RouterLink v-slot="{ isActive, navigate, href }" to="/" custom>
          <Button
            :variant="isActive ? 'default' : 'ghost'"
            size="sm"
            :class="isActive ? 'bg-accent text-accent-foreground' : undefined"
            as-child
          >
            <a :href="href" @click="navigate">Home</a>
          </Button>
        </RouterLink>
        <RouterLink v-slot="{ isActive, navigate, href }" :to="documentTo" custom>
          <Button
            :variant="isActive ? 'default' : 'ghost'"
            size="sm"
            :class="isActive ? 'bg-accent text-accent-foreground' : undefined"
            as-child
          >
            <a :href="href" @click="navigate">Document</a>
          </Button>
        </RouterLink>
        <RouterLink v-slot="{ isActive, navigate, href }" :to="conversationTo" custom>
          <Button
            :variant="isActive ? 'default' : 'ghost'"
            size="sm"
            :class="isActive ? 'bg-accent text-accent-foreground' : undefined"
            as-child
          >
            <a :href="href" @click="navigate">Conversation</a>
          </Button>
        </RouterLink>
      </nav>
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
  </div>
</template>
