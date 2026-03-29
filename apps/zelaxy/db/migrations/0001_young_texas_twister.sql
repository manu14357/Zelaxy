CREATE TYPE "public"."image_catalog_status" AS ENUM('active', 'indexing', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."image_data_source" AS ENUM('upload', 'network', 's3', 'azure_blob', 'google_drive', 'postgresql', 'mssql', 'url');--> statement-breakpoint
CREATE TYPE "public"."image_doc_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."image_embedding_type" AS ENUM('text', 'visual', 'combined');--> statement-breakpoint
CREATE TYPE "public"."image_extraction_method" AS ENUM('auto', 'oda', 'autodesk_aps', 'ai_vision', 'ocr');--> statement-breakpoint
CREATE TYPE "public"."image_processing_mode" AS ENUM('batch', 'realtime');--> statement-breakpoint
CREATE TABLE "image_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"name" text NOT NULL,
	"description" text,
	"file_count" integer DEFAULT 0 NOT NULL,
	"total_size_bytes" integer DEFAULT 0 NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"embedding_dimension" integer DEFAULT 1536 NOT NULL,
	"data_source" "image_data_source" DEFAULT 'upload' NOT NULL,
	"connection_config" jsonb DEFAULT '{}',
	"processing_mode" "image_processing_mode" DEFAULT 'batch' NOT NULL,
	"extraction_method" "image_extraction_method" DEFAULT 'auto' NOT NULL,
	"status" "image_catalog_status" DEFAULT 'active' NOT NULL,
	"last_indexed_at" timestamp,
	"indexing_progress" integer DEFAULT 0,
	"indexing_error" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_catalog_tag_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"tag_slot" text NOT NULL,
	"display_name" text NOT NULL,
	"field_type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_document" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"filename" text NOT NULL,
	"file_path" text,
	"file_url" text,
	"file_size" integer DEFAULT 0 NOT NULL,
	"mime_type" text NOT NULL,
	"file_type" text NOT NULL,
	"thumbnail_url" text,
	"processing_status" "image_doc_processing_status" DEFAULT 'pending' NOT NULL,
	"processing_started_at" timestamp,
	"processing_completed_at" timestamp,
	"processing_error" text,
	"extraction_method" "image_extraction_method" DEFAULT 'auto' NOT NULL,
	"extracted_text" text,
	"extracted_text_length" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}',
	"spatial_data" jsonb DEFAULT '{}',
	"tag1" text,
	"tag2" text,
	"tag3" text,
	"tag4" text,
	"tag5" text,
	"tag6" text,
	"tag7" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"document_id" text NOT NULL,
	"embedding_type" "image_embedding_type" DEFAULT 'text' NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"chunk_hash" text,
	"content" text NOT NULL,
	"content_length" integer NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(2000),
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"start_offset" integer DEFAULT 0 NOT NULL,
	"end_offset" integer DEFAULT 0 NOT NULL,
	"tag1" text,
	"tag2" text,
	"tag3" text,
	"tag4" text,
	"tag5" text,
	"tag6" text,
	"tag7" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"content_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "image_embedding"."content")) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "img_embedding_not_null_check" CHECK ("embedding" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "image_catalog" ADD CONSTRAINT "image_catalog_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_catalog" ADD CONSTRAINT "image_catalog_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_catalog_tag_definitions" ADD CONSTRAINT "image_catalog_tag_definitions_catalog_id_image_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."image_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_document" ADD CONSTRAINT "image_document_catalog_id_image_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."image_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_embedding" ADD CONSTRAINT "image_embedding_catalog_id_image_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."image_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_embedding" ADD CONSTRAINT "image_embedding_document_id_image_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."image_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "img_catalog_user_id_idx" ON "image_catalog" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "img_catalog_workspace_id_idx" ON "image_catalog" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "img_catalog_user_workspace_idx" ON "image_catalog" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "img_catalog_status_idx" ON "image_catalog" USING btree ("status");--> statement-breakpoint
