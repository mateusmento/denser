<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@denser/design-system";
import { CopyIcon, PencilIcon, TrashIcon } from "@lucide/vue";
import { ref } from "vue";
import {
  resolveMessageClipboardPayload,
  writeRichClipboard,
  type MessageClipboardPayload,
} from "../messageCopyText";
import type { ConversationMessageView } from "../types";

const props = defineProps<{
  message: ConversationMessageView;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

/** Captured when the menu opens — selection is often cleared once a menu item focuses. */
const pendingClipboard = ref<MessageClipboardPayload>({ plain: "", html: "" });

function onOpen(open: boolean) {
  if (!open) return;
  pendingClipboard.value = resolveMessageClipboardPayload(props.message);
}

async function onCopy() {
  await writeRichClipboard(pendingClipboard.value);
}
</script>

<template>
  <ContextMenu data-slot="message-context-menu" @update:open="onOpen">
    <ContextMenuTrigger>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem @select="onCopy">
        <CopyIcon />
        Copy
      </ContextMenuItem>
      <ContextMenuItem v-if="message.canEdit !== false" @select="emit('edit')">
        <PencilIcon />
        Edit
      </ContextMenuItem>
      <template v-if="message.canDelete !== false">
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="emit('delete')">
          <TrashIcon />
          Delete
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
