<script setup lang="ts">
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@denser/design-system";
import {
  AtSignIcon,
  ChartPieIcon,
  ClockIcon,
  CodeIcon,
  EllipsisIcon,
  ImageIcon,
  MonitorIcon,
  PaperclipIcon,
  SendIcon,
} from "@lucide/vue";
import { useElementSize } from "@vueuse/core";
import { computed, useTemplateRef } from "vue";
import {
  RichTextComposer,
  emptyDoc,
  type JSONContent,
  type MentionCandidate,
} from "@/modules/rich-text";
import {
  CHANNEL_COMPOSER_ACTIONS,
  THREAD_COMPOSER_ACTIONS,
  partitionComposerActions,
} from "../composerActions";
import type { ComposerActionId, MessageComposerView, ScheduleCommitPayload } from "../types";
import SchedulePopover from "./SchedulePopover.vue";

const body = defineModel<JSONContent>({ required: true });

const props = defineProps<{
  view: MessageComposerView;
  mentionItems?: readonly MentionCandidate[];
  uploadImage?: (file: File) => Promise<string>;
}>();

const emit = defineEmits<{
  send: [];
  retry: [];
  action: [id: ComposerActionId];
  schedule: [payload: ScheduleCommitPayload];
  mentionSearch: [query: string];
}>();

const root = useTemplateRef<HTMLElement>("root");
const composer = useTemplateRef<{
  insertContent: (value: string) => void;
  toggleCodeBlock: () => void;
  requestImage: () => void;
}>("composer");
const { width } = useElementSize(root);
const scheduleOpen = defineModel<boolean>("scheduleOpen", { default: false });

const catalog = computed(() =>
  props.view.shape === "thread" ? THREAD_COMPOSER_ACTIONS : CHANNEL_COMPOSER_ACTIONS,
);

const partitioned = computed(() => partitionComposerActions(catalog.value, width.value || 720));

const canSend = computed(() => {
  if (props.view.disabled || props.view.sending) return false;
  const text = JSON.stringify(body.value);
  return text.length > JSON.stringify(emptyDoc()).length;
});

const icons: Record<ComposerActionId, typeof AtSignIcon> = {
  mention: AtSignIcon,
  image: ImageIcon,
  attach: PaperclipIcon,
  code: CodeIcon,
  poll: ChartPieIcon,
  record: MonitorIcon,
  schedule: ClockIcon,
};

function runAction(id: ComposerActionId) {
  if (id === "mention") {
    composer.value?.insertContent("@");
    return;
  }
  if (id === "image") {
    composer.value?.requestImage();
    emit("action", id);
    return;
  }
  if (id === "code") {
    composer.value?.toggleCodeBlock();
    return;
  }
  if (id === "schedule") {
    scheduleOpen.value = true;
    return;
  }
  emit("action", id);
}
</script>

<template>
  <Card
    ref="root"
    size="sm"
    class="h-full min-h-0 gap-0 py-2"
    data-slot="message-composer"
    :data-shape="view.shape"
  >
    <CardContent class="min-h-0 flex-1 px-3 pt-0">
      <RichTextComposer
        ref="composer"
        v-model="body"
        class="h-full min-h-0"
        :placeholder="view.placeholder"
        :disabled="view.disabled || view.sending"
        submit-on-enter
        :mention-items="mentionItems"
        :upload-image="uploadImage"
        @submit="canSend && emit('send')"
        @mention-search="emit('mentionSearch', $event)"
      />
    </CardContent>

    <p v-if="view.failed" class="px-3 text-xs text-destructive">
      Couldn’t send.
      <button type="button" class="underline" @click="emit('retry')">Retry</button>
    </p>

    <CardFooter class="px-2 pb-0">
      <TooltipProvider>
        <div class="flex w-full items-center gap-1">
        <template v-for="action in partitioned.visible" :key="action.id">
          <SchedulePopover
            v-if="action.id === 'schedule'"
            v-model:open="scheduleOpen"
            :presets="view.schedulePresets"
            @commit="emit('schedule', $event)"
          >
            <template #trigger>
              <Button
                variant="ghost"
                size="icon-sm"
                :aria-label="action.label"
                :disabled="view.disabled"
              >
                <component :is="icons[action.id]" class="size-4" />
              </Button>
            </template>
          </SchedulePopover>
          <Tooltip v-else>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon-sm"
                :aria-label="action.label"
                :disabled="view.disabled"
                @click="runAction(action.id)"
              >
                <component :is="icons[action.id]" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ action.label }}</TooltipContent>
          </Tooltip>
        </template>

        <DropdownMenu v-if="partitioned.overflow.length">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon-sm" aria-label="More" :disabled="view.disabled">
              <EllipsisIcon class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              v-for="action in partitioned.overflow"
              :key="action.id"
              @select="runAction(action.id)"
            >
              {{ action.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span class="ms-auto" />

        <Button size="sm" :disabled="!canSend" @click="emit('send')">
          <SendIcon class="size-3.5" />
          {{ view.sendLabel }}
        </Button>
        </div>
      </TooltipProvider>
    </CardFooter>
  </Card>
</template>
