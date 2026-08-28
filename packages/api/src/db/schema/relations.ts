import { relations } from "drizzle-orm";
import { account, session, user } from "./auth.js";
import { artifact } from "./artifact.js";
import { conversation, conversationMember } from "./conversation.js";
import { document } from "./document.js";
import { space, spaceMembership } from "./space.js";

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

export const documentRelations = relations(document, ({ one }) => ({
  artifact: one(artifact, {
    fields: [document.artifactId],
    references: [artifact.id],
  }),
}));
