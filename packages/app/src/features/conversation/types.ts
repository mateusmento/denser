import type { JSONContent } from "@/modules/rich-text";

export type ConversationPersonView = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
};

export type ConversationPollOptionView = {
  id: string;
  label: string;
  voteCount: number;
};

export type ConversationPollView = {
  id: string;
  question: string;
  options: readonly ConversationPollOptionView[];
  votedOptionId: string | null;
  totalVotes: number;
};

export type ConversationReactionView = {
  emoji: string;
  count: number;
  mine: boolean;
};

export type ConversationAttachmentView = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  byteSize: number;
  kind: "media" | "audio" | "file";
};

export type ConversationQuotedPreviewView = {
  id: string;
  author: ConversationPersonView;
  body: JSONContent;
  displayContent: string;
  hasAttachment: boolean;
  sizeCapped: boolean;
};

export type ConversationMessageView = {
  id: string;
  author: ConversationPersonView;
  body: JSONContent;
  createdAt: string;
  createdAtLabel: string;
  reactions: readonly ConversationReactionView[];
  poll?: ConversationPollView;
  replyCount: number;
  attachments?: readonly ConversationAttachmentView[];
  quoted?: ConversationQuotedPreviewView;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Muted timeline caption when the message was sent on a schedule. */
  scheduledCaption?: string;
};

/** Same-author, near-in-time cluster for timeline chrome (avatar + header once). */
export type ConversationMessageGroupView = {
  id: string;
  author: ConversationPersonView;
  createdAtLabel: string;
  messages: readonly ConversationMessageView[];
};

export type ConversationChannelHeaderView = {
  title: string;
  description?: string;
  presenceLabel?: string;
  members: readonly ConversationPersonView[];
  extraMemberCount?: number;
  unreadCount?: number;
};

/** Start-of-history block (Slack “channel beginning”) — not the sticky ChannelHeader chrome. */
export type ConversationIntroView = {
  kind?: "channel" | "direct";
  title: string;
  body: string;
  editDescriptionLabel?: string;
  addPeopleLabel?: string;
};

export type ComposerShape = "channel" | "thread";

export type ComposerActionId =
  | "mention"
  | "image"
  | "attach"
  | "code"
  | "poll"
  | "record"
  | "audio"
  | "schedule";

export type ComposerActionPriority = 1 | 2 | 3;

export type ComposerActionDef = {
  id: ComposerActionId;
  priority: ComposerActionPriority;
  label: string;
};

export type ScheduleRecurrencePreset = "once" | "daily" | "weekly";

export type SchedulePreset = {
  id: string;
  label: string;
  whenLabel: string;
  /** UTC ISO for preset commits (container may omit for story fixtures). */
  dueAtIso?: string;
};

export type ScheduleCommitPayload = {
  whenLabel: string;
  dueAtIso: string;
  timezone: string;
  recurrence: ScheduleRecurrencePreset;
  weekdays?: number[];
  until?: string | null;
  presetId?: string;
  customIso?: string;
};

export type ConversationPane = "messages" | "schedules";

export type OutboxContextLabel = "channel" | "thread";

export type DraftOutboxRowView = {
  id: string;
  conversationId: string;
  threadId: string | null;
  conversationLabel: string;
  contextLabel: OutboxContextLabel;
  bodyPreview: string;
};

export type ScheduledOutboxRowView = {
  id: string;
  conversationId: string;
  threadId: string | null;
  conversationLabel: string;
  contextLabel: OutboxContextLabel;
  bodyPreview: string;
  nextRunAtIso: string;
  timezone: string | null;
  recurrenceLabel: string;
  nextRunWallTimeLabel: string;
};

export type DraftsScheduledPanelTab = "drafts" | "scheduled";

export type ScheduledMessageView = {
  id: string;
  senderId: string;
  isMine: boolean;
  body: JSONContent;
  dueAt: string;
  dueAtLabel: string;
  userDueAtLabel?: string | null;
  scheduleTimezone?: string | null;
  recurrenceLabel?: string;
  threadId: string | null;
  attachments: readonly ConversationAttachmentView[];
  processed: boolean;
};

export type ConversationScheduledMessageView = {
  id: string;
  bodyPreview: string;
  /** UTC ISO of the next send (or sole send for once jobs). */
  nextRunAtIso: string;
  timezone: string | null;
  recurrenceLabel: string;
  /** Local wall time label for lists. */
  nextRunWallTimeLabel: string;
};

export type ComposerAttachmentTileView =
  | {
      key: string;
      kind: "uploaded";
      id: string;
      name: string;
      mimeType: string;
      url: string;
      byteSize: number;
    }
  | {
      key: string;
      kind: "uploading";
      clientId: string;
      name: string;
      mimeType: string;
      previewUrl: string;
      progress: number;
    }
  | {
      key: string;
      kind: "failed";
      clientId: string;
      name: string;
      mimeType: string;
      previewUrl: string;
      message?: string;
    };

export type ComposerAttachmentsView = {
  tiles: readonly ComposerAttachmentTileView[];
  disabled: boolean;
  hasBlockingUpload: boolean;
};

export type MessageComposerView = {
  shape: ComposerShape;
  placeholder: string;
  sendLabel: string;
  disabled: boolean;
  sending: boolean;
  failed: boolean;
  /** Composer is saving an in-place message edit. */
  isEditing?: boolean;
  /** Composer is editing a scheduled message body (timing unchanged). */
  isScheduledEditing?: boolean;
  scheduledEditBanner?: string;
  scheduleEnabled?: boolean;
  schedulePresets: readonly SchedulePreset[];
  scheduleUserTimezone?: string | null;
  scheduleTimezone?: string | null;
  scheduleTimezoneLabel?: string | null;
  scheduleSchedulerUserId?: string | null;
  scheduleMembers?: readonly { userId: string; name: string; timezone: string | null }[];
  attachments?: ComposerAttachmentsView;
};

export type ConversationThreadView = {
  parent: ConversationMessageView;
  messages: readonly ConversationMessageView[];
};

export type ConversationFileRowView = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  byteSize: number;
  byteSizeLabel: string;
  uploaderName: string;
  createdAtLabel: string;
  canDelete: boolean;
};

export type ConversationFilesPaneView = {
  state: "loading" | "ready" | "error";
  files: readonly ConversationFileRowView[];
  errorMessage?: string;
};

export type AudioRecordingBadgeView = {
  phase: "recording" | "finalizing";
  elapsedLabel: string;
};

export type ScreenRecordingPhase = "acquiring" | "setup" | "recording" | "finalizing";

export type ScreenRecordingDeviceOption = {
  deviceId: string;
  label: string;
};

export type ScreenRecordingSetupView = {
  phase: ScreenRecordingPhase;
  error?: string;
  webcamEnabled: boolean;
  webcamAvailable: boolean;
  screenEnabled: boolean;
  screenAvailable: boolean;
  webcamDeviceId: string | null;
  micEnabled: boolean;
  micDeviceId: string | null;
  systemAudioEnabled: boolean;
  mirrorCamera: boolean;
  cameras: readonly ScreenRecordingDeviceOption[];
  microphones: readonly ScreenRecordingDeviceOption[];
  canStart: boolean;
  showCameraOverlayEditor: boolean;
  overlayEditMode: boolean;
  showAvatarFallback: boolean;
  avatarUrl?: string;
  avatarInitials: string;
  avatarName: string;
  elapsedLabel?: string;
  previewAspectRatio: number;
  cameraLayout: { x: number; y: number; diameter: number };
  frameWidth: number;
  frameHeight: number;
};
