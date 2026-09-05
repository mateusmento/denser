import { relations } from "drizzle-orm";
import { account, session, user } from "./auth.js";
import { artifact } from "./artifact.js";
import { attachment, messageAttachment } from "./attachment.js";
import { conversation, conversationMember } from "./conversation.js";
import { conversationPeer } from "./conversation-peer.js";
import { document } from "./document.js";
import { message, readState } from "./message.js";
import { messageDraft, messageDraftAttachment } from "./message-draft.js";
import { scheduledJob, scheduledJobAttachment } from "./scheduled-job.js";
import { space, spaceMembership } from "./space.js";
import { documentType, workflow, workflowStage } from "./workflow.js";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  spaceMemberships: many(spaceMembership),
  createdSpaces: many(space),
  createdArtifacts: many(artifact),
}));

export const spaceRelations = relations(space, ({ one, many }) => ({
  parentSpace: one(space, {
    fields: [space.parentSpaceId],
    references: [space.id],
    relationName: "space_parent",
  }),
  createdByUser: one(user, {
    fields: [space.createdBy],
    references: [user.id],
  }),
  memberships: many(spaceMembership),
  childSpaces: many(space, { relationName: "space_parent" }),
  artifacts: many(artifact),
  workflows: many(workflow),
  documentTypes: many(documentType),
}));

export const spaceMembershipRelations = relations(spaceMembership, ({ one }) => ({
  space: one(space, {
    fields: [spaceMembership.spaceId],
    references: [space.id],
  }),
  user: one(user, {
    fields: [spaceMembership.userId],
    references: [user.id],
  }),
}));

export const artifactRelations = relations(artifact, ({ one, many }) => ({
  space: one(space, {
    fields: [artifact.spaceId],
    references: [space.id],
  }),
  createdByUser: one(user, {
    fields: [artifact.createdBy],
    references: [user.id],
  }),
  document: one(document, {
    fields: [artifact.id],
    references: [document.artifactId],
  }),
  conversation: one(conversation, {
    fields: [artifact.id],
    references: [conversation.artifactId],
  }),
  conversationMembers: many(conversationMember),
  conversationPeers: many(conversationPeer),
}));

export const conversationRelations = relations(conversation, ({ one }) => ({
  artifact: one(artifact, {
    fields: [conversation.artifactId],
    references: [artifact.id],
  }),
}));

export const conversationMemberRelations = relations(conversationMember, ({ one }) => ({
  conversation: one(artifact, {
    fields: [conversationMember.conversationArtifactId],
    references: [artifact.id],
  }),
  user: one(user, {
    fields: [conversationMember.userId],
    references: [user.id],
  }),
}));

export const conversationPeerRelations = relations(conversationPeer, ({ one }) => ({
  conversation: one(artifact, {
    fields: [conversationPeer.conversationArtifactId],
    references: [artifact.id],
  }),
  user: one(user, {
    fields: [conversationPeer.userId],
    references: [user.id],
  }),
}));

export const documentRelations = relations(document, ({ one }) => ({
  artifact: one(artifact, {
    fields: [document.artifactId],
    references: [artifact.id],
  }),
  documentType: one(documentType, {
    fields: [document.documentTypeId],
    references: [documentType.id],
  }),
  stage: one(workflowStage, {
    fields: [document.stageId],
    references: [workflowStage.id],
  }),
}));

export const workflowRelations = relations(workflow, ({ one, many }) => ({
  space: one(space, {
    fields: [workflow.spaceId],
    references: [space.id],
  }),
  stages: many(workflowStage),
  documentTypes: many(documentType),
}));

export const workflowStageRelations = relations(workflowStage, ({ one }) => ({
  workflow: one(workflow, {
    fields: [workflowStage.workflowId],
    references: [workflow.id],
  }),
}));

export const documentTypeRelations = relations(documentType, ({ one }) => ({
  space: one(space, {
    fields: [documentType.spaceId],
    references: [space.id],
  }),
  createdByUser: one(user, {
    fields: [documentType.createdBy],
    references: [user.id],
  }),
  workflow: one(workflow, {
    fields: [documentType.workflowId],
    references: [workflow.id],
  }),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(artifact, {
    fields: [message.conversationId],
    references: [artifact.id],
  }),
  author: one(user, {
    fields: [message.authorId],
    references: [user.id],
  }),
  attachments: many(messageAttachment),
}));

export const readStateRelations = relations(readState, ({ one }) => ({
  conversation: one(artifact, {
    fields: [readState.conversationId],
    references: [artifact.id],
  }),
  user: one(user, {
    fields: [readState.userId],
    references: [user.id],
  }),
}));

export const attachmentRelations = relations(attachment, ({ one, many }) => ({
  rootSpace: one(space, {
    fields: [attachment.rootSpaceId],
    references: [space.id],
  }),
  conversation: one(artifact, {
    fields: [attachment.conversationId],
    references: [artifact.id],
  }),
  uploadedByUser: one(user, {
    fields: [attachment.uploadedBy],
    references: [user.id],
  }),
  messageJoins: many(messageAttachment),
}));

export const messageAttachmentRelations = relations(messageAttachment, ({ one }) => ({
  message: one(message, {
    fields: [messageAttachment.messageId],
    references: [message.id],
  }),
  attachment: one(attachment, {
    fields: [messageAttachment.attachmentId],
    references: [attachment.id],
  }),
}));

export const messageDraftRelations = relations(messageDraft, ({ one, many }) => ({
  conversation: one(artifact, {
    fields: [messageDraft.conversationId],
    references: [artifact.id],
  }),
  author: one(user, {
    fields: [messageDraft.authorId],
    references: [user.id],
  }),
  attachments: many(messageDraftAttachment),
}));

export const messageDraftAttachmentRelations = relations(messageDraftAttachment, ({ one }) => ({
  draft: one(messageDraft, {
    fields: [messageDraftAttachment.draftId],
    references: [messageDraft.id],
  }),
  attachment: one(attachment, {
    fields: [messageDraftAttachment.attachmentId],
    references: [attachment.id],
  }),
}));

export const scheduledJobRelations = relations(scheduledJob, ({ one, many }) => ({
  rootSpace: one(space, {
    fields: [scheduledJob.rootSpaceId],
    references: [space.id],
  }),
  attachments: many(scheduledJobAttachment),
}));

export const scheduledJobAttachmentRelations = relations(scheduledJobAttachment, ({ one }) => ({
  job: one(scheduledJob, {
    fields: [scheduledJobAttachment.jobId],
    references: [scheduledJob.id],
  }),
  attachment: one(attachment, {
    fields: [scheduledJobAttachment.attachmentId],
    references: [attachment.id],
  }),
}));
