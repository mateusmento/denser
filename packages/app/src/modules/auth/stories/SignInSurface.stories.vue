<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SignInSurface from "../presentationals/SignInSurface.vue";

const { Story } = defineMeta({
  title: "modules/auth/SignInSurface",
  component: SignInSurface,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});
</script>

<template>
  <Story as-child name="Default">
    <SignInSurface @submit="(username, password) => action('submit')(username, password)" />
  </Story>
  <Story as-child name="Loading">
    <SignInSurface loading @submit="(username, password) => action('submit')(username, password)" />
  </Story>
  <Story as-child name="Error">
    <SignInSurface
      error-message="Sign-in failed. Check username and password."
      @submit="(username, password) => action('submit')(username, password)"
    />
  </Story>
</template>
