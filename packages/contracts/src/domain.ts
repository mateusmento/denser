import { z } from "zod";
import { ArtifactId, DocumentTypeId, SpaceId, UserId, WorkflowId, WorkflowStageId } from "./ids.js";

/** Stable dev seed IDs — safe for fixtures and e2e. */
export const SEED_USER_ALICE = "00000000-0000-4000-8000-000000000001" as UserId;
export const SEED_USER_BOB = "00000000-0000-4000-8000-000000000002" as UserId;

export const SEED_SPACE_ACME = "00000000-0000-4000-8000-000000000010" as SpaceId;
export const SEED_SPACE_ENGINEERING = "00000000-0000-4000-8000-000000000011" as SpaceId;

export const SEED_ARTIFACT_PERSONAL_NOTES = "00000000-0000-4000-8000-000000000020" as ArtifactId;
export const SEED_ARTIFACT_ONBOARDING_NOTES =
  "00000000-0000-4000-8000-000000000021" as ArtifactId;

export const TipTapDoc = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .catchall(z.unknown());
export type TipTapDoc = z.infer<typeof TipTapDoc>;

export const SpaceRole = z.enum(["owner", "admin", "member"]);
export type SpaceRole = z.infer<typeof SpaceRole>;

export const SpaceVisibility = z.enum(["public", "private"]);
export type SpaceVisibility = z.infer<typeof SpaceVisibility>;

export const SpacePreset = z.enum(["folder", "project", "scrum"]);
export type SpacePreset = z.infer<typeof SpacePreset>;

export const SprintRole = z.enum(["upcoming", "active", "past"]);
export type SprintRole = z.infer<typeof SprintRole>;

export const StageKind = z.enum(["idle", "in_progress", "blocked", "settled", "cancelled"]);
export type StageKind = z.infer<typeof StageKind>;

export const DocumentTypeKey = z.enum(["issue", "spec", "doc"]);
export type DocumentTypeKey = z.infer<typeof DocumentTypeKey>;

export const SprintDurationWeeks = z.union([z.literal(1), z.literal(2), z.literal(4)]);
export type SprintDurationWeeks = z.infer<typeof SprintDurationWeeks>;

export const AssignableSpaceRole = z.enum(["admin", "member"]);
export type AssignableSpaceRole = z.infer<typeof AssignableSpaceRole>;

export const ArtifactKind = z.enum(["document", "conversation"]);
export type ArtifactKind = z.infer<typeof ArtifactKind>;

export const DEFAULT_SPACE_ICON = "folder" as const;

export const SpaceIcon = z.enum([
  DEFAULT_SPACE_ICON,
  "briefcase",
  "rocket",
  "heart",
  "star",
  "code",
  "users",
  "book",
]);
export type SpaceIcon = z.infer<typeof SpaceIcon>;

