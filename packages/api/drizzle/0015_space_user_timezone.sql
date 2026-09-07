CREATE TYPE "user_timezone_source" AS ENUM('auto', 'manual');

ALTER TABLE "user" ADD COLUMN "timezone" text;
ALTER TABLE "user" ADD COLUMN "timezone_source" "user_timezone_source" DEFAULT 'auto' NOT NULL;

ALTER TABLE "space" ADD COLUMN "timezone" text;

UPDATE "space" SET "timezone" = 'UTC' WHERE "visibility" = 'private';

ALTER TABLE "space" ADD CONSTRAINT "space_timezone_visibility"
  CHECK (
    ("visibility" = 'public' AND "timezone" IS NULL) OR
    ("visibility" = 'private' AND "timezone" IS NOT NULL)
  );
