-- Paid plans are bought a month at a time as one-time Razorpay Orders rather
-- than through Razorpay Subscriptions: this account has neither
-- Plans/Subscriptions API access (the endpoints 401) nor Recurring Payments,
-- which is RBI-regulated and gated on business verification. Orders need
-- neither approval. See lib/billing/razorpay/orders.ts.
--
-- Deliberately a separate column from razorpay_subscription_id: an order id
-- and a subscription id address different Razorpay APIs, so overloading one
-- column would break every fetch that reads it back.
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "razorpay_order_id" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_razorpay_order_idx" ON "subscription" USING btree ("razorpay_order_id");
