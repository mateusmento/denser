<script setup lang="ts">
import { useConversationSync } from "@/features/conversation/composables/useConversationSync";
import { defaultChannelComposerView } from "@/features/conversation/composerActions";
import {
  channelIntro,
  channelMessages,
  conversationMentionItems,
  schedulePresets,
} from "@/features/conversation/fixtures";
import ConversationSurface from "@/features/conversation/presentationals/ConversationSurface.vue";
import ConversationTimeline from "@/features/conversation/presentationals/ConversationTimeline.vue";
import MessageComposer from "@/features/conversation/presentationals/MessageComposer.vue";
import DocumentPeekContainer from "@/features/document/containers/DocumentPeekContainer.vue";
import TitleEditor from "@/features/document/presentationals/TitleEditor.vue";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import type { ArtifactId } from "@denser/contracts";
import { Dialog, DialogContent, DialogTitle } from "@denser/design-system";
import { computed, ref, watch } from "vue";
import type { ArtifactPeekState } from "../types";

const props = defineProps<{
  peek: Extract<ArtifactPeekState, { open: true }>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const open = computed({
  get: () => props.peek.open,
  set: (value) => {
    if (!value) emit("close");
  },
});

const spaceId = computed(() => props.peek.spaceId ?? undefined);

const peekTitle = computed(() =>
  props.peek.kind === "document" ? "New document" : "New conversation",
);

const documentPeekKey = ref(0);

watch(
  () => [props.peek.open, props.peek.kind] as const,
  ([isOpen, kind]) => {
    if (isOpen && kind === "document") {
      documentPeekKey.value += 1;
    }
  },
);

const conversationArtifactId = ref<ArtifactId | undefined>();

watch(
  () => props.peek.open,
  (isOpen) => {
    if (!isOpen) {
      conversationArtifactId.value = undefined;
    }
  },
);

const conversationTitle = ref("");
const conversationSync = useConversationSync(conversationArtifactId, {
  mode: "peek",
  peekSpaceId: spaceId,
  navigateOnCreate: props.peek.navigateOnCreate,
  onPeekComplete: () => emit("close"),
  onPeekCreated: (id) => {
    conversationArtifactId.value = id;
  },
});
conversationSync.bindComposeTitle(conversationTitle);

const channelDraft = ref<JSONContent>(emptyDoc());
const mentionItems = ref<MentionCandidate[]>([]);
const channelComposer = defaultChannelComposerView({ schedulePresets });

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}

async function onChannelSend() {
  await conversationSync.sendInitialMessage(channelDraft.value);
  channelDraft.value = emptyDoc();
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex h-[min(36rem,calc(100vh-2rem))] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      data-slot="artifact-peek-dialog"
    >
      <DialogTitle class="sr-only">{{ peekTitle }}</DialogTitle>

      <DocumentPeekContainer
        v-if="peek.kind === 'document'"
        :key="documentPeekKey"
        :space-id="spaceId"
        :navigate-on-create="peek.navigateOnCreate"
        @complete="emit('close')"
      />

      <ConversationSurface v-else>
        <template #header>
          <div class="flex h-full w-full items-center px-4">
            <TitleEditor v-model="conversationTitle" placeholder="Untitled" editable />
          </div>
        </template>
        <template #messages>
          <ConversationTimeline :messages="channelMessages" :intro="channelIntro" />
        </template>
        <template #composer>
          <MessageComposer
            v-model="channelDraft"
            :view="channelComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
            @send="onChannelSend"
          />
        </template>
      </ConversationSurface>
    </DialogContent>
  </Dialog>
</template>
