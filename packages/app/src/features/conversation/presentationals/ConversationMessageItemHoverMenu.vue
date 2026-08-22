<script setup lang="ts">
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { SmileIcon, MessageSquareIcon, PencilIcon, TrashIcon } from '@lucide/vue';
import type { ConversationMessageView } from '../types';

defineProps<{
  message: ConversationMessageView,
  threadActions: boolean;
  collisionBoundary?: HTMLElement | (HTMLElement | null)[] | null;
}>()

const emit = defineEmits<{
  (e: 'react', emoji: string): void
  (e: 'thread'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <HoverCard :open-delay="200" :close-delay="200">
    <HoverCardTrigger as-child>
      <slot />
    </HoverCardTrigger>
    <HoverCardContent
      align="center"
      side="right"
      :collision-boundary="collisionBoundary"
      class="w-fit p-0 bg-transparent rounded-none shadow-none ring-0"
      :side-offset="10"
    >
      <div class="flex gap-1 w-fit">
        <Button size="icon" variant="ghost" aria-label="Add reaction" @click="emit('react', '👍')">
          <SmileIcon class="size-3.5" />
        </Button>
        <Button
          v-if="threadActions"
          size="icon"
          variant="ghost"
          aria-label="Reply in thread"
          @click="emit('thread')"
        >
          <MessageSquareIcon class="size-3.5" />
        </Button>
        <Button
          v-if="message.canEdit"
          size="icon"
          variant="ghost"
          aria-label="Edit"
          @click="emit('edit')"
        >
          <PencilIcon class="size-3.5" />
        </Button>
        <Button
          v-if="message.canDelete"
          size="icon"
          variant="ghost"
          aria-label="Delete"
          @click="emit('delete')"
        >
          <TrashIcon class="size-3.5" />
        </Button>
      </div>
    </HoverCardContent>
  </HoverCard>
</template>
