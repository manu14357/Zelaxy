ALTER TABLE "user_stats" ADD COLUMN "billing_blocked" boolean DEFAULT false NOT NULL;
ALTER TABLE "user_stats" ADD COLUMN "billing_blocked_reason" text;
ALTER TABLE "user_stats" ADD COLUMN "billed_overage_this_period" numeric DEFAULT '0' NOT NULL;
ALTER TABLE "subscription" ADD COLUMN "canceled_at" timestamp;
ALTER TABLE "subscription" ADD COLUMN "ended_at" timestamp;
ALTER TABLE "subscription" ADD COLUMN "billing_interval" text;
ALTER TABLE "organization" ADD COLUMN "departed_member_usage" numeric DEFAULT '0' NOT NULL;
CREATE TABLE "stripe_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"result" json,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
CREATE INDEX "stripe_webhook_events_status_created_at_idx" ON "stripe_webhook_events" USING btree ("status","created_at");