export const SpaceSummary = z.object({
  id: SpaceId,
  title: z.string(),
  icon: SpaceIcon.nullable(),
  parentSpaceId: SpaceId.nullable(),
  rootSpaceId: SpaceId.nullable(),
  visibility: SpaceVisibility,
  createdBy: UserId,
  showBacklog: z.boolean(),
  showBoard: z.boolean(),
  sprintingEnabled: z.boolean(),
  sprintRole: SprintRole.nullable(),
  sprintDurationWeeks: SprintDurationWeeks,
  activeSprintId: SpaceId.nullable(),
  upcomingSprintId: SpaceId.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SpaceSummary = z.infer<typeof SpaceSummary>;

export const DEFAULT_SPACE_PLANNING = {
  showBacklog: false,
  showBoard: false,
  sprintingEnabled: false,
  sprintRole: null,
  sprintDurationWeeks: 2,
  activeSprintId: null,
  upcomingSprintId: null,
} as const satisfies Pick<
  SpaceSummary,
  | "showBacklog"
  | "showBoard"
  | "sprintingEnabled"
  | "sprintRole"
  | "sprintDurationWeeks"
  | "activeSprintId"
  | "upcomingSprintId"
>;

export const SpaceMember = z.object({
  userId: UserId,
  name: z.string(),
  username: z.string().nullable(),
  role: SpaceRole,
  createdAt: z.string().datetime(),
});
export type SpaceMember = z.infer<typeof SpaceMember>;

export const ArtifactSummary = z.object({
  id: ArtifactId,
  kind: ArtifactKind,
  title: z.string(),
  spaceId: SpaceId.nullable(),
  rootSpaceId: SpaceId.nullable(),
  createdBy: UserId,
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  rank: z.number().int().optional(),
  stageId: WorkflowStageId.nullable().optional(),
  stageName: z.string().nullable().optional(),
  stageKind: StageKind.nullable().optional(),
  documentTypeId: DocumentTypeId.nullable().optional(),
  documentTypeKey: DocumentTypeKey.nullable().optional(),
});
export type ArtifactSummary = z.infer<typeof ArtifactSummary>;

export const DocumentView = ArtifactSummary.extend({
  body: TipTapDoc,
});
export type DocumentView = z.infer<typeof DocumentView>;

export const WorkflowStageView = z.object({
  id: WorkflowStageId,
  name: z.string(),
  kind: StageKind,
  sort: z.number().int(),
  allowedSourceStageIds: z.array(WorkflowStageId),
});
export type WorkflowStageView = z.infer<typeof WorkflowStageView>;

export const WorkflowView = z.object({
  id: WorkflowId,
  name: z.string(),
  spaceId: SpaceId,
  stages: z.array(WorkflowStageView),
});
export type WorkflowView = z.infer<typeof WorkflowView>;

export const DocumentTypeView = z.object({
  id: DocumentTypeId,
  name: z.string(),
  key: DocumentTypeKey,
  workflowId: WorkflowId.nullable(),
});
export type DocumentTypeView = z.infer<typeof DocumentTypeView>;

export const HomeResponse = z.object({
  spaces: z.array(SpaceSummary),
  artifacts: z.array(ArtifactSummary),
});
export type HomeResponse = z.infer<typeof HomeResponse>;

export const SpaceDetailResponse = z.object({
  space: SpaceSummary,
  childSpaces: z.array(SpaceSummary),
  artifacts: z.array(ArtifactSummary),
  members: z.array(SpaceMember),
  canManage: z.boolean(),
  workflow: WorkflowView.nullable(),
  documentTypes: z.array(DocumentTypeView),
});
export type SpaceDetailResponse = z.infer<typeof SpaceDetailResponse>;

export const AddSpaceMemberInput = z.object({
  username: z.string().trim().min(1).max(64),
  role: AssignableSpaceRole.default("member"),
});
export type AddSpaceMemberInput = z.infer<typeof AddSpaceMemberInput>;

export const AddSpaceMemberResponse = z.object({
  member: SpaceMember,
});
export type AddSpaceMemberResponse = z.infer<typeof AddSpaceMemberResponse>;

export const PatchSpaceInput = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  icon: SpaceIcon.nullable().optional(),
  visibility: SpaceVisibility.optional(),
  parentSpaceId: SpaceId.nullable().optional(),
});
export type PatchSpaceInput = z.infer<typeof PatchSpaceInput>;

export const PatchSpaceResponse = z.object({
  space: SpaceSummary,
});
export type PatchSpaceResponse = z.infer<typeof PatchSpaceResponse>;

export const CreateSpaceInput = z.object({
  title: z.string().trim().min(1).max(200),
  parentSpaceId: SpaceId.optional(),
  visibility: SpaceVisibility.optional(),
  preset: SpacePreset.optional(),
});
export type CreateSpaceInput = z.infer<typeof CreateSpaceInput>;

export const CreateSpaceResponse = z.object({
  space: SpaceSummary,
});
export type CreateSpaceResponse = z.infer<typeof CreateSpaceResponse>;

export const EnableSprintsResponse = z.object({
  space: SpaceSummary,
});
export type EnableSprintsResponse = z.infer<typeof EnableSprintsResponse>;

