import type { ArtifactId, TipTapDoc } from "@denser/contracts";
import { jsonb, pgTable, uuid } from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";

export const document = pgTable("document", {
  artifactId: uuid("artifact_id")
    .$type<ArtifactId>()
    .primaryKey()
    .references(() => artifact.id, { onDelete: "cascade" }),
  body: jsonb("body").$type<TipTapDoc>().notNull(),
});
