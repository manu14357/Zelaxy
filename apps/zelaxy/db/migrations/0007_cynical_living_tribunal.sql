ALTER TABLE "marketplace" DROP CONSTRAINT "marketplace_author_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "marketplace" ADD CONSTRAINT "marketplace_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;