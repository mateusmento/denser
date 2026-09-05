CREATE TABLE IF NOT EXISTS "message_poll" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "message_id" uuid NOT NULL,
  "question" text NOT NULL,
  CONSTRAINT "message_poll_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "message_poll_message_id_unique" ON "message_poll" ("message_id");

CREATE TABLE IF NOT EXISTS "message_poll_option" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "poll_id" uuid NOT NULL,
  "label" text NOT NULL,
  "position" integer NOT NULL,
  CONSTRAINT "message_poll_option_poll_id_message_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "message_poll"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "message_poll_option_poll_idx" ON "message_poll_option" ("poll_id");

CREATE TABLE IF NOT EXISTS "message_poll_vote" (
  "poll_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "option_id" uuid NOT NULL,
  "voted_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "message_poll_vote_poll_id_message_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "message_poll"("id") ON DELETE cascade,
  CONSTRAINT "message_poll_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "message_poll_vote_option_id_message_poll_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "message_poll_option"("id") ON DELETE cascade,
  CONSTRAINT "message_poll_vote_poll_id_user_id_pk" PRIMARY KEY("poll_id","user_id")
);
