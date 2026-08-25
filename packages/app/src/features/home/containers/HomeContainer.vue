<script setup lang="ts">
import { useHomeSync } from "../composables/useHomeSync";
import HomeSurface from "../presentationals/HomeSurface.vue";

const { view, reload } = useHomeSync();
</script>

<template>
  <HomeSurface :view="view" @retry="reload" />
</template>
