-- Local billing ledger. Razorpay's SDK exposes no "list payments/invoices for
-- a given customer" filter, so this table is the single source of truth behind
-- the in-app invoice history and the receipt emails. Rows are written
-- idempotently from every payment-success path; the primary key is derived
-- deterministically from the Razorpay id so a verify+webhook double-fire or a
-- webhook retry upserts the same row rather than duplicating it.
CREATE TABLE IF NOT EXISTS "billing_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_id" text NOT NULL,
	"user_id" text,
	"organization_id" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"amount_due" numeric DEFAULT '0' NOT NULL,
	"amount_paid" numeric DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"description" text,
	"plan" text,
	"seats" integer,
	"razorpay_payment_id" text,
	"razorpay_order_id" text,
	"razorpay_subscription_id" text,
	"razorpay_payment_link_id" text,
	"hosted_invoice_url" text,
	"billing_period_start" timestamp,
	"billing_period_end" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_invoice_reference_created_idx" ON "billing_invoice" USING btree ("reference_id","created_at");
