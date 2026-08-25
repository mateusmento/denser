<script setup lang="ts">
import { computed } from "vue";
import { useAuthSync } from "../composables/useAuthSync";
import SignInSurface from "../presentationals/SignInSurface.vue";

const { signIn, isSigningIn, signInError } = useAuthSync();

const errorMessage = computed(() => {
  if (!signInError.value) return undefined;
  return "Sign-in failed. Check username and password.";
});

async function onSubmit(username: string, password: string) {
  await signIn({ username, password });
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-background p-6">
    <SignInSurface
      :loading="isSigningIn"
      :error-message="errorMessage"
      @submit="onSubmit"
    />
  </div>
</template>
