<script setup lang="ts">
import { Toaster } from "@denser/design-system";
import { RouterView } from "vue-router";
import { useColorModeOwner } from "@/modules/theme";

useColorModeOwner();
</script>

<template>
  <RouterView />
  <Toaster />
</template>
