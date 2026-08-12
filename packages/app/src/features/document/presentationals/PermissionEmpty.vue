<script setup lang="ts">
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@denser/design-system";
</script>

<template>
  <Empty data-slot="permission-empty" class="border-0">
    <EmptyHeader>
      <EmptyTitle>You can’t edit this document</EmptyTitle>
      <EmptyDescription>
        <slot>You can still read it if you have access.</slot>
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>
