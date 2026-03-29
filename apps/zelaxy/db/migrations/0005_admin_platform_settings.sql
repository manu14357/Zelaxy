CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
  "allowed_signup_domains" text,
  "disable_registration" boolean DEFAULT false,
  "require_email_verification" boolean DEFAULT true,
  "default_user_role" text DEFAULT 'member',
  "max_workspaces_per_user" integer DEFAULT 10,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" text REFERENCES "user"("id") ON DELETE SET NULL
);
