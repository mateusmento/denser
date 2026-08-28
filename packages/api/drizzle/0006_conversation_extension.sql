CREATE TYPE "public"."conversation_kind" AS ENUM('regular', 'direct');--> statement-breakpoint
CREATE TABLE "conversation" (
	"artifact_id" uuid PRIMARY KEY NOT NULL,
	"conversation_kind" "conversation_kind" DEFAULT 'regular' NOT NULL,
	"root_space_id" uuid,
	"member_set_key" text,
	"intro" text
);--> statement-breakpoint
CREATE TABLE "conversation_member" (
	"conversation_artifact_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_member_conversation_artifact_id_user_id_pk" PRIMARY KEY("conversation_artifact_id","user_id")
);--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_conversation_artifact_id_artifact_id_fk" FOREIGN KEY ("conversation_artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_direct_dedupe_idx" ON "conversation" USING btree ("root_space_id","member_set_key") WHERE conversation_kind = 'direct' AND member_set_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX "conversation_member_user_idx" ON "conversation_member" USING btree ("user_id");
