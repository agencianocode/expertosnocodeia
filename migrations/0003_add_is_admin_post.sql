CREATE TABLE "community_post_comment_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"emoji" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_post_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_post_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"emoji" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"user_id" varchar,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"image_url" varchar,
	"video_url" varchar,
	"content_blocks" jsonb DEFAULT '[]'::jsonb,
	"display_order" integer DEFAULT 0,
	"is_admin_post" boolean DEFAULT false,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"email_notifications" boolean DEFAULT true,
	"in_app_notifications" boolean DEFAULT true,
	"mobile_notifications" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "community_channels" ADD COLUMN "is_read_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "community_post_comment_reactions" ADD CONSTRAINT "community_post_comment_reactions_comment_id_community_post_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."community_post_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_comment_reactions" ADD CONSTRAINT "community_post_comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_channel_id_community_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."community_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comment_reactions_comment" ON "community_post_comment_reactions" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_comment_reactions_user" ON "community_post_comment_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_comments_post" ON "community_post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_comments_user" ON "community_post_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_reactions_post" ON "community_post_reactions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_reactions_user" ON "community_post_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_posts_channel" ON "community_posts" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_posts_user" ON "community_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_posts_created" ON "community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_posts_channel_order" ON "community_posts" USING btree ("channel_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_notification_prefs_user" ON "user_notification_preferences" USING btree ("user_id");