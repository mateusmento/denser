CREATE TYPE "public"."scheduled_job_type" AS ENUM('scheduled_message', 'meeting_start', 'meeting_reminder');--> statement-breakpoint
CREATE TABLE "conversation_peer" (
	"conversation_artifact_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_peer_conversation_artifact_id_user_id_pk" PRIMARY KEY("conversation_artifact_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root_space_id" uuid,
	"conversation_id" uuid NOT NULL,
	"thread_id" uuid,
	"quotes_id" uuid,
	"author_id" uuid NOT NULL,
	"body" jsonb,
	"client_id" uuid,
	"occurrence_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "message_thread_self_reference" CHECK ("message"."id" <> "message"."thread_id")
);
--> statement-breakpoint
CREATE TABLE "read_state" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "read_state_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root_space_id" uuid NOT NULL,
	"conversation_id" uuid,
	"uploaded_by" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"original_filename" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_attachment" (
	"message_id" uuid NOT NULL,
	"attachment_id" uuid NOT NULL,
	CONSTRAINT "message_attachment_message_id_attachment_id_pk" PRIMARY KEY("message_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "message_draft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root_space_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"thread_id" uuid,
	"body" jsonb,
	"quotes_id" uuid,
	"version" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_draft_attachment" (
	"draft_id" uuid NOT NULL,
	"attachment_id" uuid NOT NULL,
	CONSTRAINT "message_draft_attachment_draft_id_attachment_id_pk" PRIMARY KEY("draft_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "scheduled_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root_space_id" uuid NOT NULL,
	"type" "scheduled_job_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"timezone" text,
	"recurrence" jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	"last_occurrence_at" timestamp with time zone,
	"lock_id" uuid,
	"locked_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_job_attachment" (
	"job_id" uuid NOT NULL,
	"attachment_id" uuid NOT NULL,
	CONSTRAINT "scheduled_job_attachment_job_id_attachment_id_pk" PRIMARY KEY("job_id","attachment_id")
);
--> statement-breakpoint
ALTER TABLE "conversation_peer" ADD CONSTRAINT "conversation_peer_conversation_artifact_id_artifact_id_fk" FOREIGN KEY ("conversation_artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_peer" ADD CONSTRAINT "conversation_peer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_artifact_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "read_state" ADD CONSTRAINT "read_state_conversation_id_artifact_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "read_state" ADD CONSTRAINT "read_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_root_space_id_space_id_fk" FOREIGN KEY ("root_space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_conversation_id_artifact_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_attachment_id_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_draft" ADD CONSTRAINT "message_draft_root_space_id_space_id_fk" FOREIGN KEY ("root_space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_draft" ADD CONSTRAINT "message_draft_conversation_id_artifact_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_draft" ADD CONSTRAINT "message_draft_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_draft_attachment" ADD CONSTRAINT "message_draft_attachment_draft_id_message_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."message_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_draft_attachment" ADD CONSTRAINT "message_draft_attachment_attachment_id_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_job" ADD CONSTRAINT "scheduled_job_root_space_id_space_id_fk" FOREIGN KEY ("root_space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_job_attachment" ADD CONSTRAINT "scheduled_job_attachment_job_id_scheduled_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scheduled_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_job_attachment" ADD CONSTRAINT "scheduled_job_attachment_attachment_id_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_conversation_created_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "message_thread_id_idx" ON "message" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "message_client_id_idx" ON "message" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_occurrence_key_unique" ON "message" USING btree ("occurrence_key");--> statement-breakpoint
CREATE INDEX "attachment_root_space_idx" ON "attachment" USING btree ("root_space_id");--> statement-breakpoint
CREATE INDEX "message_attachment_attachment_id_idx" ON "message_attachment" USING btree ("attachment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_draft_main_unique" ON "message_draft" USING btree ("conversation_id","author_id") WHERE "message_draft"."thread_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "message_draft_thread_unique" ON "message_draft" USING btree ("conversation_id","author_id","thread_id") WHERE "message_draft"."thread_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "message_draft_attachment_attachment_id_idx" ON "message_draft_attachment" USING btree ("attachment_id");--> statement-breakpoint
CREATE INDEX "scheduled_job_next_run_idx" ON "scheduled_job" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "scheduled_job_root_space_type_idx" ON "scheduled_job" USING btree ("root_space_id","type");--> statement-breakpoint
CREATE INDEX "scheduled_job_attachment_attachment_id_idx" ON "scheduled_job_attachment" USING btree ("attachment_id");