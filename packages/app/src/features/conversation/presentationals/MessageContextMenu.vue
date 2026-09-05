<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@denser/design-system";
import {
  BookmarkIcon,
  CopyIcon,
  ForwardIcon,
  LinkIcon,
  MessageCircleIcon,
  PencilIcon,
  QuoteIcon,
  SmileIcon,
  TrashIcon,
} from "@lucide/vue";
import { ref } from "vue";
import {
  resolveMessageClipboardPayload,
  writeRichClipboard,
  type MessageClipboardPayload,
} from "../messageCopyText";
import type { ConversationMessageView } from "../types";

const props = withDefaults(
  defineProps<{
    message: ConversationMessageView;
    /** Off inside an open thread (no nested threads). */
    threadActions?: boolean;
  }>(),
  { threadActions: true },
);

const emit = defineEmits<{
  react: [emoji: string];
  copyLink: [];
  bookmark: [];
  forward: [];
  quote: [];
  thread: [];
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
      <ContextMenuItem @select="emit('react', '👍')">
        <SmileIcon />
        React to message
      </ContextMenuItem>
      <ContextMenuItem v-if="threadActions" @select="emit('thread')">
        <MessageCircleIcon />
        Reply in thread
      </ContextMenuItem>
      <template v-if="message.canEdit">
        <ContextMenuSeparator />
        <ContextMenuItem @select="emit('edit')">
          <PencilIcon />
          Edit
        </ContextMenuItem>
      </template>
      <ContextMenuSeparator />
      <ContextMenuItem @select="onCopy">
        <CopyIcon />
        Copy
      </ContextMenuItem>
      <ContextMenuItem @select="emit('copyLink')">
        <LinkIcon />
        Copy link
      </ContextMenuItem>
      <ContextMenuItem @select="emit('bookmark')">
        <BookmarkIcon />
        Bookmark
      </ContextMenuItem>
      <ContextMenuItem @select="emit('forward')">
        <ForwardIcon />
        Forward message
      </ContextMenuItem>
      <ContextMenuItem @select="emit('quote')">
        <QuoteIcon />
        Quote message
      </ContextMenuItem>
      <template v-if="message.canDelete">
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" @select="emit('delete')">
          <TrashIcon />
          Delete
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
