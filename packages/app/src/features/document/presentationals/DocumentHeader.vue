<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@denser/design-system";
import { EllipsisIcon } from "@lucide/vue";
import type { DocumentHeaderView } from "../types";

defineProps<{
  header: DocumentHeaderView;
}>();

const emit = defineEmits<{
  move: [];
  share: [];
}>();
</script>

<template>
  <header class="flex h-full w-full items-center gap-3 px-1 sm:px-2" data-slot="document-header">
    <div class="min-w-0 flex-1">
      <p v-if="header.spaceLabel" class="truncate text-xs text-muted-foreground">
        {{ header.spaceLabel }}
      </p>
      <h1 class="truncate text-base font-semibold">
        {{ header.title || "Untitled" }}
      </h1>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="text-muted-foreground"
          aria-label="Document menu"
        >
          <EllipsisIcon class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @select="emit('move')">Move</DropdownMenuItem>
        <DropdownMenuItem @select="emit('share')">Share</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
