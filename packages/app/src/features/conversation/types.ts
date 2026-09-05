import type { JSONContent } from "@/modules/rich-text";

export type ConversationPersonView = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
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
  kind: "media" | "file";
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
  replyCount: number;
  attachments?: readonly ConversationAttachmentView[];
  quoted?: ConversationQuotedPreviewView;
  canEdit?: boolean;
  canDelete?: boolean;
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
};

/** Start-of-history block (Slack “channel beginning”) — not the sticky ChannelHeader chrome. */
export type ConversationIntroView = {
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
  | "schedule";

export type ComposerActionPriority = 1 | 2 | 3;

export type ComposerActionDef = {
  id: ComposerActionId;
  priority: ComposerActionPriority;
  label: string;
};

export type SchedulePreset = {
  id: string;
  label: string;
  whenLabel: string;
};

export type ScheduleCommitPayload = {
  whenLabel: string;
  recurringWeekly: boolean;
  customIso?: string;
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
  schedulePresets: readonly SchedulePreset[];
  attachments?: ComposerAttachmentsView;
};

export type ConversationThreadView = {
  parent: ConversationMessageView;
  messages: readonly ConversationMessageView[];
};
