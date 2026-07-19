-- Public file shares: token-addressable, workspace-scoped grants that expose a single
-- workspace_file to unauthenticated visitors through one of four gate modes
-- (public | password | email | sso). Purely additive — no change to existing files code.
DO $$ BEGIN
	CREATE TYPE "public"."public_share_mode" AS ENUM('public', 'password', 'email', 'sso');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_share" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"workspace_id" text NOT NULL,
	"file_id" text NOT NULL,
	"mode" "public_share_mode" DEFAULT 'public' NOT NULL,
	"password_hash" text,
	"allowed_emails" json,
	"expires_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_share_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "public_share" ADD CONSTRAINT "public_share_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "public_share" ADD CONSTRAINT "public_share_file_id_workspace_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."workspace_file"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "public_share" ADD CONSTRAINT "public_share_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_share_ws_idx" ON "public_share" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_share_file_idx" ON "public_share" USING btree ("file_id");
