<script setup lang="ts">
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollArea,
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
import { useElementSize, useFileDialog } from "@vueuse/core";
import { computed, ref, useTemplateRef, watch } from "vue";
import {
  RichTextComposer,
  emptyDoc,
  type JSONContent,
  type MentionCandidate,
} from "@/modules/rich-text";
import type { RichTextUploadResult } from "@/modules/rich-text/lib/extensions";
import {
  CHANNEL_COMPOSER_ACTIONS,
  THREAD_COMPOSER_ACTIONS,
  partitionComposerActions,
} from "../composerActions";
import type { ComposerActionId, MessageComposerView, ScheduleCommitPayload } from "../types";
import ComposerAttachmentTiles from "./ComposerAttachmentTiles.vue";
import SchedulePopover from "./SchedulePopover.vue";

const body = defineModel<JSONContent>({ required: true });

const props = defineProps<{
  view: MessageComposerView;
  class?: string;
  mentionItems?: readonly MentionCandidate[];
  uploadImage?: (file: File) => Promise<RichTextUploadResult>;
  onStageFiles?: (files: File[]) => void;
  canSend?: boolean;
}>();

const emit = defineEmits<{
  send: [];
  retry: [];
  cancelEdit: [];
  action: [id: ComposerActionId];
  schedule: [payload: ScheduleCommitPayload];
  mentionSearch: [query: string];
  typing: [];
  "typing-stop": [];
  removeAttachment: [attachmentId: string];
  cancelUpload: [clientId: string];
  retryUpload: [clientId: string];
  dismissUpload: [clientId: string];
}>();

const root = useTemplateRef<HTMLElement>("root");
const composer = useTemplateRef<{
  insertContent: (value: string) => void;
  toggleCodeBlock: () => void;
  requestImage: () => void;
}>("composer");
const { width } = useElementSize(root);
const scheduleOpen = defineModel<boolean>("scheduleOpen", { default: false });
const isFocused = ref(false);

watch(body, (value) => {
  if (!isFocused.value || props.view.disabled || props.view.sending) return;
  const text = JSON.stringify(value);
  if (text.length > JSON.stringify(emptyDoc()).length) emit("typing");
  else emit("typing-stop");
});

function onFocusIn() {
  isFocused.value = true;
  const text = JSON.stringify(body.value);
  if (text.length > JSON.stringify(emptyDoc()).length) emit("typing");
}

function onFocusOut() {
  isFocused.value = false;
  emit("typing-stop");
}

function onSend() {
  emit("typing-stop");
  emit("send");
}

const { open: openAttachDialog, onChange: onAttachFiles } = useFileDialog({ multiple: true });

onAttachFiles((files) => {
  const list = files ? Array.from(files) : [];
  if (!list.length) return;
  props.onStageFiles?.(list);
});

const catalog = computed(() =>
  props.view.shape === "thread" ? THREAD_COMPOSER_ACTIONS : CHANNEL_COMPOSER_ACTIONS,
);

const partitioned = computed(() => partitionComposerActions(catalog.value, width.value || 720));

const attachments = computed(() => props.view.attachments);

const canSend = computed(() => {
  if (props.view.disabled || props.view.sending || attachments.value?.hasBlockingUpload) {
    return false;
  }
  if (props.canSend !== undefined) return props.canSend;
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
  if (id === "attach") {
    openAttachDialog();
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

function onDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  event.preventDefault();
  props.onStageFiles?.(Array.from(files));
}
</script>

<template>
  <Card
    ref="root"
    size="sm"
    :class="
      cn(
        'h-full min-h-0 gap-1 rounded-2xl',
        'border transition-[box-shadow,--card-edge-end,--tw-gradient-to] duration-[150ms,250ms,200ms]',
        'light:border-mist-300',
        'dark:card-edge dark:card-edge-middle-[var(--color-mist-800)_45%] dark:card-edge-end-mist-950 dark:card-edge-start-mist-700',
        'bg-linear-to-b',
        'light:from-mist-50 light:via-mist-50 light:via-55% light:to-mist-50 light:focus-within:to-mist-100',
        'dark:from-muted dark:via-muted dark:via-35% dark:to-muted/45',
        'light:focus-within:shadow-[0_1px_3px_var(--color-mist-300)]',
        'dark:focus-within:shadow-[0_0_3px_var(--color-primary)]',
        'focus-within:card-edge-end-primary',
        props.class,
      )
    "
    data-slot="message-composer"
    :data-shape="view.shape"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @dragover.prevent
    @drop="onDrop"
  >
    <ComposerAttachmentTiles
      v-if="attachments?.tiles.length"
      :tiles="attachments.tiles"
      :disabled="attachments.disabled || view.disabled || view.sending"
      @remove="emit('removeAttachment', $event)"
      @cancel="emit('cancelUpload', $event)"
      @retry="emit('retryUpload', $event)"
      @dismiss="emit('dismissUpload', $event)"
    />

    <CardContent class="min-h-0 flex-1">
      <ScrollArea class="h-full min-h-0">
        <RichTextComposer
          ref="composer"
          v-model="body"
          class="h-full min-h-0 overflow-y-auto"
          :placeholder="view.placeholder"
          :disabled="view.disabled || view.sending"
          submit-on-enter
          :mention-items="mentionItems"
          :upload-image="uploadImage"
          :on-stage-files="onStageFiles"
          @submit="canSend && onSend()"
          @mention-search="emit('mentionSearch', $event)"
        />
      </ScrollArea>
    </CardContent>

    <p v-if="view.isEditing" class="px-3 text-xs text-muted-foreground">
      Editing message
      <button type="button" class="ms-2 underline" @click="emit('cancelEdit')">Cancel</button>
    </p>

    <p v-if="view.failed" class="px-3 text-xs text-destructive">
      Couldn’t send.
      <button type="button" class="underline" @click="emit('retry')">Retry</button>
    </p>

    <CardFooter>
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
                  variant="outline"
                  size="icon"
                  :aria-label="action.label"
                  :disabled="view.disabled || attachments?.disabled"
                >
                  <component :is="icons[action.id]" class="size-4" />
                </Button>
              </template>
            </SchedulePopover>
            <Tooltip v-else>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  size="icon"
                  :aria-label="action.label"
                  :disabled="view.disabled || attachments?.disabled"
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
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="More"
                :disabled="view.disabled || attachments?.disabled"
              >
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

          <Button size="sm" :disabled="!canSend" @click="onSend">
            <SendIcon class="size-3.5" />
            {{ view.sendLabel }}
          </Button>
        </div>
      </TooltipProvider>
    </CardFooter>
  </Card>
</template>
