-- Replace Stripe with Razorpay as the payment provider: rename the
-- Stripe-specific columns/table to their Razorpay equivalents.
ALTER TABLE "user" RENAME COLUMN "stripe_customer_id" TO "razorpay_customer_id";
ALTER TABLE "subscription" RENAME COLUMN "stripe_customer_id" TO "razorpay_customer_id";
ALTER TABLE "subscription" RENAME COLUMN "stripe_subscription_id" TO "razorpay_subscription_id";
ALTER TABLE "stripe_webhook_events" RENAME TO "payment_webhook_events";
ALTER INDEX "stripe_webhook_events_status_created_at_idx" RENAME TO "payment_webhook_events_status_created_at_idx";
