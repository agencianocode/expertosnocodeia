import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Updated for full authentication system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Hashed password for email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Authentication providers
  googleId: varchar("google_id").unique(), // Google OAuth ID
  provider: varchar("provider").default("email"), // "email", "google"
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Onboarding data
  profession: varchar("profession"),
  experienceLevel: varchar("experience_level"),
  interests: jsonb("interests").$type<string[]>().default([]),
  goals: text("goals"),
  companySize: varchar("company_size"),
  industry: varchar("industry"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  // User focus preferences for content recommendations
  preferredSkillType: varchar("preferred_skill_type"), // "consultoria", "desarrollo", "marketing", etc.
  preferredContentTypes: jsonb("preferred_content_types").$type<string[]>().default([]), // ["cursos", "guias", "workshops"]
  lastLoginAt: timestamp("last_login_at"),
  // Points and rewards system
  points: integer("points").default(0),
  level: integer("level").default(1),
  // Profile description
  shortDescription: text("short_description"),
  bio: text("bio"),
  // User role: 'user' (default), 'paid_user' (has active subscription), 'instructor', 'moderator'
  // Admin roles are managed in adminUsers table: 'admin', 'editor', 'super_admin'
  role: varchar("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"), // FontAwesome icon class
  color: varchar("color"), // Tailwind color class
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug"), // URL-friendly slug for SEO (e.g., "fundamentos-agentes-ia")
  description: text("description"),
  type: varchar("type").notNull(), // 'course', 'guide', 'workshop'
  categoryId: varchar("category_id").references(() => categories.id),
  difficulty: varchar("difficulty"), // 'beginner', 'intermediate', 'advanced'
  estimatedHours: real("estimated_hours"),
  hasCertificate: boolean("has_certificate").default(true),
  isPublished: boolean("is_published").default(true),
  coverImageUrl: varchar("cover_image_url"), // Custom course image
  metadata: jsonb("metadata").default({}), // Workshop-specific data like instructor, videoUrl, etc
  order: integer("order").default(0), // Para ordenar cursos en la página de admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_courses_slug").on(table.slug),
  index("idx_courses_order").on(table.order),
]);

// Course categories mapping (many-to-many)
export const courseCategories = pgTable("course_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id),
  categoryId: varchar("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User saved/bookmarked courses
export const userSavedCourses = pgTable("user_saved_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id),
  roomSlug: varchar("room_slug"), // Optional: tracks if saved from a room context
  createdAt: timestamp("created_at").defaultNow(),
});

// User recently viewed content tracking
export const userRecentActivity = pgTable("user_recent_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  contentType: varchar("content_type").notNull().default("course"), // 'course', 'guide', 'workshop'
  courseId: varchar("course_id").references(() => courses.id),
  lastLessonId: varchar("last_lesson_id").references(() => lessons.id), // Track specific lesson within course
  roomSlug: varchar("room_slug"), // Optional: tracks if accessed from a room context
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course modules/lessons
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id),
  parentLessonId: varchar("parent_lesson_id"), // For nested structure: modules (null) contain sub-lessons (with parent ID)
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"),
  type: varchar("type").notNull().default("text"), // text, video, quiz
  order: integer("order").notNull(),
  duration: integer("duration"), // duration in minutes
  isPublished: boolean("is_published").default(false),
  isFree: boolean("is_free").default(false),
  videoUrl: varchar("video_url"),
  imageUrl: varchar("image_url"),
  attachments: text("attachments"), // URLs or file references, one per line
  objectives: text("objectives"), // Learning objectives, one per line
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User course progress
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id),
  completedLessons: integer("completed_lessons").default(0),
  totalLessons: integer("total_lessons").default(0),
  isCompleted: boolean("is_completed").default(false),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User lesson progress tracking
