ALTER TABLE "user_stats" ADD COLUMN "credit_balance" numeric DEFAULT '0' NOT NULL;
CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"related_invoice_id" text,
	"balance_after" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "credit_transactions_user_id_created_at_idx" ON "credit_transactions" USING btree ("user_id","created_at");