CREATE INDEX "img_catalog_deleted_at_idx" ON "image_catalog" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "img_catalog_data_source_idx" ON "image_catalog" USING btree ("data_source");--> statement-breakpoint
CREATE UNIQUE INDEX "img_cat_tag_def_catalog_slot_idx" ON "image_catalog_tag_definitions" USING btree ("catalog_id","tag_slot");--> statement-breakpoint
CREATE UNIQUE INDEX "img_cat_tag_def_catalog_display_name_idx" ON "image_catalog_tag_definitions" USING btree ("catalog_id","display_name");--> statement-breakpoint
CREATE INDEX "img_cat_tag_def_catalog_id_idx" ON "image_catalog_tag_definitions" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "img_doc_catalog_id_idx" ON "image_document" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "img_doc_filename_idx" ON "image_document" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "img_doc_file_type_idx" ON "image_document" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "img_doc_processing_status_idx" ON "image_document" USING btree ("catalog_id","processing_status");--> statement-breakpoint
CREATE INDEX "img_doc_catalog_created_at_idx" ON "image_document" USING btree ("catalog_id","created_at");--> statement-breakpoint
CREATE INDEX "img_doc_tag1_idx" ON "image_document" USING btree ("tag1");--> statement-breakpoint
CREATE INDEX "img_doc_tag2_idx" ON "image_document" USING btree ("tag2");--> statement-breakpoint
CREATE INDEX "img_doc_tag3_idx" ON "image_document" USING btree ("tag3");--> statement-breakpoint
CREATE INDEX "img_doc_tag4_idx" ON "image_document" USING btree ("tag4");--> statement-breakpoint
CREATE INDEX "img_doc_tag5_idx" ON "image_document" USING btree ("tag5");--> statement-breakpoint
CREATE INDEX "img_doc_tag6_idx" ON "image_document" USING btree ("tag6");--> statement-breakpoint
CREATE INDEX "img_doc_tag7_idx" ON "image_document" USING btree ("tag7");--> statement-breakpoint
CREATE INDEX "img_doc_metadata_gin_idx" ON "image_document" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "img_doc_spatial_data_gin_idx" ON "image_document" USING gin ("spatial_data");--> statement-breakpoint
CREATE INDEX "img_emb_catalog_id_idx" ON "image_embedding" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "img_emb_doc_id_idx" ON "image_embedding" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "img_emb_doc_chunk_idx" ON "image_embedding" USING btree ("document_id","embedding_type","chunk_index");--> statement-breakpoint
CREATE INDEX "img_emb_type_idx" ON "image_embedding" USING btree ("catalog_id","embedding_type");--> statement-breakpoint
CREATE INDEX "img_emb_catalog_model_idx" ON "image_embedding" USING btree ("catalog_id","embedding_model");--> statement-breakpoint
CREATE INDEX "img_emb_catalog_enabled_idx" ON "image_embedding" USING btree ("catalog_id","enabled");--> statement-breakpoint
CREATE INDEX "img_embedding_vector_hnsw_idx" ON "image_embedding" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "img_emb_tag1_idx" ON "image_embedding" USING btree ("tag1");--> statement-breakpoint
CREATE INDEX "img_emb_tag2_idx" ON "image_embedding" USING btree ("tag2");--> statement-breakpoint
CREATE INDEX "img_emb_tag3_idx" ON "image_embedding" USING btree ("tag3");--> statement-breakpoint
CREATE INDEX "img_emb_tag4_idx" ON "image_embedding" USING btree ("tag4");--> statement-breakpoint
CREATE INDEX "img_emb_tag5_idx" ON "image_embedding" USING btree ("tag5");--> statement-breakpoint
CREATE INDEX "img_emb_tag6_idx" ON "image_embedding" USING btree ("tag6");--> statement-breakpoint
CREATE INDEX "img_emb_tag7_idx" ON "image_embedding" USING btree ("tag7");--> statement-breakpoint
CREATE INDEX "img_emb_content_fts_idx" ON "image_embedding" USING gin ("content_tsv");