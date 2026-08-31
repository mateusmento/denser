<script setup lang="ts">
import { AuthProviderContainer } from "@/modules/auth";
import { DialogHost } from "@/lib/dialog";
import { Toaster } from "@denser/design-system";
import { RouterView } from "vue-router";
</script>

<template>
  <AuthProviderContainer>
    <RouterView />
    <DialogHost />
    <Toaster />
  </AuthProviderContainer>
</template>
