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
  description: text("description"),
  type: varchar("type").notNull(), // 'course', 'guide', 'workshop'
  categoryId: varchar("category_id").references(() => categories.id),
  difficulty: varchar("difficulty"), // 'beginner', 'intermediate', 'advanced'
  estimatedHours: integer("estimated_hours"),
  hasCertificate: boolean("has_certificate").default(true),
  isPublished: boolean("is_published").default(true),
  coverImageUrl: varchar("cover_image_url"), // Custom course image
  metadata: jsonb("metadata").default({}), // Workshop-specific data like instructor, videoUrl, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  createdAt: timestamp("created_at").defaultNow(),
});

// User recently viewed content tracking
export const userRecentActivity = pgTable("user_recent_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  courseId: varchar("course_id").references(() => courses.id),
  lastLessonId: varchar("last_lesson_id").references(() => lessons.id), // Track specific lesson within course
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course modules/lessons
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id),
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

export const userOnboardingResponsesRelations = relations(userOnboardingResponses, ({ one }) => ({
  user: one(users, {
    fields: [userOnboardingResponses.userId],
    references: [users.id],
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
export type UserOnboardingResponse = typeof userOnboardingResponses.$inferSelect;
export type InsertUserOnboardingResponse = typeof userOnboardingResponses.$inferInsert;

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
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
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
