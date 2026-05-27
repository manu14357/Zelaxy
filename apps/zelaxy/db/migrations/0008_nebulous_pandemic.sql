CREATE TABLE "table_row_executions" (
	"table_id" text NOT NULL,
	"row_id" text NOT NULL,
	"group_id" text NOT NULL,
	"status" text NOT NULL,
	"execution_id" text,
	"job_id" text,
	"workflow_id" text NOT NULL,
	"error" text,
	"running_block_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"block_errors" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cancelled_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "table_row_executions_row_id_group_id_pk" PRIMARY KEY("row_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "user_table_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schema" jsonb NOT NULL,
	"metadata" jsonb,
	"max_rows" integer DEFAULT 10000 NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_table_rows" (
	"id" text PRIMARY KEY NOT NULL,
	"table_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "table_row_executions" ADD CONSTRAINT "table_row_executions_table_id_user_table_definitions_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."user_table_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_row_executions" ADD CONSTRAINT "table_row_executions_row_id_user_table_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."user_table_rows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_table_definitions" ADD CONSTRAINT "user_table_definitions_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_table_definitions" ADD CONSTRAINT "user_table_definitions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_table_rows" ADD CONSTRAINT "user_table_rows_table_id_user_table_definitions_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."user_table_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_table_rows" ADD CONSTRAINT "user_table_rows_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_table_rows" ADD CONSTRAINT "user_table_rows_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "table_row_executions_table_status_idx" ON "table_row_executions" USING btree ("table_id","status") WHERE "table_row_executions"."status" IN ('queued', 'running', 'pending');--> statement-breakpoint
CREATE INDEX "table_row_executions_execution_id_idx" ON "table_row_executions" USING btree ("execution_id") WHERE "table_row_executions"."execution_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "table_row_executions_table_group_idx" ON "table_row_executions" USING btree ("table_id","group_id");--> statement-breakpoint
CREATE INDEX "user_table_def_workspace_id_idx" ON "user_table_definitions" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_table_def_workspace_name_unique" ON "user_table_definitions" USING btree ("workspace_id","name") WHERE "user_table_definitions"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX "user_table_def_archived_at_idx" ON "user_table_definitions" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "user_table_def_workspace_archived_partial_idx" ON "user_table_definitions" USING btree ("workspace_id","archived_at") WHERE "user_table_definitions"."archived_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "user_table_rows_table_id_idx" ON "user_table_rows" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "user_table_rows_data_gin_idx" ON "user_table_rows" USING gin ("data");--> statement-breakpoint
CREATE INDEX "user_table_rows_workspace_table_idx" ON "user_table_rows" USING btree ("workspace_id","table_id");--> statement-breakpoint
CREATE INDEX "user_table_rows_table_position_idx" ON "user_table_rows" USING btree ("table_id","position");