<script setup lang="ts">
import { AuthProviderContainer } from "@/modules/auth";
import { DialogHost } from "@/lib/dialog";
import { RouterView } from "vue-router";
</script>

<template>
  <AuthProviderContainer>
    <RouterView />
    <DialogHost />
  </AuthProviderContainer>
</template>
