<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@denser/design-system";
import {
  BriefcaseIcon,
  FileTextIcon,
  FolderIcon,
  MessageCircleIcon,
  PlusIcon,
  RocketIcon,
} from "@lucide/vue";
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
    <DropdownMenuContent align="end" class="min-w-52">
      <DropdownMenuItem @select="emit('create', 'folder')">
        <FolderIcon class="size-3.5" />
        New folder
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('create', 'project')">
        <BriefcaseIcon class="size-3.5" />
        New project
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('create', 'scrum')">
        <RocketIcon class="size-3.5" />
        New Scrum project
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="emit('create', 'document')">
        <FileTextIcon class="size-3.5" />
        Document
      </DropdownMenuItem>
      <DropdownMenuItem @select="emit('create', 'conversation')">
        <MessageCircleIcon class="size-3.5" />
        Conversation
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