export const CreateDocumentInput = z.object({
  title: z.string().trim().max(200).optional(),
  spaceId: SpaceId.optional(),
  body: TipTapDoc.optional(),
  documentTypeKey: DocumentTypeKey.optional(),
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentInput>;

export const CreateDocumentResponse = z.object({
  document: DocumentView,
});
export type CreateDocumentResponse = z.infer<typeof CreateDocumentResponse>;

export const PatchDocumentInput = z.object({
  title: z.string().trim().max(200).optional(),
  body: TipTapDoc.optional(),
  spaceId: SpaceId.nullable().optional(),
  afterId: ArtifactId.nullable().optional(),
  beforeId: ArtifactId.nullable().optional(),
  stageId: WorkflowStageId.nullable().optional(),
  version: z.number().int().positive(),
});
export type PatchDocumentInput = z.infer<typeof PatchDocumentInput>;

export const GetDocumentResponse = z.object({
  document: DocumentView,
});
export type GetDocumentResponse = z.infer<typeof GetDocumentResponse>;

export const PatchDocumentResponse = z.object({
  document: DocumentView,
});
export type PatchDocumentResponse = z.infer<typeof PatchDocumentResponse>;

export const DocumentConflictResponse = z.object({
  error: z.literal("conflict"),
  document: DocumentView,
});
export type DocumentConflictResponse = z.infer<typeof DocumentConflictResponse>;

export const ConversationKind = z.enum(["regular", "direct"]);
export type ConversationKind = z.infer<typeof ConversationKind>;

export const ConversationView = ArtifactSummary.extend({
  conversationKind: ConversationKind,
});
export type ConversationView = z.infer<typeof ConversationView>;

export const CreateConversationInput = z.object({
  title: z.string().trim().max(200).optional(),
  spaceId: SpaceId.optional(),
  /** Accepted for create+send; persisted when messaging ships. */
  initialMessage: TipTapDoc.optional(),
});
export type CreateConversationInput = z.infer<typeof CreateConversationInput>;

export const CreateDirectConversationInput = z
  .object({
    rootSpaceId: SpaceId,
    /** Other participants by id; the creator is added server-side. */
    memberUserIds: z.array(UserId).min(1).optional(),
    /** Other participants by username; resolved within the root space roster. */
    memberUsernames: z.array(z.string().trim().min(1)).min(1).optional(),
    /** Optional nested-space context where the DM was started. */
    spaceId: SpaceId.optional(),
    title: z.string().trim().max(200).optional(),
  })
  .refine(
    (value) =>
      (value.memberUserIds?.length ?? 0) > 0 || (value.memberUsernames?.length ?? 0) > 0,
    { message: "Provide memberUserIds or memberUsernames" },
  );
export type CreateDirectConversationInput = z.infer<typeof CreateDirectConversationInput>;

export const ListDirectConversationsResponse = z.object({
  conversations: z.array(ConversationView),
});
export type ListDirectConversationsResponse = z.infer<typeof ListDirectConversationsResponse>;

export const CreateDirectConversationResponse = z.object({
  conversation: ConversationView,
  created: z.boolean(),
});
export type CreateDirectConversationResponse = z.infer<typeof CreateDirectConversationResponse>;

export const CreateConversationResponse = z.object({
  conversation: ConversationView,
});
export type CreateConversationResponse = z.infer<typeof CreateConversationResponse>;

export const PatchConversationInput = z.object({
  title: z.string().trim().max(200).optional(),
  version: z.number().int().positive(),
});
export type PatchConversationInput = z.infer<typeof PatchConversationInput>;

export const GetConversationResponse = z.object({
  conversation: ConversationView,
});
export type GetConversationResponse = z.infer<typeof GetConversationResponse>;

export const PatchConversationResponse = z.object({
  conversation: ConversationView,
});
export type PatchConversationResponse = z.infer<typeof PatchConversationResponse>;

export const ConversationConflictResponse = z.object({
  error: z.literal("conflict"),
  conversation: ConversationView,
});
export type ConversationConflictResponse = z.infer<typeof ConversationConflictResponse>;