export const userLessonProgress = pgTable("user_lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  lessonId: varchar("lesson_id").references(() => lessons.id),
  courseId: varchar("course_id").references(() => courses.id),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lesson Resources (downloadable materials)
export const lessonResources = pgTable("lesson_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id"), // Removed foreign key constraint to allow workshop resources
  courseId: varchar("course_id"), // Added for workshop resources
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // 'pdf', 'doc', 'docx', 'xlsx', etc
  fileSize: integer("file_size"), // size in bytes
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User certificates
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id),
  issuedAt: timestamp("issued_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CMS Admin Users
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  role: varchar("role").notNull().default("admin"), // 'admin', 'editor', 'super_admin'
  permissions: jsonb("permissions").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media Files (images, videos, documents)
export const mediaFiles = pgTable("media_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(), // Size in bytes
  url: varchar("url").notNull(), // Object storage URL
  type: varchar("type").notNull(), // 'image', 'video', 'document'
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  altText: varchar("alt_text"), // For accessibility
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Blocks (reusable content pieces)
export const contentBlocks = pgTable("content_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'text', 'video', 'quiz', 'code', 'image'
  title: varchar("title"),
  content: jsonb("content").notNull(), // Flexible JSON content
  metadata: jsonb("metadata").default({}), // Additional properties
  order: integer("order").default(0),
  lessonId: varchar("lesson_id").references(() => lessons.id),
  isPublished: boolean("is_published").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course Tags
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  color: varchar("color").default("#6B7280"), // Default gray color
  createdAt: timestamp("created_at").defaultNow(),
});

// Course Tags Junction Table
export const courseTags = pgTable("course_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id),
  tagId: varchar("tag_id").references(() => tags.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course Templates (for quick course creation)
export const courseTemplates = pgTable("course_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  structure: jsonb("structure").notNull(), // Template structure
  categoryId: varchar("category_id").references(() => categories.id),
  createdBy: varchar("created_by").references(() => users.id),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // 'FREE', 'MENSUAL', 'ANUAL'
  displayName: varchar("display_name").notNull(), // 'Prueba Gratis 14 Días', 'Mensual', 'Anual'
  price: integer("price").notNull().default(0), // Price in cents (0, 3900, 29900)
  currency: varchar("currency").notNull().default("USD"),
  billingInterval: varchar("billing_interval").notNull(), // 'trial', 'month', 'year'
  trialDays: integer("trial_days").default(0), // 14 for FREE plan
  features: jsonb("features").$type<string[]>().default([]), // Array of feature descriptions
  limits: jsonb("limits").default({}), // Usage limits (e.g., {"aiUseCases": 10, "guides": 50})
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: varchar("status").notNull().default("active"), // 'active', 'cancelled', 'expired', 'trial'
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"), // For trials and annual plans
  trialEndsAt: timestamp("trial_ends_at"), // When trial expires
  cancelledAt: timestamp("cancelled_at"),
  metadata: jsonb("metadata").default({}), // Payment info, external IDs, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Usage Tracking (for plan limits)
export const userUsage = pgTable("user_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  resourceType: varchar("resource_type").notNull(), // 'ai_use_case', 'guide_access', 'workshop_attendance'
  resourceId: varchar("resource_id"), // ID of the specific resource accessed
  usageDate: timestamp("usage_date").defaultNow(),
  metadata: jsonb("metadata").default({}), // Additional usage data
  createdAt: timestamp("created_at").defaultNow(),
});

// User Points - Track points earned from activities
export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  points: integer("points").notNull(),
  activityType: varchar("activity_type").notNull(), // "message", "post", "comment", "reaction"
  activityId: varchar("activity_id"), // ID del mensaje/post/comentario
  description: varchar("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_points_user_created").on(table.userId, table.createdAt),
  index("idx_user_points_activity").on(table.activityType, table.activityId),
]);

// User Onboarding Responses
export const userOnboardingResponses = pgTable("user_onboarding_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  experienceLevel: varchar("experience_level"), // 'beginner', 'intermediate', 'advanced'
  workAreas: jsonb("work_areas").$type<string[]>().default([]), // Areas selected in step 3
  learningMethods: jsonb("learning_methods").$type<string[]>().default([]), // Methods selected in step 4
  goals: jsonb("goals").$type<string[]>().default([]), // Goals selected in step 5
  aiTools: jsonb("ai_tools").$type<string[]>().default([]), // AI tools selected in step 6
  mainGoal: varchar("main_goal"), // Main goal from step 7
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lesson Comments (with nested threading support)
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentCommentId: varchar("parent_comment_id"), // Self-reference for replies
  rootCommentId: varchar("root_comment_id"), // Top-level comment in the thread
  depth: integer("depth").default(0), // Nesting level (0 = root comment)
  replyCount: integer("reply_count").default(0), // Number of direct replies
  likeCount: integer("like_count").default(0), // Number of likes (denormalized)
  isAdminReviewed: boolean("is_admin_reviewed").default(false), // For unread badge tracking
  metadata: jsonb("metadata").default({}), // For future extensions (attachments, flags, etc)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_comments_lesson_root_created").on(table.lessonId, table.rootCommentId, table.createdAt),
  index("idx_comments_parent").on(table.parentCommentId),
  index("idx_comments_admin_reviewed").on(table.isAdminReviewed, table.createdAt),
]);

