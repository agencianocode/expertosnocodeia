import { pgTable, foreignKey, varchar, text, integer, boolean, timestamp, jsonb, index, unique, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const courses = pgTable("courses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar().notNull(),
	description: text(),
	type: varchar().notNull(),
	categoryId: varchar("category_id"),
	difficulty: varchar(),
	estimatedHours: integer("estimated_hours"),
	hasCertificate: boolean("has_certificate").default(true),
	isPublished: boolean("is_published").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	coverImageUrl: varchar("cover_image_url"),
	metadata: jsonb().default({}),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "courses_category_id_categories_id_fk"
		}),
]);

export const categories = pgTable("categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	icon: varchar(),
	color: varchar(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const certificates = pgTable("certificates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	courseId: varchar("course_id"),
	issuedAt: timestamp("issued_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "certificates_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "certificates_course_id_courses_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	profession: varchar(),
	experienceLevel: varchar("experience_level"),
	interests: jsonb().default([]),
	goals: text(),
	companySize: varchar("company_size"),
	industry: varchar(),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	preferredSkillType: varchar("preferred_skill_type"),
	preferredContentTypes: jsonb("preferred_content_types").default([]),
	googleId: varchar("google_id", { length: 255 }),
	passwordResetToken: varchar("password_reset_token", { length: 255 }),
	passwordResetExpires: timestamp("password_reset_expires", { mode: 'string' }),
	emailVerificationToken: varchar("email_verification_token", { length: 255 }),
	isEmailVerified: boolean("is_email_verified").default(false),
	password: varchar({ length: 255 }),
	provider: varchar({ length: 50 }).default('email'),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_google_id_key").on(table.googleId),
]);

export const userProgress = pgTable("user_progress", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	courseId: varchar("course_id"),
	completedLessons: integer("completed_lessons").default(0),
	totalLessons: integer("total_lessons").default(0),
	isCompleted: boolean("is_completed").default(false),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_progress_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "user_progress_course_id_courses_id_fk"
		}),
]);

export const courseTags = pgTable("course_tags", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id"),
	tagId: varchar("tag_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "course_tags_course_id_courses_id_fk"
		}),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "course_tags_tag_id_tags_id_fk"
		}),
]);

export const tags = pgTable("tags", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	slug: varchar().notNull(),
	color: varchar().default('#6B7280'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tags_name_unique").on(table.name),
	unique("tags_slug_unique").on(table.slug),
]);

export const courseTemplates = pgTable("course_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	structure: jsonb().notNull(),
	categoryId: varchar("category_id"),
	createdBy: varchar("created_by"),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "course_templates_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "course_templates_created_by_users_id_fk"
		}),
]);

export const mediaFiles = pgTable("media_files", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	filename: varchar().notNull(),
	originalName: varchar("original_name").notNull(),
	mimeType: varchar("mime_type").notNull(),
	size: integer().notNull(),
	url: varchar().notNull(),
	type: varchar().notNull(),
	uploadedBy: varchar("uploaded_by"),
	altText: varchar("alt_text"),
	description: text(),
	tags: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "media_files_uploaded_by_users_id_fk"
		}),
]);

export const adminUsers = pgTable("admin_users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	role: varchar().default('admin').notNull(),
	permissions: jsonb().default([]),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "admin_users_user_id_users_id_fk"
		}),
]);

export const contentBlocks = pgTable("content_blocks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	type: varchar().notNull(),
	title: varchar(),
	content: jsonb().notNull(),
	metadata: jsonb().default({}),
	order: integer().default(0),
	lessonId: varchar("lesson_id"),
	isPublished: boolean("is_published").default(true),
	createdBy: varchar("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "content_blocks_lesson_id_lessons_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "content_blocks_created_by_users_id_fk"
		}),
]);

export const userSavedCourses = pgTable("user_saved_courses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	courseId: varchar("course_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	roomSlug: varchar("room_slug"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_saved_courses_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "user_saved_courses_course_id_courses_id_fk"
		}),
]);

export const userLessonProgress = pgTable("user_lesson_progress", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	lessonId: varchar("lesson_id"),
	courseId: varchar("course_id"),
	isCompleted: boolean("is_completed").default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_lesson_progress_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "user_lesson_progress_lesson_id_lessons_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "user_lesson_progress_course_id_courses_id_fk"
		}),
]);

