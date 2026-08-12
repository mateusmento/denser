import type { ComposerActionDef, MessageComposerView, SchedulePreset } from "./types";

export const CHANNEL_COMPOSER_ACTIONS: readonly ComposerActionDef[] = [
  { id: "mention", priority: 1, label: "Mention" },
  { id: "image", priority: 1, label: "Image" },
  { id: "attach", priority: 1, label: "Attachment" },
  { id: "code", priority: 2, label: "Code block" },
  { id: "poll", priority: 2, label: "Poll" },
  { id: "record", priority: 3, label: "Record screen" },
  { id: "schedule", priority: 3, label: "Schedule" },
];

export const THREAD_COMPOSER_ACTIONS: readonly ComposerActionDef[] = [
  { id: "mention", priority: 1, label: "Mention" },
  { id: "image", priority: 1, label: "Image" },
  { id: "attach", priority: 1, label: "Attachment" },
  { id: "code", priority: 2, label: "Code block" },
];

const APPROX_ACTION_WIDTH_PX = 34;
const RESERVED_TRAILING_PX = 140;

export function defaultChannelComposerView(
  overrides: Partial<MessageComposerView> = {},
): MessageComposerView {
  return {
    shape: "channel",
    placeholder: "Message…",
    sendLabel: "Send",
    hint: "Select text for formatting · Enter to send · Shift+Enter for newline",
    disabled: false,
    sending: false,
    failed: false,
    schedulePresets: [] satisfies readonly SchedulePreset[],
    ...overrides,
  };
}

export function defaultThreadComposerView(
  overrides: Partial<MessageComposerView> = {},
): MessageComposerView {
  return defaultChannelComposerView({
    shape: "thread",
    sendLabel: "Reply",
    placeholder: "Reply in thread…",
    hint: "Enter to reply · Shift+Enter for newline",
    ...overrides,
  });
}

export function partitionComposerActions(
  actions: readonly ComposerActionDef[],
  containerWidthPx: number,
): { visible: ComposerActionDef[]; overflow: ComposerActionDef[] } {
  const budget = Math.max(0, containerWidthPx - RESERVED_TRAILING_PX);
  const sorted = [...actions].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));

  let used = 0;
  const visible: ComposerActionDef[] = [];
  const overflow: ComposerActionDef[] = [];

  for (const action of sorted) {
    if (used + APPROX_ACTION_WIDTH_PX <= budget) {
      visible.push(action);
      used += APPROX_ACTION_WIDTH_PX;
    } else {
      overflow.push(action);
    }
  }

  overflow.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  return { visible, overflow };
}