// Comment Likes (many-to-many relationship between users and comments)
export const commentLikes = pgTable("comment_likes", {
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  sql`PRIMARY KEY (comment_id, user_id)`,
  index("idx_comment_likes_comment").on(table.commentId),
  index("idx_comment_likes_user").on(table.userId),
]);

// Relations
export const userSavedCoursesRelations = relations(userSavedCourses, ({ one }) => ({
  user: one(users, {
    fields: [userSavedCourses.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userSavedCourses.courseId],
    references: [courses.id],
  }),
}));

export const userRecentActivityRelations = relations(userRecentActivity, ({ one }) => ({
  user: one(users, {
    fields: [userRecentActivity.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userRecentActivity.courseId],
    references: [courses.id],
  }),
}));

export const courseRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  lessons: many(lessons),
  userProgress: many(userProgress),
  certificates: many(certificates),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const userRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  certificates: many(certificates),
}));

export const lessonRelations = relations(lessons, ({ one }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userProgress.courseId],
    references: [courses.id],
  }),
}));

export const certificateRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id],
  }),
}));

// CMS Relations
export const adminUserRelations = relations(adminUsers, ({ one }) => ({
  user: one(users, {
    fields: [adminUsers.userId],
    references: [users.id],
  }),
}));

export const mediaFileRelations = relations(mediaFiles, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [mediaFiles.uploadedBy],
    references: [users.id],
  }),
}));

export const contentBlockRelations = relations(contentBlocks, ({ one }) => ({
  lesson: one(lessons, {
    fields: [contentBlocks.lessonId],
    references: [lessons.id],
  }),
  createdBy: one(users, {
    fields: [contentBlocks.createdBy],
    references: [users.id],
  }),
}));

export const courseTagRelations = relations(courseTags, ({ one }) => ({
  course: one(courses, {
    fields: [courseTags.courseId],
    references: [courses.id],
  }),
  tag: one(tags, {
    fields: [courseTags.tagId],
    references: [tags.id],
  }),
}));

export const courseTemplateRelations = relations(courseTemplates, ({ one }) => ({
  category: one(categories, {
    fields: [courseTemplates.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [courseTemplates.createdBy],
    references: [users.id],
  }),
}));

// Subscription Relations
export const subscriptionPlanRelations = relations(subscriptionPlans, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const userUsageRelations = relations(userUsage, ({ one }) => ({
  user: one(users, {
    fields: [userUsage.userId],
    references: [users.id],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

export const userOnboardingResponsesRelations = relations(userOnboardingResponses, ({ one }) => ({
  user: one(users, {
    fields: [userOnboardingResponses.userId],
    references: [users.id],
  }),
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [comments.lessonId],
    references: [lessons.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "parentReplies",
  }),
  replies: many(comments, {
    relationName: "parentReplies",
  }),
}));

// Update existing relations to include new CMS entities
export const extendedCourseRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  lessons: many(lessons),
  userProgress: many(userProgress),
  certificates: many(certificates),
  tags: many(courseTags),
}));

export const extendedLessonRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  contentBlocks: many(contentBlocks),
}));

