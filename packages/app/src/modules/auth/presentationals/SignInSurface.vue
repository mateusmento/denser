<script setup lang="ts">
import { Button, Input, Label } from "@denser/design-system";
import { ref } from "vue";

defineProps<{
  errorMessage?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [username: string, password: string];
}>();

const username = ref("alice");
const password = ref("password");

function onSubmit() {
  emit("submit", username.value.trim(), password.value);
}
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-xl border border-border bg-card p-8 shadow-sm"
    data-slot="sign-in-surface"
  >
    <div class="space-y-1">
      <h1 class="text-xl font-semibold tracking-tight">Sign in</h1>
      <p class="text-sm text-muted-foreground">Local dev — try alice / password.</p>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <div class="space-y-2">
        <Label for="username">Username</Label>
        <Input id="username" v-model="username" autocomplete="username" />
      </div>
      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input id="password" v-model="password" type="password" autocomplete="current-password" />
      </div>
      <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      <Button type="submit" class="w-full" :disabled="loading">
        {{ loading ? "Signing in…" : "Sign in" }}
      </Button>
    </form>
  </div>
</template>
