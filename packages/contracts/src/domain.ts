import { z } from "zod";
import { ArtifactId, SpaceId, UserId } from "./ids.js";

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

export const AssignableSpaceRole = z.enum(["admin", "member"]);
export type AssignableSpaceRole = z.infer<typeof AssignableSpaceRole>;

export const ArtifactKind = z.enum(["document"]);
export type ArtifactKind = z.infer<typeof ArtifactKind>;

export const SpaceIcon = z.enum([
  "folder",
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SpaceSummary = z.infer<typeof SpaceSummary>;

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
});
export type ArtifactSummary = z.infer<typeof ArtifactSummary>;

export const DocumentView = ArtifactSummary.extend({
  body: TipTapDoc,
});
export type DocumentView = z.infer<typeof DocumentView>;

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
});
export type CreateSpaceInput = z.infer<typeof CreateSpaceInput>;

export const CreateSpaceResponse = z.object({
  space: SpaceSummary,
});
export type CreateSpaceResponse = z.infer<typeof CreateSpaceResponse>;

export const CreateDocumentInput = z.object({
  title: z.string().trim().max(200).optional(),
  spaceId: SpaceId.optional(),
  body: TipTapDoc.optional(),
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentInput>;

export const CreateDocumentResponse = z.object({
  document: DocumentView,
});
export type CreateDocumentResponse = z.infer<typeof CreateDocumentResponse>;

export const PatchDocumentInput = z.object({
  title: z.string().trim().max(200).optional(),
  body: TipTapDoc.optional(),
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