export const extendedUserRelations = relations(users, ({ many, one }) => ({
  progress: many(userProgress),
  certificates: many(certificates),
  adminProfile: one(adminUsers),
  uploadedFiles: many(mediaFiles),
  createdContent: many(contentBlocks),
  courseTemplates: many(courseTemplates),
  subscriptions: many(userSubscriptions),
  usage: many(userUsage),
  onboardingResponses: many(userOnboardingResponses),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Onboarding schema
export const onboardingSchema = createInsertSchema(users).pick({
  profession: true,
  experienceLevel: true,
  interests: true,
  goals: true,
  companySize: true,
  industry: true,
  onboardingCompleted: true,
});
export type OnboardingData = z.infer<typeof onboardingSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;
export type UserLessonProgress = typeof userLessonProgress.$inferSelect;
export type InsertUserLessonProgress = typeof userLessonProgress.$inferInsert;
export type LessonResource = typeof lessonResources.$inferSelect;
export type InsertLessonResource = typeof lessonResources.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// CMS Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;
export type ContentBlock = typeof contentBlocks.$inferSelect;
export type InsertContentBlock = typeof contentBlocks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type CourseTag = typeof courseTags.$inferSelect;
export type InsertCourseTag = typeof courseTags.$inferInsert;
export type CourseTemplate = typeof courseTemplates.$inferSelect;
export type InsertCourseTemplate = typeof courseTemplates.$inferInsert;
export type UserSavedCourse = typeof userSavedCourses.$inferSelect;
export type InsertUserSavedCourse = typeof userSavedCourses.$inferInsert;

export type UserRecentActivity = typeof userRecentActivity.$inferSelect;
export type InsertUserRecentActivity = typeof userRecentActivity.$inferInsert;

// Subscription Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type UserUsage = typeof userUsage.$inferSelect;
export type InsertUserUsage = typeof userUsage.$inferInsert;
export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;
export type UserOnboardingResponse = typeof userOnboardingResponses.$inferSelect;
export type InsertUserOnboardingResponse = typeof userOnboardingResponses.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories);
export const insertCourseSchema = createInsertSchema(courses);
export const insertLessonSchema = createInsertSchema(lessons);
export const insertUserProgressSchema = createInsertSchema(userProgress);
export const insertUserLessonProgressSchema = createInsertSchema(userLessonProgress);
export const insertLessonResourceSchema = createInsertSchema(lessonResources);
export const insertCertificateSchema = createInsertSchema(certificates);

// CMS Insert schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers);
export const insertMediaFileSchema = createInsertSchema(mediaFiles);
export const insertContentBlockSchema = createInsertSchema(contentBlocks);
export const insertTagSchema = createInsertSchema(tags);
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  depth: true,
  replyCount: true,
  rootCommentId: true,
});
export const insertCourseTagSchema = createInsertSchema(courseTags);
export const insertCourseTemplateSchema = createInsertSchema(courseTemplates);

// Subscription Insert schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);
export const insertUserUsageSchema = createInsertSchema(userUsage);

// Onboarding Insert schema
export const insertUserOnboardingResponseSchema = createInsertSchema(userOnboardingResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Authentication schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

// Login schemas
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Types
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// ========================================
// ROOMS & PHASES SYSTEM (Netflix-style learning paths)
// ========================================

// Content type enum for type safety
export const contentTypes = ["course", "workshop", "guide"] as const;
export type ContentType = typeof contentTypes[number];

// Salas temáticas (Agentes IA, Vibe Coding, NoCode SaaS IA)
export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(), // agentes-ia, vibe-coding, nocode-saas
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  categoryId: varchar("category_id").references(() => categories.id), // Categoría asociada (ej: "Programas")
  coverImageUrl: varchar("cover_image_url"),
  heroImageUrl: varchar("hero_image_url"), // Banner superior tipo Netflix
  order: integer("order").notNull().default(0),
  isPublished: boolean("is_published").default(true),
  price: integer("price"), // Precio en centavos para comprar la sala completa
  currency: varchar("currency", { length: 3 }).default("usd"),
  metadata: jsonb("metadata").default({}), // Promo flags, features, etc
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_rooms_slug").on(table.slug),
  index("idx_rooms_published_order").on(table.isPublished, table.order),
]);