export const rooms = pgTable("rooms", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar().notNull(),
	slug: varchar().notNull(),
	description: text(),
	shortDescription: varchar("short_description", { length: 500 }),
	coverImageUrl: varchar("cover_image_url"),
	heroImageUrl: varchar("hero_image_url"),
	order: integer().default(0).notNull(),
	isPublished: boolean("is_published").default(true),
	price: integer(),
	currency: varchar({ length: 3 }).default('usd'),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	categoryId: varchar("category_id"),
}, (table) => [
	index("idx_rooms_published_order").using("btree", table.isPublished.asc().nullsLast().op("int4_ops"), table.order.asc().nullsLast().op("int4_ops")),
	index("idx_rooms_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "rooms_category_id_fkey"
		}),
	unique("rooms_slug_key").on(table.slug),
]);

export const userOnboardingResponses = pgTable("user_onboarding_responses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	experienceLevel: varchar("experience_level"),
	workAreas: jsonb("work_areas").default([]),
	learningMethods: jsonb("learning_methods").default([]),
	goals: jsonb().default([]),
	aiTools: jsonb("ai_tools").default([]),
	mainGoal: varchar("main_goal"),
	completedAt: timestamp("completed_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_onboarding_responses_user_id_fkey"
		}),
]);

export const lessonResources = pgTable("lesson_resources", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id"),
	title: varchar().notNull(),
	description: text(),
	fileUrl: varchar("file_url").notNull(),
	fileName: varchar("file_name").notNull(),
	fileType: varchar("file_type").notNull(),
	fileSize: integer("file_size"),
	downloadCount: integer("download_count").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	courseId: varchar("course_id"),
});

export const courseCategories = pgTable("course_categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id"),
	categoryId: varchar("category_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "course_categories_course_id_courses_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "course_categories_category_id_categories_id_fk"
		}),
]);

export const userSubscriptions = pgTable("user_subscriptions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	planId: varchar("plan_id").notNull(),
	status: varchar().default('active').notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).defaultNow(),
	endDate: timestamp("end_date", { mode: 'string' }),
	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_subscriptions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlans.id],
			name: "user_subscriptions_plan_id_subscription_plans_id_fk"
		}),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	displayName: varchar("display_name").notNull(),
	price: integer().default(0).notNull(),
	currency: varchar().default('USD').notNull(),
	billingInterval: varchar("billing_interval").notNull(),
	trialDays: integer("trial_days").default(0),
	features: jsonb().default([]),
	limits: jsonb().default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("subscription_plans_name_unique").on(table.name),
]);

export const userUsage = pgTable("user_usage", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	resourceType: varchar("resource_type").notNull(),
	resourceId: varchar("resource_id"),
	usageDate: timestamp("usage_date", { mode: 'string' }).defaultNow(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_usage_user_id_users_id_fk"
		}),
]);

export const lessons = pgTable("lessons", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id"),
	title: varchar().notNull(),
	description: text(),
	content: text(),
	order: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	type: varchar().default('text').notNull(),
	duration: integer(),
	isPublished: boolean("is_published").default(false),
	isFree: boolean("is_free").default(false),
	videoUrl: varchar("video_url"),
	attachments: text(),
	objectives: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	imageUrl: varchar("image_url"),
	parentLessonId: varchar("parent_lesson_id"),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "lessons_course_id_courses_id_fk"
		}),
]);

export const phases = pgTable("phases", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	roomId: varchar("room_id").notNull(),
	title: varchar().notNull(),
	description: text(),
	order: integer().notNull(),
	releaseDate: timestamp("release_date", { withTimezone: true, mode: 'string' }).notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_phases_release_date").using("btree", table.releaseDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_phases_room_order").using("btree", table.roomId.asc().nullsLast().op("int4_ops"), table.order.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "phases_room_id_fkey"
		}).onDelete("cascade"),
]);

