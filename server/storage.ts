import {
  users,
  courses,
  categories,
  courseCategories,
  lessons,
  userProgress,
  userLessonProgress,
  lessonResources,
  certificates,
  adminUsers,
  userSavedCourses,
  userRecentActivity,
  mediaFiles,
  contentBlocks,
  tags,
  courseTags,
  courseTemplates,
  subscriptionPlans,
  userSubscriptions,
  userUsage,
  type User,
  type UpsertUser,
  type OnboardingData,
  type Course,
  type Category,
  type UserProgress,
  type UserLessonProgress,
  type InsertUserLessonProgress,
  type LessonResource,
  type InsertLessonResource,
  type Certificate,
  type InsertUserProgress,
  type InsertCertificate,
  type AdminUser,
  type InsertAdminUser,
  type UserSavedCourse,
  type InsertUserSavedCourse,
  type UserRecentActivity,
  type InsertUserRecentActivity,
  type MediaFile,
  type InsertMediaFile,
  type ContentBlock,
  type InsertContentBlock,
  type Tag,
  type InsertTag,
  type Lesson,
  type InsertLesson,
  type InsertCourse,
  type InsertCategory,
  type CourseTemplate,
  type InsertCourseTemplate,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UserSubscription,
  type InsertUserSubscription,
  type UserUsage,
  type InsertUserUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // New authentication methods
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  updatePasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  
  // Existing user methods
  updateUserOnboarding(userId: string, data: OnboardingData): Promise<User>;
  updateUserProfile(userId: string, data: Partial<UpsertUser>): Promise<User>;
  updateUserFocus(userId: string, data: { experienceLevel?: string; preferredSkillType?: string; preferredContentTypes?: string[]; }): Promise<User>;
  getAllUserProgress(userId: string): Promise<UserProgress[]>;
  
  // Course operations
  getAllCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  getCoursesByCategory(categoryId: string): Promise<Course[]>;
  getCoursesWithProgress(userId: string): Promise<any[]>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  
  // Progress operations
  getUserProgress(userId: string, courseId?: string): Promise<UserProgress | UserProgress[] | undefined>;
  getUserContinueCourses(userId: string): Promise<any[]>;
  updateUserProgress(userId: string, courseId: string, data: Partial<InsertUserProgress>): Promise<UserProgress>;
  
  // Recent Activity operations
  trackUserActivity(userId: string, courseId: string): Promise<void>;
  getUserRecentCourses(userId: string, limit?: number): Promise<any[]>;
  
  // Profile Progress operations
  getUserProfileProgress(userId: string): Promise<{
    coursesInProgress: any[];
    completedCourses: any[];
    completedGuides: any[];
  }>;
  
  // Certificate operations
  getUserCertificates(userId: string): Promise<Certificate[]>;
  issueCertificate(userId: string, courseId: string): Promise<Certificate>;
  
  // Lesson operations
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | undefined>;
  createLesson(data: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<boolean>;
  moveLessonUp(id: string): Promise<boolean>;
  moveLessonDown(id: string): Promise<boolean>;
  
  // Lesson progress operations
  markLessonComplete(userId: string, lessonId: string): Promise<UserLessonProgress>;
  getCompletedLessons(userId: string, courseId: string): Promise<string[]>;
  
  // Admin User operations
  getAdminUser(userId: string): Promise<AdminUser | undefined>;
  createAdminUser(data: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(userId: string, data: Partial<InsertAdminUser>): Promise<AdminUser>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  
  // Media File operations
  createMediaFile(data: InsertMediaFile): Promise<MediaFile>;
  getMediaFileById(id: string): Promise<MediaFile | undefined>;
  getAllMediaFiles(): Promise<MediaFile[]>;
  getMediaFilesByType(type: string): Promise<MediaFile[]>;
  updateMediaFile(id: string, data: Partial<InsertMediaFile>): Promise<MediaFile>;
  deleteMediaFile(id: string): Promise<boolean>;
  
  // Content Block operations
  getContentBlocksByLesson(lessonId: string): Promise<ContentBlock[]>;
  createContentBlock(data: InsertContentBlock): Promise<ContentBlock>;
  updateContentBlock(id: string, data: Partial<InsertContentBlock>): Promise<ContentBlock>;
  deleteContentBlock(id: string): Promise<boolean>;
  
  // Tag operations
  getAllTags(): Promise<Tag[]>;
  createTag(data: InsertTag): Promise<Tag>;
  updateTag(id: string, data: Partial<InsertTag>): Promise<Tag>;
  deleteTag(id: string): Promise<boolean>;
  
  // Lesson resource operations
  getLessonResourcesByCourse(courseId: string): Promise<LessonResource[]>;
  createLessonResource(data: InsertLessonResource): Promise<LessonResource>;
  getLessonResources(lessonId: string): Promise<LessonResource[]>;
  
  // Admin Course operations (including unpublished)
  getAllCoursesAdmin(): Promise<Course[]>;
  createCourse(data: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<boolean>;
  
  // Admin Category operations
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Course Template operations
  getCourseTemplates(): Promise<CourseTemplate[]>;
  createCourseTemplate(data: InsertCourseTemplate): Promise<CourseTemplate>;
  updateCourseTemplate(id: string, data: Partial<InsertCourseTemplate>): Promise<CourseTemplate>;
  deleteCourseTemplate(id: string): Promise<boolean>;

  // Lesson Resources operations
  getLessonResources(lessonId: string): Promise<LessonResource[]>;
  createLessonResource(data: InsertLessonResource): Promise<LessonResource>;
  updateLessonResource(id: string, data: Partial<InsertLessonResource>): Promise<LessonResource>;
  deleteLessonResource(id: string): Promise<void>;

  // Subscription operations
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(data: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  
  // User subscription operations
  getUserActiveSubscription(userId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(data: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  cancelUserSubscription(userId: string): Promise<UserSubscription>;
  
  // Usage tracking operations
  trackUserUsage(data: InsertUserUsage): Promise<UserUsage>;
  getUserUsageCount(userId: string, resourceType: string, startDate?: Date): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // New authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updatePasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserOnboarding(userId: string, data: OnboardingData): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        profession: data.profession,
        experienceLevel: data.experienceLevel,
        interests: Array.isArray(data.interests) ? data.interests as string[] : [],
        goals: data.goals,
        companySize: data.companySize,
        industry: data.industry,
        onboardingCompleted: data.onboardingCompleted,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Course operations
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isPublished, true));
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByCategory(categoryId: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(and(eq(courses.categoryId, categoryId), eq(courses.isPublished, true)));
  }

  async getCoursesWithProgress(userId: string): Promise<any[]> {
    const result = await db
      .select({
        course: courses,
        category: categories,
        progress: userProgress,
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(userProgress, and(
        eq(userProgress.courseId, courses.id),
        eq(userProgress.userId, userId)
      ))
      .where(eq(courses.isPublished, true));

    return result;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  // Progress operations
  async getUserProgress(userId: string, courseId?: string): Promise<UserProgress | UserProgress[] | undefined> {
    if (courseId) {
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)));
      return progress;
    } else {
      // Return all progress for the user
      return await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
    }
  }

  async getAllUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async updateUserProfile(userId: string, data: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserFocus(userId: string, data: { experienceLevel?: string; preferredSkillType?: string; preferredContentTypes?: string[]; }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        experienceLevel: data.experienceLevel,
        preferredSkillType: data.preferredSkillType,
        preferredContentTypes: data.preferredContentTypes,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Profile Progress operations
  async getUserProfileProgress(userId: string): Promise<{
    coursesInProgress: any[];
    completedCourses: any[];
    completedGuides: any[];
  }> {
    // Get all user progress with course and category information
    const allProgress = await db
      .select({
        progress: userProgress,
        course: courses,
        category: categories,
      })
      .from(userProgress)
      .leftJoin(courses, eq(userProgress.courseId, courses.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(userProgress.userId, userId));

    // Separate into different categories
    const coursesInProgress: any[] = [];
    const completedCourses: any[] = [];
    const completedGuides: any[] = [];

    for (const item of allProgress) {
      if (!item.course) continue; // Skip if course data is missing
      
      const progressPercentage = (item.progress.totalLessons && item.progress.totalLessons > 0) 
        ? Math.round(((item.progress.completedLessons || 0) / item.progress.totalLessons) * 100)
        : 0;

      const courseData = {
        course: item.course,
        category: item.category,
        progress: {
          ...item.progress,
          completionPercentage: progressPercentage
        }
      };

      if (item.progress.isCompleted) {
        if (item.course.type === 'guide') {
          completedGuides.push(courseData);
        } else if (item.course.type === 'course') {
          completedCourses.push(courseData);
        }
      } else if (progressPercentage > 0) {
        // Only include courses that have been started (progress > 0)
        if (item.course.type === 'course') {
          coursesInProgress.push(courseData);
        }
      }
    }

    // Sort by last accessed date (most recent first)
    coursesInProgress.sort((a, b) => 
      new Date(b.progress.lastAccessedAt).getTime() - new Date(a.progress.lastAccessedAt).getTime()
    );
    
    completedCourses.sort((a, b) => 
      new Date(b.progress.completedAt || b.progress.updatedAt).getTime() - 
      new Date(a.progress.completedAt || a.progress.updatedAt).getTime()
    );
    
    completedGuides.sort((a, b) => 
      new Date(b.progress.completedAt || b.progress.updatedAt).getTime() - 
      new Date(a.progress.completedAt || a.progress.updatedAt).getTime()
    );

    return {
      coursesInProgress,
      completedCourses,
      completedGuides
    };
  }

  // Track user activity when they view a course
  async trackUserActivity(userId: string, courseId: string): Promise<void> {
    // Check if activity already exists for this user/course combination
    const [existing] = await db
      .select()
      .from(userRecentActivity)
      .where(and(eq(userRecentActivity.userId, userId), eq(userRecentActivity.courseId, courseId)));

    if (existing) {
      // Update existing record
      await db
        .update(userRecentActivity)
        .set({ 
          lastAccessedAt: new Date(),
          updatedAt: new Date() 
        })
        .where(and(eq(userRecentActivity.userId, userId), eq(userRecentActivity.courseId, courseId)));
    } else {
      // Create new activity record
      await db
        .insert(userRecentActivity)
        .values({
          userId,
          courseId,
          lastAccessedAt: new Date(),
        });
    }
  }

  // Get user's recently accessed courses (last 5, no duplicates)
  async getUserRecentCourses(userId: string, limit: number = 5): Promise<any[]> {
    // Use DISTINCT ON to get only the most recent access per course
    const activities = await db
      .selectDistinctOn([userRecentActivity.courseId], {
        activity: userRecentActivity,
        course: courses,
        category: categories,
        progress: userProgress,
      })
      .from(userRecentActivity)
      .leftJoin(courses, eq(userRecentActivity.courseId, courses.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(userProgress, and(
        eq(userProgress.userId, userId),
        eq(userProgress.courseId, courses.id)
      ))
      .where(eq(userRecentActivity.userId, userId))
      .orderBy(userRecentActivity.courseId, desc(userRecentActivity.lastAccessedAt))
      .limit(limit);

    // Sort by last accessed date descending after getting distinct courses
    const sortedActivities = activities.sort((a, b) => {
      const dateA = a.activity.lastAccessedAt ? new Date(a.activity.lastAccessedAt).getTime() : 0;
      const dateB = b.activity.lastAccessedAt ? new Date(b.activity.lastAccessedAt).getTime() : 0;
      return dateB - dateA;
    });

    return sortedActivities.map((item: any) => ({
      course: item.course,
      category: item.category,
      progress: item.progress,
      lastAccessed: item.activity.lastAccessedAt,
    }));
  }

  async getUserContinueCourses(userId: string): Promise<any[]> {
    const result = await db
      .select({
        course: courses,
        category: categories,
        progress: userProgress,
      })
      .from(userProgress)
      .leftJoin(courses, eq(userProgress.courseId, courses.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.isCompleted, false)
      ))
      .orderBy(desc(userProgress.lastAccessedAt))
      .limit(8);

    return result;
  }

  async updateUserProgress(userId: string, courseId: string, data: Partial<InsertUserProgress>): Promise<UserProgress> {
    const existing = await this.getUserProgress(userId, courseId);
    
    if (existing) {
      const [updated] = await db
        .update(userProgress)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProgress)
        .values({
          userId,
          courseId,
          ...data,
        })
        .returning();
      return created;
    }
  }

  async updateCourseProgress(userId: string, courseId: string): Promise<void> {
    // Get total number of lessons in the course
    const totalLessons = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    // Get completed lessons count
    const completedLessonsQuery = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(userLessonProgress)
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.courseId, courseId),
        eq(userLessonProgress.isCompleted, true)
      ));

    const totalCount = totalLessons[0]?.count || 0;
    const completedCount = completedLessonsQuery[0]?.count || 0;
    const isCompleted = completedCount > 0 && completedCount >= totalCount;

    // Update or create user progress
    await this.updateUserProgress(userId, courseId, {
      totalLessons: totalCount,
      completedLessons: completedCount,
      isCompleted: isCompleted,
      lastAccessedAt: new Date(),
      ...(isCompleted && { completedAt: new Date() })
    });
  }

  // Certificate operations
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));
  }

  async issueCertificate(userId: string, courseId: string): Promise<Certificate> {
    const [certificate] = await db
      .insert(certificates)
      .values({
        userId,
        courseId,
      })
      .returning();
    return certificate;
  }

  // Lesson operations
  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(data: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(data).returning();
    return lesson;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson> {
    const [lesson] = await db
      .update(lessons)
      .set(data)
      .where(eq(lessons.id, id))
      .returning();
    return lesson;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async moveLessonUp(id: string): Promise<boolean> {
    // Get the lesson to move
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!lesson || !lesson.courseId) return false;

    // Get all lessons in the same course ordered by order
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, lesson.courseId))
      .orderBy(lessons.order);

    // Find current position
    const currentIndex = courseLessons.findIndex(l => l.id === id);
    if (currentIndex <= 0) return false; // Already at top or not found

    const previousLesson = courseLessons[currentIndex - 1];
    
    // Swap orders
    await db.transaction(async (tx) => {
      await tx.update(lessons)
        .set({ order: previousLesson.order })
        .where(eq(lessons.id, lesson.id));
      
      await tx.update(lessons)
        .set({ order: lesson.order })
        .where(eq(lessons.id, previousLesson.id));
    });

    return true;
  }

  async moveLessonDown(id: string): Promise<boolean> {
    // Get the lesson to move
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!lesson || !lesson.courseId) return false;

    // Get all lessons in the same course ordered by order
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, lesson.courseId))
      .orderBy(lessons.order);

    // Find current position
    const currentIndex = courseLessons.findIndex(l => l.id === id);
    if (currentIndex < 0 || currentIndex >= courseLessons.length - 1) return false; // At bottom or not found

    const nextLesson = courseLessons[currentIndex + 1];
    
    // Swap orders
    await db.transaction(async (tx) => {
      await tx.update(lessons)
        .set({ order: nextLesson.order })
        .where(eq(lessons.id, lesson.id));
      
      await tx.update(lessons)
        .set({ order: lesson.order })
        .where(eq(lessons.id, nextLesson.id));
    });

    return true;
  }

  // Admin User operations
  async getAdminUser(userId: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.userId, userId));
    return admin;
  }

  async createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db.insert(adminUsers).values(data).returning();
    return admin;
  }

  async updateAdminUser(userId: string, data: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [admin] = await db
      .update(adminUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminUsers.userId, userId))
      .returning();
    return admin;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true));
  }

  // Media File operations
  async createMediaFile(data: InsertMediaFile): Promise<MediaFile> {
    const [file] = await db.insert(mediaFiles).values(data).returning();
    return file;
  }

  async getMediaFileById(id: string): Promise<MediaFile | undefined> {
    const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file;
  }

  async getAllMediaFiles(): Promise<MediaFile[]> {
    return await db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));
  }

  async getMediaFilesByType(type: string): Promise<MediaFile[]> {
    return await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.type, type))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async updateMediaFile(id: string, data: Partial<InsertMediaFile>): Promise<MediaFile> {
    const [file] = await db
      .update(mediaFiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mediaFiles.id, id))
      .returning();
    return file;
  }

  async deleteMediaFile(id: string): Promise<boolean> {
    const result = await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Content Block operations
  async getContentBlocksByLesson(lessonId: string): Promise<ContentBlock[]> {
    return await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.lessonId, lessonId))
      .orderBy(contentBlocks.order);
  }

  async createContentBlock(data: InsertContentBlock): Promise<ContentBlock> {
    const [block] = await db.insert(contentBlocks).values(data).returning();
    return block;
  }

  async updateContentBlock(id: string, data: Partial<InsertContentBlock>): Promise<ContentBlock> {
    const [block] = await db
      .update(contentBlocks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contentBlocks.id, id))
      .returning();
    return block;
  }

  async deleteContentBlock(id: string): Promise<boolean> {
    const result = await db.delete(contentBlocks).where(eq(contentBlocks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tag operations
  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async createTag(data: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(data).returning();
    return tag;
  }

  async updateTag(id: string, data: Partial<InsertTag>): Promise<Tag> {
    const [tag] = await db
      .update(tags)
      .set(data)
      .where(eq(tags.id, id))
      .returning();
    return tag;
  }

  async deleteTag(id: string): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Admin Course operations (including unpublished)
  async getAllCoursesAdmin(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    // Extract categoryIds if present
    const categoryIds = (data as any).categoryIds;
    delete (data as any).categoryIds;
    
    const [course] = await db.insert(courses).values(data).returning();
    
    // Insert course categories if categoryIds provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await db.insert(courseCategories).values(
        categoryIds.map(categoryId => ({
          courseId: course.id,
          categoryId: categoryId
        }))
      );
    }
    
    return course;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course> {
    // Extract categoryIds if present
    const categoryIds = (data as any).categoryIds;
    delete (data as any).categoryIds;
    
    const [course] = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    
    // Update course categories if categoryIds provided
    if (categoryIds && Array.isArray(categoryIds)) {
      // Delete existing categories
      await db.delete(courseCategories).where(eq(courseCategories.courseId, id));
      
      // Insert new categories
      if (categoryIds.length > 0) {
        await db.insert(courseCategories).values(
          categoryIds.map(categoryId => ({
            courseId: id,
            categoryId: categoryId
          }))
        );
      }
    }
    
    return course;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Admin Category operations
  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Course Categories operations
  async getCourseCategories(courseId: string): Promise<any[]> {
    return await db.select().from(courseCategories).where(eq(courseCategories.courseId, courseId));
  }

  // Course Template operations
  async getCourseTemplates(): Promise<CourseTemplate[]> {
    return await db
      .select()
      .from(courseTemplates)
      .orderBy(desc(courseTemplates.createdAt));
  }

  async createCourseTemplate(data: InsertCourseTemplate): Promise<CourseTemplate> {
    const [template] = await db.insert(courseTemplates).values(data).returning();
    return template;
  }

  async updateCourseTemplate(id: string, data: Partial<InsertCourseTemplate>): Promise<CourseTemplate> {
    const [template] = await db
      .update(courseTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseTemplates.id, id))
      .returning();
    return template;
  }

  async deleteCourseTemplate(id: string): Promise<boolean> {
    const result = await db.delete(courseTemplates).where(eq(courseTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Lesson progress operations
  async markLessonComplete(userId: string, lessonId: string): Promise<UserLessonProgress> {
    // First get the lesson to find the course ID
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if already completed
    const existingProgress = await db
      .select()
      .from(userLessonProgress)
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.lessonId, lessonId)
      ))
      .limit(1);

    let lessonProgress: UserLessonProgress;

    if (existingProgress.length > 0) {
      // Update existing record to mark as completed
      const [progress] = await db
        .update(userLessonProgress)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.lessonId, lessonId)
        ))
        .returning();
      lessonProgress = progress;
    } else {
      // Create new progress record
      const [progress] = await db
        .insert(userLessonProgress)
        .values({
          userId,
          lessonId,
          courseId: lesson.courseId,
          isCompleted: true,
          completedAt: new Date()
        })
        .returning();
      lessonProgress = progress;
    }

    // Update overall course progress
    if (lesson.courseId) {
      await this.updateCourseProgress(userId, lesson.courseId);
    }

    return lessonProgress;
  }

  async getCompletedLessons(userId: string, courseId: string): Promise<string[]> {
    const completed = await db
      .select({ lessonId: userLessonProgress.lessonId })
      .from(userLessonProgress)
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.courseId, courseId),
        eq(userLessonProgress.isCompleted, true)
      ));
    
    return completed.map(row => row.lessonId).filter((id): id is string => id !== null);
  }

  // Lesson Resources operations
  async getLessonResources(lessonId: string): Promise<LessonResource[]> {
    return await db
      .select()
      .from(lessonResources)
      .where(and(
        eq(lessonResources.lessonId, lessonId),
        eq(lessonResources.isActive, true)
      ))
      .orderBy(lessonResources.createdAt);
  }

  async getLessonResourcesByCourse(courseId: string): Promise<LessonResource[]> {
    const resources = await db
      .select()
      .from(lessonResources)
      .where(and(
        eq(lessonResources.courseId, courseId),
        eq(lessonResources.isActive, true)
      ))
      .orderBy(lessonResources.createdAt);
    
    return resources;
  }

  async createLessonResource(data: InsertLessonResource): Promise<LessonResource> {
    const [resource] = await db
      .insert(lessonResources)
      .values(data)
      .returning();
    return resource;
  }

  async updateLessonResource(id: string, data: Partial<InsertLessonResource>): Promise<LessonResource> {
    const [resource] = await db
      .update(lessonResources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lessonResources.id, id))
      .returning();
    return resource;
  }

  async deleteLessonResource(id: string): Promise<void> {
    await db
      .update(lessonResources)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(lessonResources.id, id));
  }

  // User saved courses methods
  async getUserSavedCourses(userId: string) {
    return await db
      .select({
        id: userSavedCourses.id,
        courseId: userSavedCourses.courseId,
        createdAt: userSavedCourses.createdAt,
        course: courses,
      })
      .from(userSavedCourses)
      .innerJoin(courses, eq(userSavedCourses.courseId, courses.id))
      .where(eq(userSavedCourses.userId, userId));
  }

  async saveUserCourse(userId: string, courseId: string) {
    const [savedCourse] = await db
      .insert(userSavedCourses)
      .values({ userId, courseId })
      .returning();
    return savedCourse;
  }

  async unsaveUserCourse(userId: string, courseId: string): Promise<void> {
    await db
      .delete(userSavedCourses)
      .where(
        and(
          eq(userSavedCourses.userId, userId),
          eq(userSavedCourses.courseId, courseId)
        )
      );
  }

  // Subscription operations
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price);
  }

  async getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(
        eq(subscriptionPlans.name, name),
        eq(subscriptionPlans.isActive, true)
      ));
    return plan;
  }

  async createSubscriptionPlan(data: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(data)
      .returning();
    return plan;
  }

  async updateSubscriptionPlan(id: string, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [plan] = await db
      .update(subscriptionPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return plan;
  }

  // User subscription operations
  async getUserActiveSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    
    return subscription?.subscription;
  }

  async createUserSubscription(data: InsertUserSubscription): Promise<UserSubscription> {
    const [subscription] = await db
      .insert(userSubscriptions)
      .values(data)
      .returning();
    return subscription;
  }

  async updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [subscription] = await db
      .update(userSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return subscription;
  }

  async cancelUserSubscription(userId: string): Promise<UserSubscription> {
    const [subscription] = await db
      .update(userSubscriptions)
      .set({ 
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ))
      .returning();
    return subscription;
  }

  // Usage tracking operations
  async trackUserUsage(data: InsertUserUsage): Promise<UserUsage> {
    const [usage] = await db
      .insert(userUsage)
      .values(data)
      .returning();
    return usage;
  }

  async getUserUsageCount(userId: string, resourceType: string, startDate?: Date): Promise<number> {
    const conditions = [
      eq(userUsage.userId, userId),
      eq(userUsage.resourceType, resourceType)
    ];

    if (startDate) {
      conditions.push(eq(userUsage.usageDate, startDate));
    }

    const result = await db
      .select({ count: eq(userUsage.id, userUsage.id) })
      .from(userUsage)
      .where(and(...conditions));

    return result.length;
  }

}

export const storage = new DatabaseStorage();
