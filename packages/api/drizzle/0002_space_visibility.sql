CREATE TYPE "public"."space_visibility" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "visibility" "space_visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
UPDATE "space" SET "visibility" = 'private' WHERE "parent_space_id" IS NULL;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_root_is_private" CHECK (("parent_space_id" IS NOT NULL) OR ("visibility" = 'private'));
