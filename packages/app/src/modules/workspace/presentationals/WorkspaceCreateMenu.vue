<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@denser/design-system";
import { FileTextIcon, FolderIcon, MessageSquareIcon, PlusIcon } from "@lucide/vue";
import type { WorkspaceCreateAction } from "../types";

withDefaults(
  defineProps<{
    variant?: "default" | "sidebar";
    size?: "default" | "sm" | "icon";
  }>(),
  {
    variant: "default",
    size: "sm",
  },
);

const emit = defineEmits<{
  create: [action: WorkspaceCreateAction];
}>();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        v-if="variant === 'sidebar'"
        variant="ghost"
        size="icon"
        class="size-7"
        title="Create"
        aria-label="Create"
      >
        <PlusIcon class="size-4" />
      </Button>
      <Button v-else :size="size">
        <PlusIcon class="size-4" />
        New
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-44">
      <DropdownMenuItem @select="emit('create', 'space')">
        <FolderIcon class="size-3.5" />
        Space
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('create', 'document')">
        <FileTextIcon class="size-3.5" />
        Document
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('create', 'conversation')">
        <MessageSquareIcon class="size-3.5" />
        Conversation
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