// Fases dentro de cada sala (se liberan semanalmente)
export const phases = pgTable("phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  releaseDate: timestamp("release_date", { withTimezone: true }).notNull(), // Liberación programada
  metadata: jsonb("metadata").default({}), // Iconos, colores, badges especiales
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_phases_room_order").on(table.roomId, table.order),
  index("idx_phases_release_date").on(table.releaseDate),
]);

// Contenido dentro de fases (relación muchos a muchos con courses/workshops/guides)
export const phaseContent = pgTable("phase_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phaseId: varchar("phase_id").references(() => phases.id, { onDelete: "cascade" }).notNull(),
  contentType: varchar("content_type").notNull().$type<ContentType>(), // 'course', 'workshop', 'guide'
  contentId: varchar("content_id").notNull(), // ID del curso/workshop/guía
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  // Composite unique key para evitar duplicados
  index("idx_phase_content_unique").on(table.phaseId, table.contentType, table.contentId),
  index("idx_phase_content_phase").on(table.phaseId),
  index("idx_phase_content_content").on(table.contentId, table.contentType),
]);

// ========================================
// PURCHASES & ACCESS CONTROL
// ========================================

// Registro de compras (ledger inmutable para auditoría)
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  productType: varchar("product_type").notNull(), // 'workshop', 'room', 'plan'
  productId: varchar("product_id"), // ID del workshop o room, null si es plan general
  amount: integer("amount").notNull(), // En centavos
  currency: varchar("currency", { length: 3 }).default("usd"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  status: varchar("status").default("completed"), // 'pending', 'completed', 'failed', 'refunded'
  metadata: jsonb("metadata").default({}), // Snapshot de Stripe payload
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_purchases_user").on(table.userId),
  index("idx_purchases_user_status").on(table.userId, table.status),
  index("idx_purchases_stripe_intent").on(table.stripePaymentIntentId),
]);

// Control de acceso activo (grants que pueden expirar o revocarse)
export const userAccess = pgTable("user_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accessType: varchar("access_type").notNull(), // 'workshop', 'room', 'plan'
  accessId: varchar("access_id"), // ID del workshop o room, null si es plan general
  purchaseId: varchar("purchase_id").references(() => purchases.id), // Link a la compra original (nullable para grants manuales)
  isActive: boolean("is_active").default(true), // Para soft delete de accesos
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // null = acceso permanente
}, (table) => [
  index("idx_user_access_user").on(table.userId),
  index("idx_user_access_user_type").on(table.userId, table.accessType),
  index("idx_user_access_active").on(table.userId, table.accessType, table.accessId, table.isActive),
]);

// Banners promocionales que se muestran entre fases en las salas
export const promoBanners = pgTable("promo_banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  subtitle: varchar("subtitle"),
  description: text("description"),
  backgroundImageUrl: varchar("background_image_url"),
  backgroundColor: varchar("background_color").default("from-orange-600 to-red-600"),
  ctaText: varchar("cta_text"),
  ctaLink: varchar("cta_link"),
  displayAfterPhaseOrder: integer("display_after_phase_order").notNull(), // Mostrar después de esta fase
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_promo_banners_room").on(table.roomId),
  index("idx_promo_banners_room_order").on(table.roomId, table.order),
]);

// Community channels
export const communityChannels = pgTable("community_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  section: varchar("section").notNull(), // "Bienvenida", "Redes", etc.
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  isReadOnly: boolean("is_read_only").default(false), // Solo admins pueden publicar, usuarios no pueden comentar ni reaccionar
  createdAt: timestamp("created_at").defaultNow(),
});

// Community messages
export const communityMessages = pgTable("community_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => communityChannels.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  attachments: jsonb("attachments").$type<Array<{type: string; url: string; name?: string}>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_messages_channel").on(table.channelId),
  index("idx_messages_user").on(table.userId),
  index("idx_messages_created").on(table.createdAt),
  index("idx_messages_pinned").on(table.isPinned),
]);

