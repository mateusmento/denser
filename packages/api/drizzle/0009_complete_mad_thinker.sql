ALTER TABLE "document_type" ADD COLUMN "properties" jsonb DEFAULT '[]'::jsonb NOT NULL;
