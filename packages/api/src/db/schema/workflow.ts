import type {
  DocumentTypeId,
  PropertyDefinition,
  SpaceId,
  WorkflowId,
  WorkflowStageId,
} from "@denser/contracts";
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { space } from "./space.js";

export const stageKindEnum = pgEnum("stage_kind", [
  "idle",
  "in_progress",
  "blocked",
  "settled",
  "cancelled",
]);

export const documentTypeKeyEnum = pgEnum("document_type_key", ["issue", "spec", "doc"]);

export const workflow = pgTable(
  "workflow",
  {
    id: uuid("id").primaryKey().$type<WorkflowId>().defaultRandom(),
    spaceId: uuid("space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (table) => [index("workflow_space_id_idx").on(table.spaceId)],
);

export const workflowStage = pgTable(
  "workflow_stage",
  {
    id: uuid("id").primaryKey().$type<WorkflowStageId>().defaultRandom(),
    workflowId: uuid("workflow_id")
      .$type<WorkflowId>()
      .notNull()
      .references(() => workflow.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: stageKindEnum("kind").notNull(),
    sort: integer("sort").notNull(),
    allowedSourceStageIds: uuid("allowed_source_stage_ids")
      .array()
      .$type<WorkflowStageId[]>()
      .notNull()
      .default([]),
  },
  (table) => [index("workflow_stage_workflow_id_idx").on(table.workflowId)],
);

export const documentType = pgTable(
  "document_type",
  {
    id: uuid("id").primaryKey().$type<DocumentTypeId>().defaultRandom(),
    spaceId: uuid("space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: documentTypeKeyEnum("key").notNull(),
    builtin: boolean("builtin").notNull().default(true),
    workflowId: uuid("workflow_id")
      .$type<WorkflowId>()
      .references(() => workflow.id, { onDelete: "set null" }),
    properties: jsonb("properties")
      .$type<PropertyDefinition[]>()
      .notNull()
      .default([]),
  },
  (table) => [index("document_type_space_id_idx").on(table.spaceId)],
);
