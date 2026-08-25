CREATE TYPE "public"."artifact_kind" AS ENUM('document');--> statement-breakpoint
CREATE TYPE "public"."space_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "artifact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "artifact_kind" NOT NULL,
	"title" text NOT NULL,
	"space_id" uuid,
	"root_space_id" uuid,
	"created_by" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_location_invariant" CHECK ((
        ("artifact"."space_id" IS NULL AND "artifact"."root_space_id" IS NULL) OR
        ("artifact"."space_id" IS NOT NULL AND "artifact"."root_space_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "document" (
	"artifact_id" uuid PRIMARY KEY NOT NULL,
	"body" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"parent_space_id" uuid,
	"root_space_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "space_location_invariant" CHECK ((
        ("space"."parent_space_id" IS NULL AND "space"."root_space_id" IS NULL) OR
        ("space"."parent_space_id" IS NOT NULL AND "space"."root_space_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "space_membership" (
	"space_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "space_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "space_membership_space_id_user_id_pk" PRIMARY KEY("space_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_membership" ADD CONSTRAINT "space_membership_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_membership" ADD CONSTRAINT "space_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifact_root_space_updated_idx" ON "artifact" USING btree ("root_space_id","updated_at");--> statement-breakpoint
CREATE INDEX "artifact_space_id_idx" ON "artifact" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "artifact_created_by_idx" ON "artifact" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "space_parent_space_id_idx" ON "space" USING btree ("parent_space_id");--> statement-breakpoint
CREATE INDEX "space_root_space_id_idx" ON "space" USING btree ("root_space_id");--> statement-breakpoint
CREATE INDEX "space_created_by_idx" ON "space" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "space_membership_user_id_idx" ON "space_membership" USING btree ("user_id");