export const promoBanners = pgTable("promo_banners", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	roomId: varchar("room_id").notNull(),
	title: varchar().notNull(),
	subtitle: varchar(),
	description: text(),
	backgroundImageUrl: varchar("background_image_url"),
	backgroundColor: varchar("background_color").default('from-orange-600 to-red-600'),
	ctaText: varchar("cta_text"),
	ctaLink: varchar("cta_link"),
	displayAfterPhaseOrder: integer("display_after_phase_order").notNull(),
	order: integer().default(0).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_promo_banners_room").using("btree", table.roomId.asc().nullsLast().op("text_ops")),
	index("idx_promo_banners_room_order").using("btree", table.roomId.asc().nullsLast().op("int4_ops"), table.order.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "promo_banners_room_id_fkey"
		}).onDelete("cascade"),
]);

export const phaseContent = pgTable("phase_content", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	phaseId: varchar("phase_id").notNull(),
	contentType: varchar("content_type").notNull(),
	contentId: varchar("content_id").notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_phase_content_content").using("btree", table.contentId.asc().nullsLast().op("text_ops"), table.contentType.asc().nullsLast().op("text_ops")),
	index("idx_phase_content_phase").using("btree", table.phaseId.asc().nullsLast().op("text_ops")),
	index("idx_phase_content_unique").using("btree", table.phaseId.asc().nullsLast().op("text_ops"), table.contentType.asc().nullsLast().op("text_ops"), table.contentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.phaseId],
			foreignColumns: [phases.id],
			name: "phase_content_phase_id_fkey"
		}).onDelete("cascade"),
]);

export const purchases = pgTable("purchases", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	productType: varchar("product_type").notNull(),
	productId: varchar("product_id"),
	amount: integer().notNull(),
	currency: varchar({ length: 3 }).default('usd'),
	stripePaymentIntentId: varchar("stripe_payment_intent_id"),
	stripeCustomerId: varchar("stripe_customer_id"),
	status: varchar().default('completed'),
	metadata: jsonb().default({}),
	purchasedAt: timestamp("purchased_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_purchases_stripe_intent").using("btree", table.stripePaymentIntentId.asc().nullsLast().op("text_ops")),
	index("idx_purchases_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_purchases_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "purchases_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userAccess = pgTable("user_access", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	accessType: varchar("access_type").notNull(),
	accessId: varchar("access_id"),
	purchaseId: varchar("purchase_id"),
	isActive: boolean("is_active").default(true),
	grantedAt: timestamp("granted_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_user_access_active").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.accessType.asc().nullsLast().op("bool_ops"), table.accessId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_user_access_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_user_access_user_type").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.accessType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_access_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseId],
			foreignColumns: [purchases.id],
			name: "user_access_purchase_id_fkey"
		}),
]);

export const comments = pgTable("comments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id").notNull(),
	userId: varchar("user_id").notNull(),
	content: text().notNull(),
	parentCommentId: varchar("parent_comment_id"),
	rootCommentId: varchar("root_comment_id"),
	depth: integer().default(0),
	replyCount: integer("reply_count").default(0),
	isAdminReviewed: boolean("is_admin_reviewed").default(false),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	likeCount: integer("like_count").default(0),
}, (table) => [
	index("idx_comments_admin_reviewed").using("btree", table.isAdminReviewed.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("bool_ops")),
	index("idx_comments_lesson_root_created").using("btree", table.lessonId.asc().nullsLast().op("text_ops"), table.rootCommentId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("idx_comments_parent").using("btree", table.parentCommentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "comments_lesson_id_lessons_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_users_id_fk"
		}),
]);

export const userRecentActivity = pgTable("user_recent_activity", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	courseId: varchar("course_id"),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	lastLessonId: varchar("last_lesson_id"),
	contentType: varchar("content_type").default('course'),
	roomSlug: varchar("room_slug"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_recent_activity_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "user_recent_activity_course_id_courses_id_fk"
		}),
	foreignKey({
			columns: [table.lastLessonId],
			foreignColumns: [lessons.id],
			name: "user_recent_activity_last_lesson_id_fkey"
		}),
]);

export const commentLikes = pgTable("comment_likes", {
	commentId: varchar("comment_id").notNull(),
	userId: varchar("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_comment_likes_comment").using("btree", table.commentId.asc().nullsLast().op("text_ops")),
	index("idx_comment_likes_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "comment_likes_comment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comment_likes_user_id_fkey"
		}),
	primaryKey({ columns: [table.commentId, table.userId], name: "comment_likes_pkey"}),
]);
