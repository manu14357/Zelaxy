CREATE TYPE "public"."mcp_server_status" AS ENUM('connected', 'disconnected', 'error', 'connecting');--> statement-breakpoint
CREATE TYPE "public"."mcp_server_type" AS ENUM('stdio', 'sse', 'http');--> statement-breakpoint
CREATE TYPE "public"."permission_type" AS ENUM('admin', 'write', 'read');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "api_key_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "chat" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"user_id" text NOT NULL,
	"subdomain" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"customizations" json DEFAULT '{}',
	"auth_type" text DEFAULT 'public' NOT NULL,
	"password" text,
	"allowed_emails" json DEFAULT '[]',
	"output_configs" json DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copilot_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"title" text,
	"messages" jsonb DEFAULT '[]' NOT NULL,
	"model" text DEFAULT 'claude-3-7-sonnet-latest' NOT NULL,
	"preview_yaml" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copilot_feedback" (
	"feedback_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_query" text NOT NULL,
	"agent_response" text NOT NULL,
	"is_positive" boolean NOT NULL,
	"feedback" text,
	"workflow_yaml" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_tools" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"schema" json NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "docs_embeddings" (
	"chunk_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_text" text NOT NULL,
	"source_document" text NOT NULL,
	"source_link" text NOT NULL,
	"header_text" text NOT NULL,
	"header_level" integer NOT NULL,
	"token_count" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"chunk_text_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "docs_embeddings"."chunk_text")) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "docs_embedding_not_null_check" CHECK ("embedding" IS NOT NULL),
	CONSTRAINT "docs_header_level_check" CHECK ("header_level" >= 1 AND "header_level" <= 6)
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"knowledge_base_id" text NOT NULL,
	"filename" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"character_count" integer DEFAULT 0 NOT NULL,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"processing_started_at" timestamp,
	"processing_completed_at" timestamp,
	"processing_error" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"tag1" text,
	"tag2" text,
	"tag3" text,
	"tag4" text,
	"tag5" text,
	"tag6" text,
	"tag7" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"knowledge_base_id" text NOT NULL,
	"document_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"chunk_hash" text NOT NULL,
	"content" text NOT NULL,
	"content_length" integer NOT NULL,
	"token_count" integer NOT NULL,
	"embedding" vector(2000),
	"embedding_model" text DEFAULT 'nomic-embed-text' NOT NULL,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"tag1" text,
	"tag2" text,
	"tag3" text,
	"tag4" text,
	"tag5" text,
	"tag6" text,
	"tag7" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"content_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "embedding"."content")) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "embedding_not_null_check" CHECK ("embedding" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "environment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"variables" json NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "environment_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviter_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"name" text NOT NULL,
	"description" text,
	"token_count" integer DEFAULT 0 NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"embedding_dimension" integer DEFAULT 1536 NOT NULL,
	"chunking_config" json DEFAULT '{"maxSize": 1024, "minSize": 1, "overlap": 200}' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_tag_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"knowledge_base_id" text NOT NULL,
	"tag_slot" text NOT NULL,
	"display_name" text NOT NULL,
	"field_type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"state" json NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_server_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"tool_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text[] DEFAULT '{}',
	"input_schema" jsonb,
	"output_schema" jsonb,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_discovered" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "mcp_server_type" NOT NULL,
	"status" "mcp_server_status" DEFAULT 'disconnected' NOT NULL,
	"config" jsonb NOT NULL,
	"settings" jsonb DEFAULT '{"autoReconnect":true,"timeout":30,"retryAttempts":3,"rateLimit":60,"logging":"errors","validateSSL":true}'::jsonb NOT NULL,
	"tool_config" jsonb DEFAULT '{"autoDiscover":true,"refreshInterval":15,"categories":[]}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{"lastConnected":null,"toolCount":0,"avgLatency":0,"version":null}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_tool_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"tool_id" text NOT NULL,
	"user_id" text NOT NULL,
	"workflow_id" text,
	"parameters" jsonb,
	"result" jsonb,
	"success" boolean NOT NULL,
	"latency" integer,
	"error" text,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text,
	"key" text NOT NULL,
	"type" text NOT NULL,
	"data" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"permission_type" "permission_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"auto_connect" boolean DEFAULT true NOT NULL,
	"auto_fill_env_vars" boolean DEFAULT true NOT NULL,
	"auto_pan" boolean DEFAULT true NOT NULL,
	"console_expanded_by_default" boolean DEFAULT true NOT NULL,
	"telemetry_enabled" boolean DEFAULT false NOT NULL,
	"telemetry_notified_user" boolean DEFAULT true NOT NULL,
	"email_preferences" json DEFAULT '{}' NOT NULL,
	"general" json DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean,
	"seats" integer,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"metadata" json,
	CONSTRAINT "check_enterprise_metadata" CHECK (plan != 'enterprise' OR (metadata IS NOT NULL AND (metadata->>'perSeatAllowance' IS NOT NULL OR metadata->>'totalAllowance' IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "template_stars" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"template_id" text NOT NULL,
	"starred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"author" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#3972F6' NOT NULL,
	"icon" text DEFAULT 'FileText' NOT NULL,
	"category" text NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"bio" text,
	"company" text,
	"location" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"stripe_customer_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_rate_limits" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sync_api_requests" integer DEFAULT 0 NOT NULL,
	"async_api_requests" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"last_request_at" timestamp DEFAULT now() NOT NULL,
	"is_rate_limited" boolean DEFAULT false NOT NULL,
	"rate_limit_reset_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_manual_executions" integer DEFAULT 0 NOT NULL,
	"total_api_calls" integer DEFAULT 0 NOT NULL,
	"total_webhook_triggers" integer DEFAULT 0 NOT NULL,
	"total_scheduled_executions" integer DEFAULT 0 NOT NULL,
	"total_chat_executions" integer DEFAULT 0 NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric DEFAULT '0' NOT NULL,
	"current_usage_limit" numeric DEFAULT '10' NOT NULL,
	"usage_limit_set_by" text,
	"usage_limit_updated_at" timestamp DEFAULT now(),
	"current_period_cost" numeric DEFAULT '0' NOT NULL,
	"billing_period_start" timestamp DEFAULT now(),
	"billing_period_end" timestamp,
	"last_period_cost" numeric DEFAULT '0',
	"last_active" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"block_id" text,
	"path" text NOT NULL,
	"provider" text,
	"provider_config" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"folder_id" text,
	"name" text NOT NULL,
	"description" text,
	"state" json NOT NULL,
	"color" text DEFAULT '#3972F6' NOT NULL,
	"last_synced" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"is_deployed" boolean DEFAULT false NOT NULL,
	"deployed_state" json,
	"deployed_at" timestamp,
	"pinned_api_key" text,
	"collaborators" json DEFAULT '[]' NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp,
	"variables" json DEFAULT '{}',
	"is_published" boolean DEFAULT false NOT NULL,
	"marketplace_data" json
);
--> statement-breakpoint
CREATE TABLE "workflow_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"position_x" numeric NOT NULL,
	"position_y" numeric NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"horizontal_handles" boolean DEFAULT true NOT NULL,
	"is_wide" boolean DEFAULT false NOT NULL,
	"advanced_mode" boolean DEFAULT false NOT NULL,
	"trigger_mode" boolean DEFAULT false NOT NULL,
	"height" numeric DEFAULT '0' NOT NULL,
	"sub_blocks" jsonb DEFAULT '{}' NOT NULL,
	"outputs" jsonb DEFAULT '{}' NOT NULL,
	"data" jsonb DEFAULT '{}',
	"parent_id" text,
	"extent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"chat_id" uuid NOT NULL,
	"message_id" text,
	"workflow_state" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"source_block_id" text NOT NULL,
	"target_block_id" text NOT NULL,
	"source_handle" text,
	"target_handle" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_execution_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"execution_id" text NOT NULL,
	"state_snapshot_id" text NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"trigger" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"total_duration_ms" integer,
	"block_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric(10, 6),
	"total_input_cost" numeric(10, 6),
	"total_output_cost" numeric(10, 6),
	"total_tokens" integer,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"files" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_execution_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"state_hash" text NOT NULL,
	"state_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_folder" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"parent_id" text,
	"color" text DEFAULT '#6B7280',
	"is_expanded" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"block_id" text,
	"cron_expression" text,
	"next_run_at" timestamp,
	"last_ran_at" timestamp,
	"trigger_type" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_subflows" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"inviter_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"permissions" "permission_type" DEFAULT 'admin' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_chats" ADD CONSTRAINT "copilot_chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_chats" ADD CONSTRAINT "copilot_chats_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_feedback" ADD CONSTRAINT "copilot_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_feedback" ADD CONSTRAINT "copilot_feedback_chat_id_copilot_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."copilot_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_tools" ADD CONSTRAINT "custom_tools_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding" ADD CONSTRAINT "embedding_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding" ADD CONSTRAINT "embedding_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment" ADD CONSTRAINT "environment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_tag_definitions" ADD CONSTRAINT "knowledge_base_tag_definitions_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace" ADD CONSTRAINT "marketplace_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace" ADD CONSTRAINT "marketplace_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_tools" ADD CONSTRAINT "mcp_server_tools_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_tool_executions" ADD CONSTRAINT "mcp_tool_executions_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_tool_executions" ADD CONSTRAINT "mcp_tool_executions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_tool_executions" ADD CONSTRAINT "mcp_tool_executions_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_organization_id_organization_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_stars" ADD CONSTRAINT "template_stars_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_stars" ADD CONSTRAINT "template_stars_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rate_limits" ADD CONSTRAINT "user_rate_limits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_block_id_workflow_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."workflow_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_folder_id_workflow_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."workflow_folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_blocks" ADD CONSTRAINT "workflow_blocks_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_checkpoints" ADD CONSTRAINT "workflow_checkpoints_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_checkpoints" ADD CONSTRAINT "workflow_checkpoints_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_checkpoints" ADD CONSTRAINT "workflow_checkpoints_chat_id_copilot_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."copilot_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_source_block_id_workflow_blocks_id_fk" FOREIGN KEY ("source_block_id") REFERENCES "public"."workflow_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_target_block_id_workflow_blocks_id_fk" FOREIGN KEY ("target_block_id") REFERENCES "public"."workflow_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_execution_logs" ADD CONSTRAINT "workflow_execution_logs_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_execution_logs" ADD CONSTRAINT "workflow_execution_logs_state_snapshot_id_workflow_execution_snapshots_id_fk" FOREIGN KEY ("state_snapshot_id") REFERENCES "public"."workflow_execution_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_execution_snapshots" ADD CONSTRAINT "workflow_execution_snapshots_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_folder" ADD CONSTRAINT "workflow_folder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_folder" ADD CONSTRAINT "workflow_folder_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_schedule" ADD CONSTRAINT "workflow_schedule_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_schedule" ADD CONSTRAINT "workflow_schedule_block_id_workflow_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."workflow_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_subflows" ADD CONSTRAINT "workflow_subflows_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subdomain_idx" ON "chat" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "copilot_chats_user_id_idx" ON "copilot_chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "copilot_chats_workflow_id_idx" ON "copilot_chats" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "copilot_chats_user_workflow_idx" ON "copilot_chats" USING btree ("user_id","workflow_id");--> statement-breakpoint
CREATE INDEX "copilot_chats_created_at_idx" ON "copilot_chats" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "copilot_chats_updated_at_idx" ON "copilot_chats" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "copilot_feedback_user_id_idx" ON "copilot_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "copilot_feedback_chat_id_idx" ON "copilot_feedback" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "copilot_feedback_user_chat_idx" ON "copilot_feedback" USING btree ("user_id","chat_id");--> statement-breakpoint
CREATE INDEX "copilot_feedback_is_positive_idx" ON "copilot_feedback" USING btree ("is_positive");--> statement-breakpoint
CREATE INDEX "copilot_feedback_created_at_idx" ON "copilot_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "docs_emb_source_document_idx" ON "docs_embeddings" USING btree ("source_document");--> statement-breakpoint
CREATE INDEX "docs_emb_header_level_idx" ON "docs_embeddings" USING btree ("header_level");--> statement-breakpoint
CREATE INDEX "docs_emb_source_header_idx" ON "docs_embeddings" USING btree ("source_document","header_level");--> statement-breakpoint
CREATE INDEX "docs_emb_model_idx" ON "docs_embeddings" USING btree ("embedding_model");--> statement-breakpoint
CREATE INDEX "docs_emb_created_at_idx" ON "docs_embeddings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "docs_embedding_vector_hnsw_idx" ON "docs_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "docs_emb_metadata_gin_idx" ON "docs_embeddings" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "docs_emb_chunk_text_fts_idx" ON "docs_embeddings" USING gin ("chunk_text_tsv");--> statement-breakpoint
CREATE INDEX "doc_kb_id_idx" ON "document" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "doc_filename_idx" ON "document" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "doc_kb_uploaded_at_idx" ON "document" USING btree ("knowledge_base_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "doc_processing_status_idx" ON "document" USING btree ("knowledge_base_id","processing_status");--> statement-breakpoint
CREATE INDEX "doc_tag1_idx" ON "document" USING btree ("tag1");--> statement-breakpoint
CREATE INDEX "doc_tag2_idx" ON "document" USING btree ("tag2");--> statement-breakpoint
CREATE INDEX "doc_tag3_idx" ON "document" USING btree ("tag3");--> statement-breakpoint
CREATE INDEX "doc_tag4_idx" ON "document" USING btree ("tag4");--> statement-breakpoint
CREATE INDEX "doc_tag5_idx" ON "document" USING btree ("tag5");--> statement-breakpoint
CREATE INDEX "doc_tag6_idx" ON "document" USING btree ("tag6");--> statement-breakpoint
CREATE INDEX "doc_tag7_idx" ON "document" USING btree ("tag7");--> statement-breakpoint
CREATE INDEX "emb_kb_id_idx" ON "embedding" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "emb_doc_id_idx" ON "embedding" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "emb_doc_chunk_idx" ON "embedding" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "emb_kb_model_idx" ON "embedding" USING btree ("knowledge_base_id","embedding_model");--> statement-breakpoint
CREATE INDEX "emb_kb_enabled_idx" ON "embedding" USING btree ("knowledge_base_id","enabled");--> statement-breakpoint
CREATE INDEX "emb_doc_enabled_idx" ON "embedding" USING btree ("document_id","enabled");--> statement-breakpoint
CREATE INDEX "embedding_vector_hnsw_idx" ON "embedding" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "emb_tag1_idx" ON "embedding" USING btree ("tag1");--> statement-breakpoint
CREATE INDEX "emb_tag2_idx" ON "embedding" USING btree ("tag2");--> statement-breakpoint
CREATE INDEX "emb_tag3_idx" ON "embedding" USING btree ("tag3");--> statement-breakpoint
CREATE INDEX "emb_tag4_idx" ON "embedding" USING btree ("tag4");--> statement-breakpoint
CREATE INDEX "emb_tag5_idx" ON "embedding" USING btree ("tag5");--> statement-breakpoint
CREATE INDEX "emb_tag6_idx" ON "embedding" USING btree ("tag6");--> statement-breakpoint
CREATE INDEX "emb_tag7_idx" ON "embedding" USING btree ("tag7");--> statement-breakpoint
CREATE INDEX "emb_content_fts_idx" ON "embedding" USING gin ("content_tsv");--> statement-breakpoint
CREATE INDEX "kb_user_id_idx" ON "knowledge_base" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kb_workspace_id_idx" ON "knowledge_base" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "kb_user_workspace_idx" ON "knowledge_base" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "kb_deleted_at_idx" ON "knowledge_base" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_tag_definitions_kb_slot_idx" ON "knowledge_base_tag_definitions" USING btree ("knowledge_base_id","tag_slot");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_tag_definitions_kb_display_name_idx" ON "knowledge_base_tag_definitions" USING btree ("knowledge_base_id","display_name");--> statement-breakpoint
CREATE INDEX "kb_tag_definitions_kb_id_idx" ON "knowledge_base_tag_definitions" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "mcp_server_tools_server_id_idx" ON "mcp_server_tools" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "mcp_server_tools_tool_id_idx" ON "mcp_server_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "mcp_server_tools_name_idx" ON "mcp_server_tools" USING btree ("name");--> statement-breakpoint
CREATE INDEX "mcp_server_tools_is_enabled_idx" ON "mcp_server_tools" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "mcp_server_tools_last_discovered_idx" ON "mcp_server_tools" USING btree ("last_discovered");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_server_tools_server_tool_id_unique" ON "mcp_server_tools" USING btree ("server_id","tool_id");--> statement-breakpoint
CREATE INDEX "mcp_servers_user_id_idx" ON "mcp_servers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_servers_workspace_id_idx" ON "mcp_servers" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "mcp_servers_user_workspace_idx" ON "mcp_servers" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "mcp_servers_name_idx" ON "mcp_servers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "mcp_servers_type_idx" ON "mcp_servers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "mcp_servers_status_idx" ON "mcp_servers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mcp_servers_is_active_idx" ON "mcp_servers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "mcp_servers_created_at_idx" ON "mcp_servers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "mcp_servers_updated_at_idx" ON "mcp_servers" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_servers_user_workspace_name_unique" ON "mcp_servers" USING btree ("user_id","workspace_id","name");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_server_id_idx" ON "mcp_tool_executions" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_user_id_idx" ON "mcp_tool_executions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_workflow_id_idx" ON "mcp_tool_executions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_tool_id_idx" ON "mcp_tool_executions" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_success_idx" ON "mcp_tool_executions" USING btree ("success");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_executed_at_idx" ON "mcp_tool_executions" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_latency_idx" ON "mcp_tool_executions" USING btree ("latency");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_server_success_idx" ON "mcp_tool_executions" USING btree ("server_id","success");--> statement-breakpoint
CREATE INDEX "mcp_tool_executions_user_server_idx" ON "mcp_tool_executions" USING btree ("user_id","server_id");--> statement-breakpoint
CREATE INDEX "memory_key_idx" ON "memory" USING btree ("key");--> statement-breakpoint
CREATE INDEX "memory_workflow_idx" ON "memory" USING btree ("workflow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_workflow_key_idx" ON "memory" USING btree ("workflow_id","key");--> statement-breakpoint
CREATE INDEX "permissions_user_id_idx" ON "permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "permissions_entity_idx" ON "permissions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "permissions_user_entity_type_idx" ON "permissions" USING btree ("user_id","entity_type");--> statement-breakpoint
CREATE INDEX "permissions_user_entity_permission_idx" ON "permissions" USING btree ("user_id","entity_type","permission_type");--> statement-breakpoint
CREATE INDEX "permissions_user_entity_idx" ON "permissions" USING btree ("user_id","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_unique_constraint" ON "permissions" USING btree ("user_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "subscription_reference_status_idx" ON "subscription" USING btree ("reference_id","status");--> statement-breakpoint
CREATE INDEX "template_stars_user_id_idx" ON "template_stars" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "template_stars_template_id_idx" ON "template_stars" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_stars_user_template_idx" ON "template_stars" USING btree ("user_id","template_id");--> statement-breakpoint
CREATE INDEX "template_stars_template_user_idx" ON "template_stars" USING btree ("template_id","user_id");--> statement-breakpoint
CREATE INDEX "template_stars_starred_at_idx" ON "template_stars" USING btree ("starred_at");--> statement-breakpoint
CREATE INDEX "template_stars_template_starred_at_idx" ON "template_stars" USING btree ("template_id","starred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "template_stars_user_template_unique" ON "template_stars" USING btree ("user_id","template_id");--> statement-breakpoint
CREATE INDEX "templates_workflow_id_idx" ON "templates" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "templates_user_id_idx" ON "templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "templates_category_idx" ON "templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "templates_views_idx" ON "templates" USING btree ("views");--> statement-breakpoint
CREATE INDEX "templates_stars_idx" ON "templates" USING btree ("stars");--> statement-breakpoint
CREATE INDEX "templates_category_views_idx" ON "templates" USING btree ("category","views");--> statement-breakpoint
CREATE INDEX "templates_category_stars_idx" ON "templates" USING btree ("category","stars");--> statement-breakpoint
CREATE INDEX "templates_user_category_idx" ON "templates" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "templates_created_at_idx" ON "templates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "templates_updated_at_idx" ON "templates" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "path_idx" ON "webhook" USING btree ("path");--> statement-breakpoint
CREATE INDEX "workflow_user_id_idx" ON "workflow" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workflow_workspace_id_idx" ON "workflow" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workflow_user_workspace_idx" ON "workflow" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "workflow_blocks_workflow_id_idx" ON "workflow_blocks" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_blocks_parent_id_idx" ON "workflow_blocks" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "workflow_blocks_workflow_parent_idx" ON "workflow_blocks" USING btree ("workflow_id","parent_id");--> statement-breakpoint
CREATE INDEX "workflow_blocks_workflow_type_idx" ON "workflow_blocks" USING btree ("workflow_id","type");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_user_id_idx" ON "workflow_checkpoints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_workflow_id_idx" ON "workflow_checkpoints" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_chat_id_idx" ON "workflow_checkpoints" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_message_id_idx" ON "workflow_checkpoints" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_user_workflow_idx" ON "workflow_checkpoints" USING btree ("user_id","workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_workflow_chat_idx" ON "workflow_checkpoints" USING btree ("workflow_id","chat_id");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_created_at_idx" ON "workflow_checkpoints" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "workflow_checkpoints_chat_created_at_idx" ON "workflow_checkpoints" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "workflow_edges_workflow_id_idx" ON "workflow_edges" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_edges_source_block_idx" ON "workflow_edges" USING btree ("source_block_id");--> statement-breakpoint
CREATE INDEX "workflow_edges_target_block_idx" ON "workflow_edges" USING btree ("target_block_id");--> statement-breakpoint
CREATE INDEX "workflow_edges_workflow_source_idx" ON "workflow_edges" USING btree ("workflow_id","source_block_id");--> statement-breakpoint
CREATE INDEX "workflow_edges_workflow_target_idx" ON "workflow_edges" USING btree ("workflow_id","target_block_id");--> statement-breakpoint
CREATE INDEX "workflow_execution_logs_workflow_id_idx" ON "workflow_execution_logs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_execution_logs_execution_id_idx" ON "workflow_execution_logs" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "workflow_execution_logs_trigger_idx" ON "workflow_execution_logs" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "workflow_execution_logs_level_idx" ON "workflow_execution_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "workflow_execution_logs_started_at_idx" ON "workflow_execution_logs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_execution_logs_execution_id_unique" ON "workflow_execution_logs" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "workflow_execution_logs_workflow_started_at_idx" ON "workflow_execution_logs" USING btree ("workflow_id","started_at");--> statement-breakpoint
CREATE INDEX "workflow_snapshots_workflow_id_idx" ON "workflow_execution_snapshots" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_snapshots_hash_idx" ON "workflow_execution_snapshots" USING btree ("state_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_snapshots_workflow_hash_idx" ON "workflow_execution_snapshots" USING btree ("workflow_id","state_hash");--> statement-breakpoint
CREATE INDEX "workflow_snapshots_created_at_idx" ON "workflow_execution_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "workflow_folder_user_idx" ON "workflow_folder" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workflow_folder_workspace_parent_idx" ON "workflow_folder" USING btree ("workspace_id","parent_id");--> statement-breakpoint
CREATE INDEX "workflow_folder_parent_sort_idx" ON "workflow_folder" USING btree ("parent_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_schedule_workflow_block_unique" ON "workflow_schedule" USING btree ("workflow_id","block_id");--> statement-breakpoint
CREATE INDEX "workflow_subflows_workflow_id_idx" ON "workflow_subflows" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_subflows_workflow_type_idx" ON "workflow_subflows" USING btree ("workflow_id","type");