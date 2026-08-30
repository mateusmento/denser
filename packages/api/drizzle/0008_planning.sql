CREATE TYPE "public"."sprint_role" AS ENUM('upcoming', 'active', 'past');--> statement-breakpoint
CREATE TYPE "public"."stage_kind" AS ENUM('idle', 'in_progress', 'blocked', 'settled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."document_type_key" AS ENUM('issue', 'spec', 'doc');--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "show_backlog" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "show_board" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "sprinting_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "sprint_role" "sprint_role";--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "sprint_duration_weeks" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "next_sprint_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "sprint_goal" text;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "sprint_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "sprint_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "sprint_planned_end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "active_sprint_id" uuid;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "upcoming_sprint_id" uuid;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_sprint_duration" CHECK ("space"."sprint_duration_weeks" IN (1, 2, 4));--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_active_sprint_id_space_id_fk" FOREIGN KEY ("active_sprint_id") REFERENCES "public"."space"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_upcoming_sprint_id_space_id_fk" FOREIGN KEY ("upcoming_sprint_id") REFERENCES "public"."space"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"name" text NOT NULL
);--> statement-breakpoint
CREATE TABLE "workflow_stage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "stage_kind" NOT NULL,
	"sort" integer NOT NULL,
	"allowed_source_stage_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL
);--> statement-breakpoint
CREATE TABLE "document_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" "document_type_key" NOT NULL,
	"builtin" boolean DEFAULT true NOT NULL,
	"workflow_id" uuid
);--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_stage" ADD CONSTRAINT "workflow_stage_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_type" ADD CONSTRAINT "document_type_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_type" ADD CONSTRAINT "document_type_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_space_id_idx" ON "workflow" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "workflow_stage_workflow_id_idx" ON "workflow_stage" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "document_type_space_id_idx" ON "document_type" USING btree ("space_id");--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "document_type_id" uuid;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "stage_id" uuid;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "rank" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "identifier" text;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "fields" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_document_type_id_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_stage_id_workflow_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."workflow_stage"("id") ON DELETE set null ON UPDATE no action;
