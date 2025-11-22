ALTER TABLE "community_posts" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX "idx_posts_channel_order" ON "community_posts" USING btree ("channel_id", "display_order");
