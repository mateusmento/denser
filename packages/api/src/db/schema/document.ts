import type { ArtifactId, DocumentTypeId, TipTapDoc, WorkflowStageId } from "@denser/contracts";
import { integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";
import { documentType, workflowStage } from "./workflow.js";

export const document = pgTable("document", {
  artifactId: uuid("artifact_id")
    .$type<ArtifactId>()
    .primaryKey()
    .references(() => artifact.id, { onDelete: "cascade" }),
  body: jsonb("body").$type<TipTapDoc>().notNull(),
  documentTypeId: uuid("document_type_id")
    .$type<DocumentTypeId>()
    .references(() => documentType.id, { onDelete: "set null" }),
  stageId: uuid("stage_id")
    .$type<WorkflowStageId>()
    .references(() => workflowStage.id, { onDelete: "set null" }),
  rank: integer("rank").notNull().default(0),
  identifier: text("identifier"),
  fields: jsonb("fields").$type<Record<string, unknown>>().notNull().default({}),
});
