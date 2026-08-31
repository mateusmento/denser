import { z } from "zod";
import {
  ArtifactId,
  DocumentTypeId,
  PropertyDefinitionId,
  SpaceId,
  UserId,
  WorkflowId,
  WorkflowStageId,
} from "./ids.js";

/** Stable dev seed IDs — safe for fixtures and e2e. */
export const SEED_USER_ALICE = "00000000-0000-4000-8000-000000000001" as UserId;
export const SEED_USER_BOB = "00000000-0000-4000-8000-000000000002" as UserId;
export const SEED_USER_CAROL = "00000000-0000-4000-8000-000000000003" as UserId;
export const SEED_USER_DAVID = "00000000-0000-4000-8000-000000000004" as UserId;
export const SEED_USER_EMMA = "00000000-0000-4000-8000-000000000005" as UserId;
export const SEED_USER_FRANK = "00000000-0000-4000-8000-000000000006" as UserId;

export const SEED_SPACE_ACME = "00000000-0000-4000-8000-000000000010" as SpaceId;
export const SEED_SPACE_ENGINEERING = "00000000-0000-4000-8000-000000000011" as SpaceId;
export const SEED_SPACE_CORE_PLATFORM = "00000000-0000-4000-8000-000000000012" as SpaceId;
export const SEED_SPACE_SPRINT_PAST = "00000000-0000-4000-8000-000000000013" as SpaceId;
export const SEED_SPACE_SPRINT_ACTIVE = "00000000-0000-4000-8000-000000000014" as SpaceId;
export const SEED_SPACE_SPRINT_UPCOMING = "00000000-0000-4000-8000-000000000015" as SpaceId;
export const SEED_SPACE_MOBILE_PROJECT = "00000000-0000-4000-8000-000000000016" as SpaceId;
export const SEED_SPACE_ARCH_RFCS = "00000000-0000-4000-8000-000000000017" as SpaceId;
export const SEED_SPACE_LEADERSHIP = "00000000-0000-4000-8000-000000000018" as SpaceId;
export const SEED_SPACE_DESIGN_SYSTEM = "00000000-0000-4000-8000-000000000019" as SpaceId;
export const SEED_SPACE_RESEARCH = "00000000-0000-4000-8000-00000000001a" as SpaceId;
export const SEED_SPACE_GROWTH_SCRUM = "00000000-0000-4000-8000-00000000001b" as SpaceId;
export const SEED_SPACE_GROWTH_SPRINT_PAST = "00000000-0000-4000-8000-00000000001c" as SpaceId;
export const SEED_SPACE_GROWTH_SPRINT_ACTIVE = "00000000-0000-4000-8000-00000000001d" as SpaceId;
export const SEED_SPACE_GROWTH_SPRINT_UPCOMING = "00000000-0000-4000-8000-00000000001e" as SpaceId;

export const SEED_ARTIFACT_PERSONAL_NOTES = "00000000-0000-4000-8000-000000000020" as ArtifactId;
export const SEED_ARTIFACT_ONBOARDING_NOTES = "00000000-0000-4000-8000-000000000021" as ArtifactId;
export const SEED_ARTIFACT_ADR_001 = "00000000-0000-4000-8000-000000000022" as ArtifactId;
export const SEED_ARTIFACT_RFC_REALTIME = "00000000-0000-4000-8000-000000000023" as ArtifactId;
export const SEED_ARTIFACT_INCIDENT_RUNBOOK = "00000000-0000-4000-8000-000000000024" as ArtifactId;
export const SEED_ARTIFACT_API_GUIDELINES = "00000000-0000-4000-8000-000000000025" as ArtifactId;
export const SEED_ARTIFACT_DESIGN_TOKENS = "00000000-0000-4000-8000-000000000026" as ArtifactId;
export const SEED_ARTIFACT_A11Y_STANDARDS = "00000000-0000-4000-8000-000000000027" as ArtifactId;
export const SEED_ARTIFACT_STRATEGY_OKRS = "00000000-0000-4000-8000-000000000028" as ArtifactId;
export const SEED_ARTIFACT_USER_RESEARCH = "00000000-0000-4000-8000-000000000029" as ArtifactId;
export const SEED_ARTIFACT_WEEKLY_PRIORITIES = "00000000-0000-4000-8000-00000000002a" as ArtifactId;

export const SEED_ARTIFACT_CHAN_GENERAL = "00000000-0000-4000-8000-000000000030" as ArtifactId;
export const SEED_ARTIFACT_CHAN_ENGINEERING = "00000000-0000-4000-8000-000000000031" as ArtifactId;
export const SEED_ARTIFACT_CHAN_PRODUCT = "00000000-0000-4000-8000-000000000032" as ArtifactId;
export const SEED_ARTIFACT_CHAN_RANDOM = "00000000-0000-4000-8000-000000000033" as ArtifactId;
export const SEED_ARTIFACT_DM_CAROL = "00000000-0000-4000-8000-000000000034" as ArtifactId;
export const SEED_ARTIFACT_DM_DAVID = "00000000-0000-4000-8000-000000000035" as ArtifactId;
export const SEED_ARTIFACT_DM_GROUP = "00000000-0000-4000-8000-000000000036" as ArtifactId;

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

export const PropertyType = z.enum([
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "person",
  "relation",
]);
export type PropertyType = z.infer<typeof PropertyType>;

export const PropertyOption = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
});
export type PropertyOption = z.infer<typeof PropertyOption>;

export const PropertyDefinition = z.object({
  id: PropertyDefinitionId,
  key: z.string(),
  name: z.string(),
  type: PropertyType,
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  options: z.array(PropertyOption).optional(),
  relationSpaceId: SpaceId.nullable().optional(),
  allowMultiple: z.boolean().optional(),
  order: z.number().int().default(0),
});
export type PropertyDefinition = z.infer<typeof PropertyDefinition>;

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
  allowedArtifactKinds: z.array(ArtifactKind).nullable().optional(),
  allowedDocumentTypeIds: z.array(DocumentTypeId).nullable().optional(),
  defaultDocumentTypeId: DocumentTypeId.nullable().optional(),
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
  properties: z.record(z.string(), z.unknown()).optional(),
});
export type ArtifactSummary = z.infer<typeof ArtifactSummary>;

export const DocumentView = ArtifactSummary.extend({
  body: TipTapDoc,
  properties: z.record(z.string(), z.unknown()).default({}),
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
  properties: z.array(PropertyDefinition).default([]),
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
  allowedArtifactKinds: z.array(ArtifactKind).nullable().optional(),
  allowedDocumentTypeIds: z.array(DocumentTypeId).nullable().optional(),
  defaultDocumentTypeId: DocumentTypeId.nullable().optional(),
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
  allowedArtifactKinds: z.array(ArtifactKind).nullable().optional(),
  allowedDocumentTypeIds: z.array(DocumentTypeId).nullable().optional(),
  defaultDocumentTypeId: DocumentTypeId.nullable().optional(),
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
  documentTypeId: DocumentTypeId.nullable().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
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
  documentTypeId: DocumentTypeId.nullable().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
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
    (value) => (value.memberUserIds?.length ?? 0) > 0 || (value.memberUsernames?.length ?? 0) > 0,
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
