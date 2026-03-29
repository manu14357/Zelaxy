-- Migration: Organization & Enterprise Features
-- Adds: organizationId to workspace, audit_log table, org_environment table, organizationId to api_key

-- 1. Add organizationId to workspace table
ALTER TABLE "workspace" ADD COLUMN "organization_id" text REFERENCES "organization"("id") ON DELETE SET NULL;
CREATE INDEX "workspace_owner_id_idx" ON "workspace" ("owner_id");
CREATE INDEX "workspace_organization_id_idx" ON "workspace" ("organization_id");

-- 2. Add organizationId to api_key table
ALTER TABLE "api_key" ADD COLUMN "organization_id" text REFERENCES "organization"("id") ON DELETE SET NULL;
CREATE INDEX "api_key_user_id_idx" ON "api_key" ("user_id");
CREATE INDEX "api_key_organization_id_idx" ON "api_key" ("organization_id");

-- 3. Create audit_log table
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "organization_id" text REFERENCES "organization"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "metadata" json,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "audit_log_user_id_idx" ON "audit_log" ("user_id");
CREATE INDEX "audit_log_organization_id_idx" ON "audit_log" ("organization_id");
CREATE INDEX "audit_log_action_idx" ON "audit_log" ("action");
CREATE INDEX "audit_log_entity_idx" ON "audit_log" ("entity_type", "entity_id");
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" ("created_at");
CREATE INDEX "audit_log_org_created_at_idx" ON "audit_log" ("organization_id", "created_at");

-- 4. Create org_environment table
CREATE TABLE IF NOT EXISTS "org_environment" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "variables" json NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" text REFERENCES "user"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "org_environment_org_id_idx" ON "org_environment" ("organization_id");