// Message reactions
export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => communityMessages.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  emoji: varchar("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_reactions_message").on(table.messageId),
  index("idx_reactions_user").on(table.userId),
]);

// Community posts (for announcements channel)
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => communityChannels.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  contentBlocks: jsonb("content_blocks").$type<Array<{type: "text" | "video"; content?: string; url?: string}>>().default([]),
  displayOrder: integer("display_order").default(0), // For ordering posts in read-only channels like "Empieza aquí"
  isAdminPost: boolean("is_admin_post").default(false), // Whether post was created by admin
  isPinned: boolean("is_pinned").default(false), // Whether post is pinned to the top
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_posts_channel").on(table.channelId),
  index("idx_posts_user").on(table.userId),
  index("idx_posts_created").on(table.createdAt),
  index("idx_posts_channel_order").on(table.channelId, table.displayOrder),
]);

// Community post comments
export const communityPostComments = pgTable("community_post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => communityPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_post_comments_post").on(table.postId),
  index("idx_post_comments_user").on(table.userId),
]);

// Community post comment reactions
export const communityPostCommentReactions = pgTable("community_post_comment_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").references(() => communityPostComments.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  emoji: varchar("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_comment_reactions_comment").on(table.commentId),
  index("idx_comment_reactions_user").on(table.userId),
]);

// Community post reactions
export const communityPostReactions = pgTable("community_post_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => communityPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  emoji: varchar("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_post_reactions_post").on(table.postId),
  index("idx_post_reactions_user").on(table.userId),
]);

// User notification preferences
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  emailNotifications: boolean("email_notifications").default(true),
  inAppNotifications: boolean("in_app_notifications").default(true),
  mobileNotifications: boolean("mobile_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_prefs_user").on(table.userId),
]);

// Content notifications (guías, cursos, talleres publicados - para campana e historial)
export const contentNotifications = pgTable("content_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  type: varchar("type").notNull(), // 'guide' | 'course' | 'workshop'
  title: varchar("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_content_notifications_created").on(table.createdAt),
]);

// Per-user "cleared" timestamp: notificaciones con createdAt <= clearedAt se ocultan
export const userNotificationCleared = pgTable("user_notification_cleared", {
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).primaryKey(),
  clearedAt: timestamp("cleared_at").notNull().defaultNow(),
});

// ========================================
// RELATIONS
// ========================================

export const roomsRelations = relations(rooms, ({ many }) => ({
  phases: many(phases),
  promoBanners: many(promoBanners),
}));

export const phasesRelations = relations(phases, ({ one, many }) => ({
  room: one(rooms, {
    fields: [phases.roomId],
    references: [rooms.id],
  }),
  content: many(phaseContent),
}));

export const phaseContentRelations = relations(phaseContent, ({ one }) => ({
  phase: one(phases, {
    fields: [phaseContent.phaseId],
    references: [phases.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

export const userAccessRelations = relations(userAccess, ({ one }) => ({
  user: one(users, {
    fields: [userAccess.userId],
    references: [users.id],
  }),
  purchase: one(purchases, {
    fields: [userAccess.purchaseId],
    references: [purchases.id],
  }),
}));

export const promoBannersRelations = relations(promoBanners, ({ one }) => ({
  room: one(rooms, {
    fields: [promoBanners.roomId],
    references: [rooms.id],
  }),
}));

export const communityChannelsRelations = relations(communityChannels, ({ many }) => ({
  messages: many(communityMessages),
}));

export const communityMessagesRelations = relations(communityMessages, ({ one, many }) => ({
  channel: one(communityChannels, {
    fields: [communityMessages.channelId],
    references: [communityChannels.id],
  }),
  user: one(users, {
    fields: [communityMessages.userId],
    references: [users.id],
  }),
  reactions: many(messageReactions),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(communityMessages, {
    fields: [messageReactions.messageId],
    references: [communityMessages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  channel: one(communityChannels, {
    fields: [communityPosts.channelId],
    references: [communityChannels.id],
  }),
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityPostComments),
  reactions: many(communityPostReactions),
}));

export const communityPostCommentsRelations = relations(communityPostComments, ({ one, many }) => ({
  post: one(communityPosts, {
    fields: [communityPostComments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityPostComments.userId],
    references: [users.id],
  }),
  reactions: many(communityPostCommentReactions),
}));

export const communityPostCommentReactionsRelations = relations(communityPostCommentReactions, ({ one }) => ({
  comment: one(communityPostComments, {
    fields: [communityPostCommentReactions.commentId],
    references: [communityPostComments.id],
  }),
  user: one(users, {
    fields: [communityPostCommentReactions.userId],
    references: [users.id],
  }),
}));

export const communityPostReactionsRelations = relations(communityPostReactions, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityPostReactions.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityPostReactions.userId],
    references: [users.id],
  }),
}));

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userNotificationPreferences.userId],
    references: [users.id],
  }),
}));

