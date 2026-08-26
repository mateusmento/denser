UPDATE "space" SET "icon" = 'folder' WHERE "icon" IS NULL;
--> statement-breakpoint
ALTER TABLE "space" ALTER COLUMN "icon" SET DEFAULT 'folder';
