<script setup lang="ts"></script>

<template>
  <div
    class="mx-auto flex w-full max-w-3xl flex-1 items-center rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground"
    data-slot="permission-empty"
    role="status"
  >
    <slot> You don’t have permission to post in this channel. </slot>
  </div>
</template>
