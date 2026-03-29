CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"allowed_signup_domains" text,
	"disable_registration" boolean DEFAULT false,
	"require_email_verification" boolean DEFAULT true,
	"default_user_role" text DEFAULT 'member',
	"max_workspaces_per_user" integer DEFAULT 10,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;