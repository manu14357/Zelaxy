-- Shared credential vault: workspace-scoped secrets that can be shared with members.
-- `credential` holds the encrypted secret material, `credential_member` holds per-user
-- sharing grants, and `pending_credential_draft` dedupes concurrent create attempts.
DO $$ BEGIN
	CREATE TYPE "public"."credential_type" AS ENUM('oauth', 'env_workspace', 'env_personal', 'service_account');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "credential_type" NOT NULL,
	"value" text,
	"config" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential_member" (
	"id" text PRIMARY KEY NOT NULL,
	"credential_id" text NOT NULL,
	"user_id" text NOT NULL,
	"permission" "permission_type" DEFAULT 'read' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pending_credential_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "credential_type" NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "credential" ADD CONSTRAINT "credential_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "credential" ADD CONSTRAINT "credential_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "credential_member" ADD CONSTRAINT "credential_member_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credential"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "credential_member" ADD CONSTRAINT "credential_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "credential_member" ADD CONSTRAINT "credential_member_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pending_credential_draft" ADD CONSTRAINT "pending_credential_draft_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pending_credential_draft" ADD CONSTRAINT "pending_credential_draft_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credential_workspace_id_idx" ON "credential" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credential_created_by_idx" ON "credential" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credential_type_idx" ON "credential" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credential_workspace_name_unique" ON "credential" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credential_member_credential_id_idx" ON "credential_member" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credential_member_user_id_idx" ON "credential_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credential_member_credential_user_unique" ON "credential_member" USING btree ("credential_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_credential_draft_workspace_id_idx" ON "pending_credential_draft" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pending_credential_draft_workspace_name_unique" ON "pending_credential_draft" USING btree ("workspace_id","name");
