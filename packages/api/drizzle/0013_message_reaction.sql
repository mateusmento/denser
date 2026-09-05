CREATE TABLE "message_reaction" (
	"message_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"user_id" uuid NOT NULL,
	"reacted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_reaction_message_id_emoji_user_id_pk" PRIMARY KEY("message_id","emoji","user_id")
);
--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_reaction_message_idx" ON "message_reaction" USING btree ("message_id");
