ALTER TABLE "document_type" ALTER COLUMN "space_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_type" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "document_type" ADD CONSTRAINT "document_type_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_type_home_owner_key_idx" ON "document_type" USING btree ("created_by","key") WHERE "space_id" IS NULL;
