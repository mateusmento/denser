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
import { computed } from "vue";
import type { WorkspaceCreateAction } from "../types";

const props = withDefaults(
  defineProps<{
    variant?: "default" | "sidebar";
    size?: "default" | "sm" | "icon";
    allowedKinds?: readonly ("document" | "conversation")[] | null;
  }>(),
  {
    variant: "default",
    size: "sm",
    allowedKinds: null,
  },
);

const emit = defineEmits<{
  create: [action: WorkspaceCreateAction];
}>();

const allowDoc = computed(() => !props.allowedKinds || props.allowedKinds.includes("document"));
const allowConv = computed(() => !props.allowedKinds || props.allowedKinds.includes("conversation"));
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
      <DropdownMenuSeparator v-if="allowDoc || allowConv" />
      <DropdownMenuItem v-if="allowDoc" @select="emit('create', 'document')">
        <FileTextIcon class="size-3.5" />
        Document
      </DropdownMenuItem>
      <DropdownMenuItem v-if="allowConv" @select="emit('create', 'conversation')">
        <MessageCircleIcon class="size-3.5" />
        Conversation
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
