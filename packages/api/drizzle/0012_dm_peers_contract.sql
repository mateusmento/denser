-- Expand: backfill conversation_peer from conversation_member for directs
INSERT INTO "conversation_peer" ("conversation_artifact_id", "user_id", "created_at")
SELECT cm."conversation_artifact_id", cm."user_id", cm."joined_at"
FROM "conversation_member" cm
INNER JOIN "conversation" c ON c."artifact_id" = cm."conversation_artifact_id"
WHERE c."conversation_kind" = 'direct'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
CREATE TABLE "dm_sidebar_preference" (
	"user_id" uuid NOT NULL,
	"conversation_artifact_id" uuid NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dm_sidebar_preference_user_id_conversation_artifact_id_pk" PRIMARY KEY("user_id","conversation_artifact_id")
);
--> statement-breakpoint
ALTER TABLE "dm_sidebar_preference" ADD CONSTRAINT "dm_sidebar_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_sidebar_preference" ADD CONSTRAINT "dm_sidebar_preference_conversation_artifact_id_artifact_id_fk" FOREIGN KEY ("conversation_artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_peer_user_idx" ON "conversation_peer" USING btree ("user_id");--> statement-breakpoint
DROP INDEX IF EXISTS "conversation_member_user_idx";--> statement-breakpoint
DROP TABLE "conversation_member";