// ========================================
// INSERT SCHEMAS & TYPES
// ========================================

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhaseSchema = createInsertSchema(phases).omit({
  id: true,
  createdAt: true,
});

export const insertPhaseContentSchema = createInsertSchema(phaseContent).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchasedAt: true,
});

export const insertUserAccessSchema = createInsertSchema(userAccess).omit({
  id: true,
  grantedAt: true,
});

export const insertPromoBannerSchema = createInsertSchema(promoBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityChannelSchema = createInsertSchema(communityChannels).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityMessageSchema = createInsertSchema(communityMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
});

export const insertCommunityPostCommentSchema = createInsertSchema(communityPostComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityPostCommentReactionSchema = createInsertSchema(communityPostCommentReactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Live Events table - for scheduled live events/workshops
export const liveEvents = pgTable("live_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  hostName: varchar("host_name").notNull(),
  hostAvatar: varchar("host_avatar"),
  hostRole: varchar("host_role"),
  eventImage: varchar("event_image"), // Banner or cover image for the event
  // Scheduling
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: varchar("timezone").default("America/Bogota"),
  // Status
  isActive: boolean("is_active").default(true),
  isLive: boolean("is_live").default(false), // Manually set when event starts
  // Join info
  joinUrl: varchar("join_url"), // Custom URL or will use /live/{id}
  roomName: varchar("room_name"), // Jitsi room name
  // Event type
  eventType: varchar("event_type").default("live"), // "live", "workshop", "webinar"
  category: varchar("category"), // "Creación de contenido", "Marketing", "Diseño", etc.
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLiveEventSchema = createInsertSchema(liveEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Event Registrations - for users to register for events
// User Events - Track user actions for automation triggers
export const userEvents = pgTable("user_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventType: varchar("event_type").notNull(), // 'course_completed', 'lesson_completed', 'inactive', 'milestone', etc.
  eventData: jsonb("event_data").$type<Record<string, any>>(), // Additional event metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Automations - Define automation rules
export const automations = pgTable("automations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  triggerType: varchar("trigger_type").notNull(), // 'event', 'schedule', 'segment'
  triggerConfig: jsonb("trigger_config").$type<Record<string, any>>().notNull(), // Event type, schedule, segment rules
  actionType: varchar("action_type").notNull(), // 'email', 'tag', 'webhook', etc.
  actionConfig: jsonb("action_config").$type<Record<string, any>>().notNull(), // Email template, tag name, webhook URL, etc.
  isActive: boolean("is_active").default(true),
  segmentRules: jsonb("segment_rules").$type<Record<string, any>>(), // User segment filters
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Automation Logs - Track automation executions
export const automationLogs = pgTable("automation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  automationId: varchar("automation_id").references(() => automations.id),
  userId: varchar("user_id").references(() => users.id),
  eventId: varchar("event_id").references(() => userEvents.id),
  status: varchar("status").notNull(), // 'success', 'failed', 'skipped'
  result: jsonb("result").$type<Record<string, any>>(), // Execution result/details
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at").defaultNow(),
});

// User Segments - Dynamic user segments for targeting
export const userSegments = pgTable("user_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  rules: jsonb("rules").$type<Record<string, any>>().notNull(), // Segment criteria
  userCount: integer("user_count").default(0), // Cached count
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketing Analytics - Track marketing metrics
export const marketingAnalytics = pgTable("marketing_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  metricType: varchar("metric_type").notNull(), // 'conversion', 'engagement', 'churn', 'revenue', etc.
  metricValue: integer("metric_value").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => liveEvents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"), // For WhatsApp notifications
  // Status
  status: varchar("status").default("registered"), // "registered", "cancelled", "attended"
  // Reminders
  reminderSent24h: boolean("reminder_sent_24h").default(false),
  reminderSent1h: boolean("reminder_sent_1h").default(false),
  // Tracking
  registeredAt: timestamp("registered_at").defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
  attendedAt: timestamp("attended_at"),
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registeredAt: true,
  cancelledAt: true,
  attendedAt: true,
});

// Update Schemas (for PATCH operations)
export const updateRoomSchema = insertRoomSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

// Select Types
export type Room = typeof rooms.$inferSelect;
export type Phase = typeof phases.$inferSelect;
export type PhaseContent = typeof phaseContent.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type UserAccess = typeof userAccess.$inferSelect;
export type PromoBanner = typeof promoBanners.$inferSelect;
export type CommunityChannel = typeof communityChannels.$inferSelect;
export type CommunityMessage = typeof communityMessages.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityPostComment = typeof communityPostComments.$inferSelect;
export type CommunityPostCommentReaction = typeof communityPostCommentReactions.$inferSelect;
export type UserNotificationPreference = typeof userNotificationPreferences.$inferSelect;
export type LiveEvent = typeof liveEvents.$inferSelect;

// Insert Types
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type InsertPhaseContent = z.infer<typeof insertPhaseContentSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertUserAccess = z.infer<typeof insertUserAccessSchema>;
export type InsertPromoBanner = z.infer<typeof insertPromoBannerSchema>;
export type InsertCommunityChannel = z.infer<typeof insertCommunityChannelSchema>;
export type InsertCommunityMessage = z.infer<typeof insertCommunityMessageSchema>;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type InsertCommunityPostComment = z.infer<typeof insertCommunityPostCommentSchema>;
export type InsertCommunityPostCommentReaction = z.infer<typeof insertCommunityPostCommentReactionSchema>;
export type InsertUserNotificationPreference = z.infer<typeof insertUserNotificationPreferencesSchema>;
export type InsertLiveEvent = z.infer<typeof insertLiveEventSchema>;

// Update Types
export type UpdateRoom = z.infer<typeof updateRoomSchema>;

// ========== INTERNAL TASK MANAGEMENT (Admin Kanban board) ==========

// Columns of the internal admin Kanban board (e.g. "Por hacer", "En progreso", "Hecho")
export const adminTaskColumns = pgTable("admin_task_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  color: varchar("color").default("#1978E5"), // Accent color for the column header
  position: integer("position").notNull().default(0), // Display order, left to right
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Internal admin tasks organized on the Kanban board
export const adminTasks = pgTable("admin_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  columnId: varchar("column_id").notNull().references(() => adminTaskColumns.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  position: real("position").notNull().default(0), // Display order within the column
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminTaskColumnSchema = createInsertSchema(adminTaskColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminTaskSchema = createInsertSchema(adminTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.coerce.date().nullable().optional(),
});

export const updateAdminTaskSchema = insertAdminTaskSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

// Fields a client is allowed to PATCH on a task (column moves go through the dedicated /move endpoint)
export const patchAdminTaskSchema = insertAdminTaskSchema
  .omit({ columnId: true, createdBy: true })
  .partial();

export type AdminTaskColumn = typeof adminTaskColumns.$inferSelect;
export type AdminTask = typeof adminTasks.$inferSelect;
export type InsertAdminTaskColumn = z.infer<typeof insertAdminTaskColumnSchema>;
export type InsertAdminTask = z.infer<typeof insertAdminTaskSchema>;
export type UpdateAdminTask = z.infer<typeof updateAdminTaskSchema>;
export type PatchAdminTask = z.infer<typeof patchAdminTaskSchema>;
