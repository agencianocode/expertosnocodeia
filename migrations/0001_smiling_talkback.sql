CREATE TABLE "comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" varchar,
	"root_comment_id" varchar,
	"depth" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"is_admin_reviewed" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_lesson_root_created" ON "comments" USING btree ("lesson_id","root_comment_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_comments_parent" ON "comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "idx_comments_admin_reviewed" ON "comments" USING btree ("is_admin_reviewed","created_at");