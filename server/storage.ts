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
  userPoints,
  userOnboardingResponses,
  comments,
  commentLikes,
  // Rooms & Phases system
  rooms,
  phases,
  phaseContent,
  purchases,
  userAccess,
  promoBanners,
  // Community system
  communityChannels,
  communityMessages,
  messageReactions,
  communityPosts,
  communityPostComments,
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
  type UserPoints,
  type InsertUserPoints,
  type UserOnboardingResponse,
  type InsertUserOnboardingResponse,
  type Comment,
  type InsertComment,
  // Rooms & Phases types
  type Room,
  type InsertRoom,
  type UpdateRoom,
  type Phase,
  type InsertPhase,
  type PhaseContent,
  type InsertPhaseContent,
  type Purchase,
  type InsertPurchase,
  type UserAccess,
  type InsertUserAccess,
  type PromoBanner,
  type InsertPromoBanner,
  type ContentType,
  type CommunityChannel,
  type CommunityMessage,
  type InsertCommunityChannel,
  type InsertCommunityMessage,
  type InsertMessageReaction,
  contentNotifications,
  userNotificationCleared,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, not, inArray, isNull, isNotNull, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // New authentication methods
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    subscriptionStatus?: 'active' | 'trial' | 'cancelled' | 'none';
  }): Promise<Array<User & { 
    subscription?: UserSubscription & { plan?: SubscriptionPlan };
    subscriptionCount?: number;
  }>>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  updatePasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<void>;
  
  // Existing user methods
  updateUserOnboarding(userId: string, data: OnboardingData): Promise<User>;
  updateUserProfile(userId: string, data: Partial<UpsertUser>): Promise<User>;
  updateUserFocus(userId: string, data: { experienceLevel?: string; preferredSkillType?: string; preferredContentTypes?: string[]; }): Promise<User>;
  getAllUserProgress(userId: string): Promise<UserProgress[]>;
  
  // Course operations
  getAllCourses(): Promise<Course[]>;
  getAllCoursesIncludingRooms(): Promise<Course[]>; // Includes courses from rooms
  getAllGuides(): Promise<Course[]>;
  getAllGuidesIncludingRooms(): Promise<Course[]>; // Includes guides from rooms
  getAllWorkshops(): Promise<Course[]>;
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
  trackUserActivity(userId: string, courseId: string, options?: { lastLessonId?: string; contentType?: string; roomSlug?: string }): Promise<void>;
  getLastLessonIdForCourse(userId: string, courseId: string, roomSlug?: string | null): Promise<string | null>;
  getUserRecentContent(userId: string, limit?: number): Promise<any[]>;
  getDashboardActivity(userId: string): Promise<{ streakDays: number; last30Days: { date: string; active: boolean }[] }>;
  
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
  getModulesByCourse(courseId: string): Promise<Lesson[]>; // Get only parent lessons (modules)
  getSubLessons(parentLessonId: string): Promise<Lesson[]>; // Get sub-lessons of a module
  getLessonById(id: string): Promise<Lesson | undefined>;
  createLesson(data: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<boolean>;
  moveLessonUp(id: string): Promise<boolean>;
  moveLessonDown(id: string): Promise<boolean>;
  
  // Course reordering
  moveCourseUp(id: string): Promise<boolean>;
  moveCourseDown(id: string): Promise<boolean>;
  
  // Lesson progress operations
  markLessonComplete(userId: string, lessonId: string): Promise<UserLessonProgress>;
  unmarkLessonComplete(userId: string, lessonId: string): Promise<boolean>;
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
  getAllCoursesAdmin(): Promise<any[]>;
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
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
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

  // Onboarding responses operations
  saveOnboardingResponse(data: InsertUserOnboardingResponse): Promise<UserOnboardingResponse>;
  getUserOnboardingResponse(userId: string): Promise<UserOnboardingResponse | undefined>;
  getOnboardingAnalytics(): Promise<{
    totalResponses: number;
    experienceLevels: Record<string, number>;
    popularWorkAreas: Record<string, number>;
    popularLearningMethods: Record<string, number>;
    popularGoals: Record<string, number>;
    popularAiTools: Record<string, number>;
    recentResponses: UserOnboardingResponse[];
  }>;
  getAllOnboardingResponses(limit?: number, offset?: number): Promise<UserOnboardingResponse[]>;
  
  // Multiple categories support for guides
  getCourseCategories(courseId: string): Promise<string[]>;
  updateCourseCategories(courseId: string, categoryIds: string[]): Promise<void>;

  // Content notifications (in-app: guías, cursos, talleres publicados)
  createContentNotification(data: { contentId: string; type: "guide" | "course" | "workshop"; title: string; description?: string }): Promise<{ id: string; contentId: string; type: string; title: string; description: string | null; createdAt: Date | null }>;
  getContentNotifications(limit?: number): Promise<Array<{ id: string; contentId: string; type: string; title: string; description: string | null; createdAt: Date | null }>>;
  getUserNotificationClearedAt(userId: string): Promise<Date | null>;
  setUserNotificationClearedAt(userId: string): Promise<void>;

  // ========================================
  // ROOMS & PHASES OPERATIONS
  // ========================================
  
  // Room operations
  getPublishedRooms(): Promise<Room[]>;
  getAllRooms(): Promise<Room[]>;
  getRoomById(id: string): Promise<Room | undefined>;
  getRoomBySlug(slug: string): Promise<Room | undefined>;
  getRoomDetailWithPhases(slug: string, userId?: string): Promise<{
    room: Room;
    phases: Array<Phase & {
      isLocked: boolean;
      content: Array<PhaseContent & { courseData?: Course }>;
    }>;
    promoBanners: PromoBanner[];
    userHasAccess: boolean;
  } | undefined>;
  getPhaseContent(phaseId: string): Promise<Array<PhaseContent & { courseData?: Course }>>;
  getNextCourseInRoom(roomSlug: string, currentCourseId: string): Promise<{ courseId: string; slug?: string; title: string; coverImageUrl: string | null } | null>;
  createRoom(data: InsertRoom): Promise<Room>;
  updateRoom(id: string, data: UpdateRoom): Promise<Room>;
  
  // Phase operations
  createPhase(data: InsertPhase): Promise<Phase>;
  updatePhase(id: string, data: Partial<InsertPhase>): Promise<Phase>;
  addContentToPhase(data: InsertPhaseContent): Promise<PhaseContent>;
  removeContentFromPhase(id: string): Promise<boolean>;
  
  // Promo Banner operations
  getAllPromoBanners(roomId?: string): Promise<PromoBanner[]>;
  getPromoBannerById(id: string): Promise<PromoBanner | undefined>;
  createPromoBanner(data: InsertPromoBanner): Promise<PromoBanner>;
  updatePromoBanner(id: string, data: Partial<InsertPromoBanner>): Promise<PromoBanner>;
  deletePromoBanner(id: string): Promise<boolean>;
  
  // ========================================
  // ACCESS CONTROL OPERATIONS
  // ========================================
  
  checkUserAccess(userId: string, accessType: string, accessId?: string): Promise<boolean>;
  grantUserAccess(data: InsertUserAccess): Promise<UserAccess>;
  listActiveAccess(userId: string): Promise<UserAccess[]>;
  revokeUserAccess(userId: string, accessType: string, accessId?: string): Promise<boolean>;
  
  // ========================================
  // PURCHASES OPERATIONS
  // ========================================
  
  createPurchase(data: InsertPurchase): Promise<Purchase>;
  updatePurchaseStatus(id: string, status: string, metadata?: any): Promise<Purchase>;
  listPurchasesForUser(userId: string): Promise<Purchase[]>;
  getPurchaseByStripeIntent(stripePaymentIntentId: string): Promise<Purchase | undefined>;
  
  // ========================================
  // COMMENTS OPERATIONS
  // ========================================
  
  getLessonComments(lessonId: string): Promise<Array<Comment & { 
    user: { firstName: string; lastName: string; profileImageUrl: string | null }; 
    replies: Array<Comment & { user: { firstName: string; lastName: string; profileImageUrl: string | null } }> 
  }>>;
  getCommentById(commentId: string): Promise<Comment | undefined>;
  createComment(data: Omit<InsertComment, 'depth' | 'replyCount' | 'rootCommentId' | 'metadata'> & { metadata?: any }): Promise<Comment>;
  createReply(parentCommentId: string, data: Omit<InsertComment, 'parentCommentId' | 'depth' | 'replyCount' | 'rootCommentId' | 'metadata'> & { metadata?: any }): Promise<Comment>;
  markCommentReviewed(commentId: string): Promise<Comment>;
  getUnreadCommentCount(): Promise<number>;
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

  async getAllUsers(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    subscriptionStatus?: 'active' | 'trial' | 'cancelled' | 'none';
  }): Promise<Array<User & { 
    subscription?: UserSubscription & { plan?: SubscriptionPlan };
    subscriptionCount?: number;
  }>> {
    // Build where conditions
    const whereConditions: any[] = [];

    // Apply search filter
    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      whereConditions.push(or(
        sql`${users.email} ILIKE ${searchTerm}`,
        sql`${users.firstName} ILIKE ${searchTerm}`,
        sql`${users.lastName} ILIKE ${searchTerm}`,
        sql`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${searchTerm}`
      ));
    }

    // Build base query
    const baseQuery = db
      .select({
        user: users,
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(users)
      .leftJoin(userSubscriptions, and(
        eq(userSubscriptions.userId, users.id),
        eq(userSubscriptions.status, 'active')
      ))
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id));

    // Apply subscription status filter
    if (options?.subscriptionStatus) {
      if (options.subscriptionStatus === 'none') {
        whereConditions.push(isNull(userSubscriptions.id));
      } else if (options.subscriptionStatus === 'active') {
        whereConditions.push(eq(userSubscriptions.status, 'active'));
      } else if (options.subscriptionStatus === 'trial') {
        whereConditions.push(eq(userSubscriptions.status, 'trial'));
      } else if (options.subscriptionStatus === 'cancelled') {
        whereConditions.push(eq(userSubscriptions.status, 'cancelled'));
      }
    }

    // Build final query with all conditions
    let finalQuery = baseQuery;
    if (whereConditions.length > 0) {
      finalQuery = baseQuery.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)) as any;
    }

    // Apply ordering and pagination
    finalQuery = finalQuery.orderBy(desc(users.createdAt)) as any;
    
    if (options?.limit) {
      finalQuery = finalQuery.limit(options.limit) as any;
    }
    if (options?.offset) {
      finalQuery = finalQuery.offset(options.offset) as any;
    }

    const results = await finalQuery;

    // Get subscription count for each user
    const userIds = results.map(r => r.user.id);
    const subscriptionCounts = await db
      .select({
        userId: userSubscriptions.userId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(userSubscriptions)
      .where(inArray(userSubscriptions.userId, userIds))
      .groupBy(userSubscriptions.userId);

    const countMap = new Map(subscriptionCounts.map(sc => [sc.userId, sc.count]));

    // Transform results
    return results.map(result => ({
      ...result.user,
      subscription: result.subscription ? {
        ...result.subscription,
        plan: result.plan || undefined,
      } : undefined,
      subscriptionCount: countMap.get(result.user.id) || 0,
    }));
  }

  async createUser(userData: Partial<User>): Promise<User> {
    // Auto-sync to Beehiiv if configured
    if (userData.email && process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUBLICATION_ID) {
      // Run in background to not block user creation
      import('./beehiiv').then(({ subscribeToBeehiiv }) => {
        subscribeToBeehiiv({
          email: userData.email!,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          reactivate: true,
          tags: ['new-user'],
        }).catch((error) => {
          console.error('⚠️ Error auto-syncing user to Beehiiv (non-blocking):', error.message);
        });
      }).catch(() => {
        // Ignore import errors
      });
    }
    const [user] = await db
      .insert(users)
      .values(userData as any) // Cast to bypass type checking for dynamic user creation
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
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!result || result.length === 0) {
      throw new Error(`No se pudo actualizar la contraseña. Usuario ${userId} no encontrado.`);
    }
    
    console.log(`✅ Password updated in database for user ${userId}`);
  }

  async setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
    return user;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
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
    // Excluir cursos que están asignados a salas (en phase_content)
    const result = await db
      .select({ course: courses })
      .from(courses)
      .leftJoin(
        phaseContent, 
        and(
          eq(phaseContent.contentType, 'course'),
          eq(phaseContent.contentId, courses.id)
        )
      )
      .where(
        and(
          eq(courses.isPublished, true),
          eq(courses.type, 'course'),
          isNull(phaseContent.id) // Solo cursos que NO están en phase_content
        )
      );
    
    return result.map(r => r.course);
  }

  async getAllCoursesIncludingRooms(): Promise<any[]> {
    // Incluir TODOS los cursos con información de la sala si pertenecen a una
    const result = await db
      .select({
        course: courses,
        phaseContent: phaseContent,
        phase: phases,
        room: rooms,
      })
      .from(courses)
      .leftJoin(
        phaseContent,
        and(
          eq(phaseContent.contentType, 'course'),
          eq(phaseContent.contentId, courses.id)
        )
      )
      .leftJoin(phases, eq(phases.id, phaseContent.phaseId))
      .leftJoin(rooms, eq(rooms.id, phases.roomId))
      .where(
        and(
          eq(courses.isPublished, true),
          eq(courses.type, 'course')
        )
      );

    // Group by course and aggregate room info
    const coursesMap = new Map<string, any>();
    
    for (const row of result) {
      if (!coursesMap.has(row.course.id)) {
        coursesMap.set(row.course.id, {
          ...row.course,
          roomContext: []
        });
      }
      
      // Add room info if exists and is not null
      if (row.room && row.room.id) {
        const courseData = coursesMap.get(row.course.id);
        const roomData = row.room; // Capture for TypeScript
        // Avoid adding duplicate room contexts
        const existingRoom = courseData.roomContext.find((r: any) => r.roomId === roomData.id);
        if (!existingRoom) {
          courseData.roomContext.push({
            roomId: roomData.id,
            roomSlug: roomData.slug,
            roomTitle: roomData.title,
          });
        }
      }
    }
    
    return Array.from(coursesMap.values());
  }

  async getAllGuides(): Promise<Course[]> {
    return await db.select().from(courses).where(and(eq(courses.isPublished, true), eq(courses.type, 'guide')));
  }

  async getAllGuidesIncludingRooms(): Promise<any[]> {
    // Incluir TODAS las guías con información de la sala si pertenecen a una
    const result = await db
      .select({
        course: courses,
        phaseContent: phaseContent,
        phase: phases,
        room: rooms,
      })
      .from(courses)
      .leftJoin(
        phaseContent,
        and(
          eq(phaseContent.contentType, 'guide'),
          eq(phaseContent.contentId, courses.id)
        )
      )
      .leftJoin(phases, eq(phases.id, phaseContent.phaseId))
      .leftJoin(rooms, eq(rooms.id, phases.roomId))
      .where(
        and(
          eq(courses.isPublished, true),
          eq(courses.type, 'guide')
        )
      );

    // Group by guide and aggregate room info
    const guidesMap = new Map<string, any>();
    
    for (const row of result) {
      if (!guidesMap.has(row.course.id)) {
        guidesMap.set(row.course.id, {
          ...row.course,
          roomContext: []
        });
      }
      
      // Add room info if exists and is not null
      if (row.room && row.room.id) {
        const guideData = guidesMap.get(row.course.id);
        const roomData = row.room; // Capture for TypeScript
        // Avoid adding duplicate room contexts
        const existingRoom = guideData.roomContext.find((r: any) => r.roomId === roomData.id);
        if (!existingRoom) {
          guideData.roomContext.push({
            roomId: roomData.id,
            roomSlug: roomData.slug,
            roomTitle: roomData.title,
          });
        }
      }
    }
    
    return Array.from(guidesMap.values());
  }

  async getAllWorkshops(): Promise<Course[]> {
    return await db.select().from(courses).where(and(eq(courses.isPublished, true), eq(courses.type, 'workshop')));
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    // Try to find by ID first, then by slug
    const [course] = await db.select().from(courses).where(
      or(
        eq(courses.id, id),
        eq(courses.slug, id)
      )
    ).limit(1);
    
    if (course) {
      // Get the category IDs for this course
      const courseCats = await db
        .select({ categoryId: courseCategories.categoryId })
        .from(courseCategories)
        .where(eq(courseCategories.courseId, course.id));
      
      // Add categoryIds to the course object for the admin form
      (course as any).categoryIds = courseCats.map(cc => cc.categoryId);
    }
    
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

  // Track user activity when they view a course, guide, workshop or lesson
  async trackUserActivity(userId: string, courseId: string, options?: { lastLessonId?: string; contentType?: string; roomSlug?: string }): Promise<void> {
    const contentType = options?.contentType || 'course';
    const lastLessonId = options?.lastLessonId;
    const roomSlug = options?.roomSlug;
    
    // For room context, we want to track separately (e.g., same course in different rooms = different activities)
    const whereClause = roomSlug
      ? and(
          eq(userRecentActivity.userId, userId),
          eq(userRecentActivity.courseId, courseId),
          eq(userRecentActivity.roomSlug, roomSlug)
        )
      : and(
          eq(userRecentActivity.userId, userId),
          eq(userRecentActivity.courseId, courseId),
          sql`${userRecentActivity.roomSlug} IS NULL`
        );
    
    // Check if activity already exists for this user/course/room combination
    const [existing] = await db
      .select()
      .from(userRecentActivity)
      .where(whereClause);

    if (existing) {
      // Update existing record with new data and timestamp
      const updateData: any = { 
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
        contentType
      };
      
      // Only update lastLessonId if provided
      if (lastLessonId) {
        updateData.lastLessonId = lastLessonId;
      }
      
      // Update roomSlug if provided
      if (roomSlug !== undefined) {
        updateData.roomSlug = roomSlug;
      }
      
      await db
        .update(userRecentActivity)
        .set(updateData)
        .where(whereClause);
    } else {
      // Create new activity record
      const insertData: any = {
        userId,
        courseId,
        contentType,
        lastAccessedAt: new Date(),
      };
      
      // Include lastLessonId if provided
      if (lastLessonId) {
        insertData.lastLessonId = lastLessonId;
      }
      
      // Include roomSlug if provided
      if (roomSlug) {
        insertData.roomSlug = roomSlug;
      }
      
      await db
        .insert(userRecentActivity)
        .values(insertData);
    }
  }

  async getLastLessonIdForCourse(userId: string, courseId: string, roomSlug?: string | null): Promise<string | null> {
    const whereClause = roomSlug != null && roomSlug !== ""
      ? and(
          eq(userRecentActivity.userId, userId),
          eq(userRecentActivity.courseId, courseId),
          eq(userRecentActivity.roomSlug, roomSlug)
        )
      : and(
          eq(userRecentActivity.userId, userId),
          eq(userRecentActivity.courseId, courseId),
          isNull(userRecentActivity.roomSlug)
        );
    const [row] = await db
      .select({ lastLessonId: userRecentActivity.lastLessonId })
      .from(userRecentActivity)
      .where(whereClause)
      .orderBy(desc(userRecentActivity.lastAccessedAt))
      .limit(1);
    return row?.lastLessonId ?? null;
  }

  // Get user's recently accessed content (courses, guides, workshops) - last 8, no duplicates
  async getUserRecentContent(userId: string, limit: number = 8): Promise<any[]> {
    // Get all recent activities sorted by most recent
    const activities = await db
      .select({
        activity: userRecentActivity,
        course: courses,
        category: categories,
        progress: userProgress,
        lastLesson: lessons,
        phaseContent: phaseContent,
        phase: phases,
        room: rooms,
      })
      .from(userRecentActivity)
      .leftJoin(courses, eq(userRecentActivity.courseId, courses.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(userProgress, and(
        eq(userProgress.userId, userId),
        eq(userProgress.courseId, courses.id)
      ))
      .leftJoin(lessons, eq(userRecentActivity.lastLessonId, lessons.id))
      // Join to find if course belongs to a room (via phase_content)
      .leftJoin(phaseContent, and(
        eq(phaseContent.contentId, courses.id),
        eq(phaseContent.contentType, courses.type)
      ))
      .leftJoin(phases, eq(phaseContent.phaseId, phases.id))
      .leftJoin(rooms, eq(phases.roomId, rooms.id))
      .where(eq(userRecentActivity.userId, userId))
      .orderBy(desc(userRecentActivity.lastAccessedAt));

    // Remove duplicates manually by tracking unique course+room combinations
    const seen = new Set<string>();
    const uniqueActivities = [];
    
    for (const item of activities) {
      // Use room slug from activity if available, otherwise from room join
      const roomSlug = item.activity.roomSlug || item.room?.slug;
      const key = `${item.activity.courseId}-${roomSlug || 'standalone'}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueActivities.push({ ...item, roomSlug });
        if (uniqueActivities.length >= limit) break;
      }
    }

    return uniqueActivities.map((item: any) => ({
      course: item.course,
      category: item.category,
      progress: item.progress,
      lastAccessed: item.activity.lastAccessedAt,
      lastLesson: item.lastLesson,
      lastLessonId: item.activity.lastLessonId,
      contentType: item.activity.contentType,
      roomSlug: item.roomSlug, // Include room slug from activity or room join
    }));
  }

  async getDashboardActivity(userId: string): Promise<{ streakDays: number; last30Days: { date: string; active: boolean }[] }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const rows = await db
      .select({ lastAccessedAt: userRecentActivity.lastAccessedAt })
      .from(userRecentActivity)
      .where(and(
        eq(userRecentActivity.userId, userId),
        sql`${userRecentActivity.lastAccessedAt} >= ${thirtyDaysAgo.toISOString()}`
      ));
    const activeDates = new Set(
      (rows || [])
        .map((r: any) => r.lastAccessedAt && new Date(r.lastAccessedAt).toISOString().slice(0, 10))
        .filter(Boolean)
    );
    const last30Days: { date: string; active: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      last30Days.push({ date: dateStr, active: activeDates.has(dateStr) });
    }
    let streakDays = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (activeDates.has(dateStr)) streakDays++;
      else break;
    }
    return { streakDays, last30Days };
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
    // Get existing progress to check if course was already completed
    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.courseId, courseId)
      ))
      .limit(1);

    const wasAlreadyCompleted = existingProgress.length > 0 && existingProgress[0].isCompleted;

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

    // Record event if course was just completed
    if (isCompleted && !wasAlreadyCompleted) {
      try {
        const { recordEvent } = await import('./eventSystem');
        const course = await this.getCourseById(courseId);
        await recordEvent(userId, 'course_completed', {
          courseId,
          courseTitle: course?.title,
          completedLessons: completedCount,
          totalLessons: totalCount,
        });
      } catch (error: any) {
        console.error('Error recording course_completed event:', error.message);
      }
    }
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

  async getModulesByCourse(courseId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(
        and(
          eq(lessons.courseId, courseId),
          isNull(lessons.parentLessonId)
        )
      )
      .orderBy(lessons.order);
  }

  async getSubLessons(parentLessonId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.parentLessonId, parentLessonId))
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
    try {
      // First verify the lesson exists
      const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
      if (!lesson) {
        console.error(`❌ Lección no encontrada: ${id}`);
        return false;
      }

      console.log(`🗑️ Eliminando lección: ${id} - "${lesson.title}"`);
      
      await db.transaction(async (tx) => {
        // First, recursively delete all sub-lessons (lessons with this lesson as parent)
        const subLessons = await tx.select().from(lessons).where(eq(lessons.parentLessonId, id));
        console.log(`📋 Encontradas ${subLessons.length} sublecciones para eliminar`);
        for (const subLesson of subLessons) {
          // Recursively delete sub-lessons
          await this.deleteLessonInTransaction(tx, subLesson.id);
        }
        
        // Get all comments for this lesson to delete their likes first
        const lessonComments = await tx.select().from(comments).where(eq(comments.lessonId, id));
        const commentIds = lessonComments.map(c => c.id);
        console.log(`💬 Encontrados ${commentIds.length} comentarios para eliminar`);
        
        // Delete comment likes first (if any)
        if (commentIds.length > 0) {
          await tx.delete(commentLikes).where(inArray(commentLikes.commentId, commentIds));
          console.log(`👍 Eliminados likes de comentarios`);
        }
        
        // Delete all related data in correct order
        await tx.delete(userRecentActivity).where(eq(userRecentActivity.lastLessonId, id));
        await tx.delete(userLessonProgress).where(eq(userLessonProgress.lessonId, id));
        await tx.delete(lessonResources).where(eq(lessonResources.lessonId, id));
        await tx.delete(contentBlocks).where(eq(contentBlocks.lessonId, id));
        await tx.delete(comments).where(eq(comments.lessonId, id));
        
        // Finally, delete the lesson itself
        await tx.delete(lessons).where(eq(lessons.id, id));
        console.log(`✅ Lección eliminada exitosamente: ${id}`);
      });
      return true;
    } catch (error: any) {
      console.error('❌ Error en deleteLesson:', {
        lessonId: id,
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail,
        stack: error.stack
      });
      throw error;
    }
  }

  // Helper method for recursive deletion within a transaction
  private async deleteLessonInTransaction(tx: any, id: string): Promise<void> {
    // Recursively delete all sub-lessons
    const subLessons = await tx.select().from(lessons).where(eq(lessons.parentLessonId, id));
    for (const subLesson of subLessons) {
      await this.deleteLessonInTransaction(tx, subLesson.id);
    }
    
    // Get all comments for this lesson to delete their likes first
    const lessonComments = await tx.select().from(comments).where(eq(comments.lessonId, id));
    const commentIds = lessonComments.map((c: any) => c.id);
    
    // Delete comment likes first (if any)
    if (commentIds.length > 0) {
      await tx.delete(commentLikes).where(inArray(commentLikes.commentId, commentIds));
    }
    
    // Delete all related data for this lesson
    await tx.delete(userRecentActivity).where(eq(userRecentActivity.lastLessonId, id));
    await tx.delete(userLessonProgress).where(eq(userLessonProgress.lessonId, id));
    await tx.delete(lessonResources).where(eq(lessonResources.lessonId, id));
    await tx.delete(contentBlocks).where(eq(contentBlocks.lessonId, id));
    await tx.delete(comments).where(eq(comments.lessonId, id));
    
    // Delete the lesson itself
    await tx.delete(lessons).where(eq(lessons.id, id));
  }

  async moveLessonUp(id: string): Promise<boolean> {
    // Get the lesson to move
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!lesson || !lesson.courseId) return false;

    // Get all lessons at the same level (same parent) in the same course ordered by order
    const whereConditions = lesson.parentLessonId
      ? and(
          eq(lessons.courseId, lesson.courseId),
          eq(lessons.parentLessonId, lesson.parentLessonId)
        )
      : and(
          eq(lessons.courseId, lesson.courseId),
          isNull(lessons.parentLessonId)
        );
    
    const sameLevelLessons = await db
      .select()
      .from(lessons)
      .where(whereConditions)
      .orderBy(lessons.order);

    // Find current position
    const currentIndex = sameLevelLessons.findIndex(l => l.id === id);
    if (currentIndex <= 0) return false; // Already at top or not found

    const previousLesson = sameLevelLessons[currentIndex - 1];
    
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

    // Get all lessons at the same level (same parent) in the same course ordered by order
    const whereConditions = lesson.parentLessonId
      ? and(
          eq(lessons.courseId, lesson.courseId),
          eq(lessons.parentLessonId, lesson.parentLessonId)
        )
      : and(
          eq(lessons.courseId, lesson.courseId),
          isNull(lessons.parentLessonId)
        );
    
    const sameLevelLessons = await db
      .select()
      .from(lessons)
      .where(whereConditions)
      .orderBy(lessons.order);

    // Find current position
    const currentIndex = sameLevelLessons.findIndex(l => l.id === id);
    if (currentIndex < 0 || currentIndex >= sameLevelLessons.length - 1) return false; // At bottom or not found

    const nextLesson = sameLevelLessons[currentIndex + 1];
    
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

  async moveCourseUp(id: string): Promise<boolean> {
    // Get the course to move
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) return false;

    const currentOrder = (course as any).order || 0;
    
    // Find course with order immediately before this one (same type)
    const [previousCourse] = await db
      .select()
      .from(courses)
      .where(and(
        sql`COALESCE(${courses.order}, 0) < ${currentOrder}`,
        eq(courses.type, course.type) // Only swap with same type
      ))
      .orderBy(desc(sql`COALESCE(${courses.order}, 0)`))
      .limit(1);

    if (!previousCourse) return false; // Already at top

    const previousOrder = (previousCourse as any).order || 0;

    // Swap orders in courses table AND phaseContent table
    await db.transaction(async (tx) => {
      // Swap in courses table
      await tx.update(courses)
        .set({ order: previousOrder })
        .where(eq(courses.id, id));
      
      await tx.update(courses)
        .set({ order: currentOrder })
        .where(eq(courses.id, previousCourse.id));

      // Also update phaseContent.order for all rooms where these courses appear
      // Get all phaseContent entries for both courses
      const currentCoursePhaseContent = await tx
        .select()
        .from(phaseContent)
        .where(and(
          eq(phaseContent.contentId, id),
          or(
            eq(phaseContent.contentType, 'course'),
            eq(phaseContent.contentType, 'workshop'),
            eq(phaseContent.contentType, 'guide')
          )
        ));

      const previousCoursePhaseContent = await tx
        .select()
        .from(phaseContent)
        .where(and(
          eq(phaseContent.contentId, previousCourse.id),
          or(
            eq(phaseContent.contentType, 'course'),
            eq(phaseContent.contentType, 'workshop'),
            eq(phaseContent.contentType, 'guide')
          )
        ));

      // Group by phaseId to swap within the same phase
      const phaseMap = new Map<string, { current: any, previous: any }>();
      
      for (const item of currentCoursePhaseContent) {
        if (!phaseMap.has(item.phaseId)) {
          phaseMap.set(item.phaseId, { current: null, previous: null });
        }
        phaseMap.get(item.phaseId)!.current = item;
      }

      for (const item of previousCoursePhaseContent) {
        if (!phaseMap.has(item.phaseId)) {
          phaseMap.set(item.phaseId, { current: null, previous: null });
        }
        phaseMap.get(item.phaseId)!.previous = item;
      }

      // Swap phaseContent.order for courses in the same phase
      for (const [phaseId, { current, previous }] of Array.from(phaseMap.entries())) {
        if (current && previous) {
          // Both courses are in the same phase - swap their orders
          const tempOrder = current.order;
          await tx.update(phaseContent)
            .set({ order: previous.order })
            .where(eq(phaseContent.id, current.id));
          
          await tx.update(phaseContent)
            .set({ order: tempOrder })
            .where(eq(phaseContent.id, previous.id));
        }
      }
    });

    return true;
  }

  async moveCourseDown(id: string): Promise<boolean> {
    // Get the course to move
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) return false;

    const currentOrder = (course as any).order || 0;
    
    // Find course with order immediately after this one (same type)
    const [nextCourse] = await db
      .select()
      .from(courses)
      .where(and(
        sql`COALESCE(${courses.order}, 0) > ${currentOrder}`,
        eq(courses.type, course.type) // Only swap with same type
      ))
      .orderBy(sql`COALESCE(${courses.order}, 0)`)
      .limit(1);

    if (!nextCourse) return false; // Already at bottom

    const nextOrder = (nextCourse as any).order || 0;

    // Swap orders in courses table AND phaseContent table
    await db.transaction(async (tx) => {
      // Swap in courses table
      await tx.update(courses)
        .set({ order: nextOrder })
        .where(eq(courses.id, id));
      
      await tx.update(courses)
        .set({ order: currentOrder })
        .where(eq(courses.id, nextCourse.id));

      // Also update phaseContent.order for all rooms where these courses appear
      // Get all phaseContent entries for both courses
      const currentCoursePhaseContent = await tx
        .select()
        .from(phaseContent)
        .where(and(
          eq(phaseContent.contentId, id),
          or(
            eq(phaseContent.contentType, 'course'),
            eq(phaseContent.contentType, 'workshop'),
            eq(phaseContent.contentType, 'guide')
          )
        ));

      const nextCoursePhaseContent = await tx
        .select()
        .from(phaseContent)
        .where(and(
          eq(phaseContent.contentId, nextCourse.id),
          or(
            eq(phaseContent.contentType, 'course'),
            eq(phaseContent.contentType, 'workshop'),
            eq(phaseContent.contentType, 'guide')
          )
        ));

      // Group by phaseId to swap within the same phase
      const phaseMap = new Map<string, { current: any, next: any }>();
      
      for (const item of currentCoursePhaseContent) {
        if (!phaseMap.has(item.phaseId)) {
          phaseMap.set(item.phaseId, { current: null, next: null });
        }
        phaseMap.get(item.phaseId)!.current = item;
      }

      for (const item of nextCoursePhaseContent) {
        if (!phaseMap.has(item.phaseId)) {
          phaseMap.set(item.phaseId, { current: null, next: null });
        }
        phaseMap.get(item.phaseId)!.next = item;
      }

      // Swap phaseContent.order for courses in the same phase
      for (const [phaseId, { current, next }] of Array.from(phaseMap.entries())) {
        if (current && next) {
          // Both courses are in the same phase - swap their orders
          const tempOrder = current.order;
          await tx.update(phaseContent)
            .set({ order: next.order })
            .where(eq(phaseContent.id, current.id));
          
          await tx.update(phaseContent)
            .set({ order: tempOrder })
            .where(eq(phaseContent.id, next.id));
        }
      }
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
  async getAllCoursesAdmin(): Promise<any[]> {
    // Get all courses with room information
    // Use a more explicit join structure to ensure we get room information correctly
    const result = await db
      .select({
        course: courses,
        phaseContent: phaseContent,
        phase: phases,
        room: rooms,
      })
      .from(courses)
      .leftJoin(
        phaseContent,
        and(
          eq(phaseContent.contentType, 'course'),
          eq(phaseContent.contentId, courses.id)
        )
      )
      .leftJoin(phases, eq(phases.id, phaseContent.phaseId))
      .leftJoin(rooms, eq(rooms.id, phases.roomId))
      .orderBy(sql`COALESCE(${courses.order}, 0) ASC`, desc(courses.createdAt));

    // Group by course and aggregate room info
    const coursesMap = new Map<string, any>();
    
    for (const row of result) {
      if (!coursesMap.has(row.course.id)) {
        coursesMap.set(row.course.id, {
          ...row.course,
          roomContext: []
        });
      }
      
      // Add room info if exists and is not null
      // Check that we have all the necessary data: phaseContent, phase, and room
      // Simplified check: just verify room exists (which implies phaseContent and phase exist)
      if (row.room && row.room.id) {
        const courseData = coursesMap.get(row.course.id);
        const roomData = row.room;
        // Avoid adding duplicate room contexts
        const existingRoom = courseData.roomContext.find((r: any) => r.roomId === roomData.id);
        if (!existingRoom) {
          courseData.roomContext.push({
            roomId: roomData.id,
            roomSlug: roomData.slug,
            roomTitle: roomData.title,
          });
        }
      }
    }
    
    return Array.from(coursesMap.values());
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
    
    if ((data as any).createdAt) {
      const nextCreatedAt = (data as any).createdAt instanceof Date
        ? (data as any).createdAt
        : new Date((data as any).createdAt);
      if (Number.isNaN(nextCreatedAt.getTime())) {
        delete (data as any).createdAt;
      } else {
        (data as any).createdAt = nextCreatedAt;
      }
    }
    
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
    // First, get the course to determine its type
    const course = await this.getCourseById(id);
    if (!course) {
      return false;
    }
    
    // Delete phase_content references (orphaned content)
    // This removes the course from all phases/rooms where it was assigned
    await db.delete(phaseContent).where(
      and(
        eq(phaseContent.contentId, id),
        eq(phaseContent.contentType, course.type as any)
      )
    );
    
    // Delete course categories associations
    await db.delete(courseCategories).where(eq(courseCategories.courseId, id));
    
    // Delete the course itself
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
  async getCourseCategories(courseId: string): Promise<string[]> {
    const result = await db.select({ categoryId: courseCategories.categoryId })
      .from(courseCategories)
      .where(eq(courseCategories.courseId, courseId));
    return result.map(r => r.categoryId).filter((id): id is string => id !== null);
  }
  
  async updateCourseCategories(courseId: string, categoryIds: string[]): Promise<void> {
    // Delete existing categories
    await db.delete(courseCategories).where(eq(courseCategories.courseId, courseId));
    
    // Insert new categories
    if (categoryIds.length > 0) {
      await db.insert(courseCategories).values(
        categoryIds.map(categoryId => ({
          courseId: courseId,
          categoryId: categoryId
        }))
      );
    }
  }

  async createContentNotification(data: { contentId: string; type: "guide" | "course" | "workshop"; title: string; description?: string }): Promise<{ id: string; contentId: string; type: string; title: string; description: string | null; createdAt: Date | null }> {
    const [row] = await db.insert(contentNotifications).values({
      contentId: data.contentId,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
    }).returning();
    if (!row) throw new Error("Failed to create content notification");
    return row;
  }

  async getContentNotifications(limit = 100): Promise<Array<{ id: string; contentId: string; type: string; title: string; description: string | null; createdAt: Date | null }>> {
    const rows = await db
      .select()
      .from(contentNotifications)
      .orderBy(desc(contentNotifications.createdAt))
      .limit(limit);
    return rows;
  }

  async getUserNotificationClearedAt(userId: string): Promise<Date | null> {
    const [row] = await db
      .select({ clearedAt: userNotificationCleared.clearedAt })
      .from(userNotificationCleared)
      .where(eq(userNotificationCleared.userId, userId))
      .limit(1);
    return row?.clearedAt ?? null;
  }

  async setUserNotificationClearedAt(userId: string): Promise<void> {
    await db
      .insert(userNotificationCleared)
      .values({ userId, clearedAt: new Date() })
      .onConflictDoUpdate({
        target: userNotificationCleared.userId,
        set: { clearedAt: new Date() },
      });
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
    const wasAlreadyCompleted = existingProgress.length > 0 && existingProgress[0].isCompleted;

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

    // Record event if this is a new completion
    if (!wasAlreadyCompleted) {
      try {
        const { recordEvent } = await import('./eventSystem');
        await recordEvent(userId, 'lesson_completed', {
          lessonId,
          courseId: lesson.courseId,
          lessonTitle: lesson.title,
        });
      } catch (error: any) {
        console.error('Error recording lesson_completed event:', error.message);
      }
    }

    // Update overall course progress
    if (lesson.courseId) {
      await this.updateCourseProgress(userId, lesson.courseId);
    }

    return lessonProgress;
  }

  async unmarkLessonComplete(userId: string, lessonId: string): Promise<boolean> {
    // First get the lesson to find the course ID
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Delete the progress record (or set isCompleted to false)
    const result = await db
      .update(userLessonProgress)
      .set({
        isCompleted: false,
        completedAt: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.lessonId, lessonId)
      ));

    // Update overall course progress
    if (lesson.courseId) {
      await this.updateCourseProgress(userId, lesson.courseId);
    }

    return (result.rowCount ?? 0) > 0;
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

  async resetCourseProgress(userId: string, courseId: string): Promise<void> {
    await db
      .update(userLessonProgress)
      .set({ isCompleted: false, completedAt: null, updatedAt: new Date() })
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.courseId, courseId)
      ));
    await this.updateCourseProgress(userId, courseId);
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

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(
        eq(subscriptionPlans.id, id),
        eq(subscriptionPlans.isActive, true)
      ));
    return plan;
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

  // Helper function to update user role based on subscription status
  async updateUserRoleBasedOnSubscription(userId: string): Promise<void> {
    try {
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      // Update role based on subscription
      if (activeSubscription && activeSubscription.status === 'active') {
        // User has active subscription -> paid_user
        await db
          .update(users)
          .set({ 
            role: 'paid_user',
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      } else {
        // No active subscription -> user (but don't downgrade if they're admin/instructor/moderator)
        const user = await this.getUser(userId);
        if (user && ['user', 'paid_user'].includes(user.role || 'user')) {
          await db
            .update(users)
            .set({ 
              role: 'user',
              updatedAt: new Date()
            })
            .where(eq(users.id, userId));
        }
      }
    } catch (error) {
      console.error('Error updating user role based on subscription:', error);
      // Don't throw - this is a background update
    }
  }

  async createUserSubscription(data: InsertUserSubscription): Promise<UserSubscription> {
    const [subscription] = await db
      .insert(userSubscriptions)
      .values(data)
      .returning();
    
    // Update user role if subscription is active
    if (subscription.status === 'active') {
      await this.updateUserRoleBasedOnSubscription(subscription.userId);
    }
    
    return subscription;
  }

  async updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [subscription] = await db
      .update(userSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    
    // Update user role if subscription status changed
    if (data.status !== undefined) {
      await this.updateUserRoleBasedOnSubscription(subscription.userId);
    }
    
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
    
    // Update user role after cancellation
    await this.updateUserRoleBasedOnSubscription(userId);
    
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

  // Onboarding responses operations
  async saveOnboardingResponse(data: InsertUserOnboardingResponse): Promise<UserOnboardingResponse> {
    // Check if user already has onboarding response
    const [existing] = await db
      .select()
      .from(userOnboardingResponses)
      .where(eq(userOnboardingResponses.userId, data.userId));

    if (existing) {
      // Update existing response
      const [updated] = await db
        .update(userOnboardingResponses)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(userOnboardingResponses.userId, data.userId))
        .returning();
      return updated;
    } else {
      // Create new response
      const [created] = await db
        .insert(userOnboardingResponses)
        .values(data)
        .returning();
      return created;
    }
  }

  async getUserOnboardingResponse(userId: string): Promise<UserOnboardingResponse | undefined> {
    const [response] = await db
      .select()
      .from(userOnboardingResponses)
      .where(eq(userOnboardingResponses.userId, userId));
    return response;
  }

  async getOnboardingAnalytics(): Promise<{
    totalResponses: number;
    experienceLevels: Record<string, number>;
    popularWorkAreas: Record<string, number>;
    popularLearningMethods: Record<string, number>;
    popularGoals: Record<string, number>;
    popularAiTools: Record<string, number>;
    recentResponses: UserOnboardingResponse[];
  }> {
    // Get all onboarding responses
    const responses = await db.select().from(userOnboardingResponses);
    
    // Calculate analytics
    const analytics = {
      totalResponses: responses.length,
      experienceLevels: {} as Record<string, number>,
      popularWorkAreas: {} as Record<string, number>,
      popularLearningMethods: {} as Record<string, number>,
      popularGoals: {} as Record<string, number>,
      popularAiTools: {} as Record<string, number>,
      recentResponses: [] as UserOnboardingResponse[],
    };

    // Process each response
    responses.forEach((response) => {
      // Count experience levels
      if (response.experienceLevel) {
        analytics.experienceLevels[response.experienceLevel] = 
          (analytics.experienceLevels[response.experienceLevel] || 0) + 1;
      }

      // Count work areas
      if (response.workAreas && Array.isArray(response.workAreas)) {
        response.workAreas.forEach((area: string) => {
          analytics.popularWorkAreas[area] = (analytics.popularWorkAreas[area] || 0) + 1;
        });
      }

      // Count learning methods
      if (response.learningMethods && Array.isArray(response.learningMethods)) {
        response.learningMethods.forEach((method: string) => {
          analytics.popularLearningMethods[method] = (analytics.popularLearningMethods[method] || 0) + 1;
        });
      }

      // Count goals
      if (response.goals && Array.isArray(response.goals)) {
        response.goals.forEach((goal: string) => {
          analytics.popularGoals[goal] = (analytics.popularGoals[goal] || 0) + 1;
        });
      }

      // Count AI tools
      if (response.aiTools && Array.isArray(response.aiTools)) {
        response.aiTools.forEach((tool: string) => {
          analytics.popularAiTools[tool] = (analytics.popularAiTools[tool] || 0) + 1;
        });
      }
    });

    // Get recent responses (last 10)
    analytics.recentResponses = await db
      .select()
      .from(userOnboardingResponses)
      .orderBy(desc(userOnboardingResponses.completedAt))
      .limit(10);

    return analytics;
  }

  async getAllOnboardingResponses(limit: number = 50, offset: number = 0): Promise<UserOnboardingResponse[]> {
    return await db
      .select()
      .from(userOnboardingResponses)
      .orderBy(desc(userOnboardingResponses.completedAt))
      .limit(limit)
      .offset(offset);
  }

  // ========================================
  // ROOMS & PHASES OPERATIONS
  // ========================================
  
  async getPublishedRooms(): Promise<Room[]> {
    return await db
      .select()
      .from(rooms)
      .where(eq(rooms.isPublished, true))
      .orderBy(rooms.order);
  }

  async getAllRooms(): Promise<Room[]> {
    return await db
      .select()
      .from(rooms)
      .orderBy(rooms.order);
  }

  async getRoomsByCourseCategory(categoryId: string): Promise<Room[]> {
    // Get rooms that contain courses with the specified category
    const roomsWithCategory = await db
      .selectDistinctOn([rooms.id])
      .from(rooms)
      .innerJoin(phases, eq(phases.roomId, rooms.id))
      .innerJoin(phaseContent, eq(phaseContent.phaseId, phases.id))
      .innerJoin(courses, and(
        eq(phaseContent.contentId, courses.id),
        eq(phaseContent.contentType, 'course')
      ))
      .where(and(
        eq(courses.categoryId, categoryId),
        eq(rooms.isPublished, true)
      ))
      .orderBy(rooms.order);

    return roomsWithCategory.map(row => row.rooms);
  }

  async getRoomById(id: string): Promise<Room | undefined> {
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id));
    return room;
  }

  async getRoomBySlug(slug: string): Promise<Room | undefined> {
    const [room] = await db
      .select()
      .from(rooms)
      .where(and(
        eq(rooms.slug, slug),
        eq(rooms.isPublished, true)
      ));
    return room;
  }

  async getRoomDetailWithPhases(slug: string, userId?: string): Promise<{
    room: Room;
    phases: Array<Phase & {
      isLocked: boolean;
      content: Array<PhaseContent & { courseData?: Course }>;
    }>;
    promoBanners: PromoBanner[];
    userHasAccess: boolean;
  } | undefined> {
    try {
      // Step 1: Get room (published first, then unpublished if admin)
      let room: Room | undefined = await this.getRoomBySlug(slug);
      let adminUser: any = undefined;
      
      // If not found and user is authenticated, check if admin can see unpublished
      if (!room && userId) {
        [adminUser, room] = await Promise.all([
          this.getAdminUser(userId).catch(() => undefined),
          db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1).then(r => r[0]).catch(() => undefined),
        ]);
        // Only use unpublished room if user is admin
        if (!adminUser || !room) {
          room = undefined;
        }
      }
      
      if (!room) return undefined;

      const now = new Date();
      
      // Step 2: Get phases, banners, and access checks in parallel
      const [phasesList, banners, accessChecks] = await Promise.all([
        // Get phases
        db
          .select()
          .from(phases)
          .where(eq(phases.roomId, room.id))
          .orderBy(phases.order),
        // Get promo banners
        this.getRoomPromoBanners(room.id),
        // Check user access (only if userId exists, reuse adminUser if we already have it)
        userId ? Promise.all([
          adminUser !== undefined 
            ? Promise.resolve(adminUser)
            : this.getAdminUser(userId).catch(() => undefined),
          this.checkUserAccess(userId, 'plan').catch(() => false),
          this.checkUserAccess(userId, 'room', room.id).catch(() => false),
        ]) : Promise.resolve([undefined, false, false]),
      ]);

      // Step 3: Determine user access
      let userHasAccess = false;
      if (userId) {
        const [admin, hasPlanAccess, hasRoomAccess] = accessChecks;
        userHasAccess = !!admin || (hasPlanAccess === true) || (hasRoomAccess === true);
      }

      // Step 4: Get all phase content in one query
      const allPhaseIds = phasesList.map(p => p.id);
      if (allPhaseIds.length === 0) {
        return {
          room,
          phases: [],
          promoBanners: banners,
          userHasAccess,
        };
      }

      // Get all content for all phases at once
      const allContent = await db
        .select()
        .from(phaseContent)
        .where(inArray(phaseContent.phaseId, allPhaseIds))
        .orderBy(phaseContent.order);

      // Step 5: Get all unique course IDs
      const courseIds = Array.from(new Set(
        allContent
          .filter(item => item.contentType === 'course' || item.contentType === 'workshop' || item.contentType === 'guide')
          .map(item => item.contentId)
      ));

      // Step 6: Get all courses and categories in parallel
      const [coursesData, courseCategoriesData] = await Promise.all([
        courseIds.length > 0
          ? db.select().from(courses).where(inArray(courses.id, courseIds))
          : Promise.resolve([]),
        courseIds.length > 0
          ? db
              .select({ courseId: courseCategories.courseId, categoryId: courseCategories.categoryId })
              .from(courseCategories)
              .where(inArray(courseCategories.courseId, courseIds))
          : Promise.resolve([]),
      ]);

      // Step 7: Create course map with categories
      const courseMap = new Map<string, Course>();
      for (const course of coursesData) {
        const courseCats = courseCategoriesData
          .filter(cc => cc.courseId === course.id)
          .map(cc => cc.categoryId);
        (course as any).categoryIds = courseCats;
        courseMap.set(course.id, course);
      }

      // Step 8: Group content by phase
      const contentByPhase = new Map<string, typeof allContent>();
      for (const content of allContent) {
        if (!contentByPhase.has(content.phaseId)) {
          contentByPhase.set(content.phaseId, []);
        }
        contentByPhase.get(content.phaseId)!.push(content);
      }

      // Step 9: Build phases with enriched content
      const phasesWithContent = phasesList.map((phase) => {
        const phaseContentList = contentByPhase.get(phase.id) || [];
        const enrichedContent = phaseContentList.map((item) => {
          if (item.contentType === 'course' || item.contentType === 'workshop' || item.contentType === 'guide') {
            const courseData = courseMap.get(item.contentId);
            return { ...item, courseData };
          }
          return item;
        });

        return {
          ...phase,
          isLocked: phase.releaseDate > now,
          content: enrichedContent,
        };
      });

      return {
        room,
        phases: phasesWithContent,
        promoBanners: banners,
        userHasAccess,
      };
    } catch (error) {
      console.error(`❌ Error in getRoomDetailWithPhases for slug "${slug}":`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error stack: ${error.stack?.split('\n').slice(0, 5).join('\n')}`);
      }
      throw error;
    }
  }

  async getRoomPromoBanners(roomId: string): Promise<PromoBanner[]> {
    return await db
      .select()
      .from(promoBanners)
      .where(and(
        eq(promoBanners.roomId, roomId),
        eq(promoBanners.isActive, true)
      ))
      .orderBy(promoBanners.order);
  }

  async getAllPromoBanners(roomId?: string): Promise<PromoBanner[]> {
    if (roomId) {
      return await db
        .select()
        .from(promoBanners)
        .where(eq(promoBanners.roomId, roomId))
        .orderBy(promoBanners.order);
    }
    return await db
      .select()
      .from(promoBanners)
      .orderBy(promoBanners.order);
  }

  async getPromoBannerById(id: string): Promise<PromoBanner | undefined> {
    const [banner] = await db
      .select()
      .from(promoBanners)
      .where(eq(promoBanners.id, id));
    return banner;
  }

  async createPromoBanner(data: InsertPromoBanner): Promise<PromoBanner> {
    const [banner] = await db
      .insert(promoBanners)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    return banner;
  }

  async updatePromoBanner(id: string, data: Partial<InsertPromoBanner>): Promise<PromoBanner> {
    const [banner] = await db
      .update(promoBanners)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(promoBanners.id, id))
      .returning();
    if (!banner) {
      throw new Error(`Banner con id ${id} no encontrado`);
    }
    return banner;
  }

  async deletePromoBanner(id: string): Promise<boolean> {
    const result = await db
      .delete(promoBanners)
      .where(eq(promoBanners.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPhaseContent(phaseId: string): Promise<Array<PhaseContent & { courseData?: Course }>> {
    const content = await db
      .select()
      .from(phaseContent)
      .where(eq(phaseContent.phaseId, phaseId))
      .orderBy(phaseContent.order);

    // Enrich with course data
    const enrichedContent = await Promise.all(
      content.map(async (item) => {
        if (item.contentType === 'course' || item.contentType === 'workshop' || item.contentType === 'guide') {
          const courseData = await this.getCourseById(item.contentId);
          return { ...item, courseData };
        }
        return item;
      })
    );

    return enrichedContent;
  }

  async getNextCourseInRoom(roomSlug: string, currentCourseId: string): Promise<{ courseId: string; slug?: string; title: string; coverImageUrl: string | null } | null> {
    // Get room
    const room = await this.getRoomBySlug(roomSlug);
    if (!room) return null;

    // Get all phases with content
    const phasesList = await db
      .select()
      .from(phases)
      .where(eq(phases.roomId, room.id))
      .orderBy(phases.order);

    // Flatten all courses in order
    const allCourses: Array<{ contentId: string; slug?: string; title: string; coverImageUrl: string | null }> = [];
    
    for (const phase of phasesList) {
      const content = await db
        .select()
        .from(phaseContent)
        .where(eq(phaseContent.phaseId, phase.id))
        .orderBy(phaseContent.order);

      for (const item of content) {
        if (item.contentType === 'course') {
          const courseData = await this.getCourseById(item.contentId);
          if (courseData) {
            allCourses.push({
              contentId: item.contentId,
              slug: courseData.slug || undefined,
              title: courseData.title,
              coverImageUrl: courseData.coverImageUrl,
            });
          }
        }
      }
    }

    // Find current course index and return next one
    const currentIndex = allCourses.findIndex(c => c.contentId === currentCourseId);
    if (currentIndex === -1 || currentIndex === allCourses.length - 1) {
      return null; // Current course not found or is last course
    }

    const nextCourse = allCourses[currentIndex + 1];
    return {
      courseId: nextCourse.contentId,
      slug: nextCourse.slug || undefined,
      title: nextCourse.title,
      coverImageUrl: nextCourse.coverImageUrl,
    };
  }

  async createRoom(data: InsertRoom): Promise<Room> {
    const [created] = await db.insert(rooms).values(data).returning();
    return created;
  }

  async updateRoom(id: string, data: UpdateRoom): Promise<Room> {
    const [updated] = await db
      .update(rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return updated;
  }

  async createPhase(data: InsertPhase): Promise<Phase> {
    const [created] = await db.insert(phases).values(data).returning();
    return created;
  }

  async updatePhase(id: string, data: Partial<InsertPhase>): Promise<Phase> {
    const [updated] = await db
      .update(phases)
      .set(data)
      .where(eq(phases.id, id))
      .returning();
    return updated;
  }

  async addContentToPhase(data: InsertPhaseContent): Promise<PhaseContent> {
    const [created] = await db.insert(phaseContent).values(data as any).returning();
    return created;
  }

  async removeContentFromPhase(id: string): Promise<boolean> {
    const result = await db.delete(phaseContent).where(eq(phaseContent.id, id));
    return true;
  }

  async getPhasesByRoom(roomId: string): Promise<Phase[]> {
    return await db
      .select()
      .from(phases)
      .where(eq(phases.roomId, roomId))
      .orderBy(phases.order);
  }

  async getPhaseContentByCourse(courseId: string, contentType: ContentType = 'course'): Promise<PhaseContent | undefined> {
    const [content] = await db
      .select()
      .from(phaseContent)
      .where(and(
        eq(phaseContent.contentId, courseId),
        eq(phaseContent.contentType, contentType)
      ))
      .limit(1);
    return content;
  }

  async getCourseRoomAssignment(
    courseId: string, 
    contentType: ContentType = 'course'
  ): Promise<{ phaseContentId: string; phaseId: string; roomId: string; contentType: ContentType } | undefined> {
    const [result] = await db
      .select({
        phaseContentId: phaseContent.id,
        phaseId: phaseContent.phaseId,
        roomId: phases.roomId,
        contentType: phaseContent.contentType,
      })
      .from(phaseContent)
      .innerJoin(phases, eq(phaseContent.phaseId, phases.id))
      .where(and(
        eq(phaseContent.contentId, courseId),
        eq(phaseContent.contentType, contentType)
      ))
      .limit(1);
    
    return result as any;
  }

  async upsertPhaseContentForCourse(
    courseId: string, 
    roomId: string | null | undefined,
    phaseId: string | null | undefined,
    contentType: ContentType = 'course'
  ): Promise<void> {
    // Remove existing phase assignments for this course
    await db
      .delete(phaseContent)
      .where(and(
        eq(phaseContent.contentId, courseId),
        eq(phaseContent.contentType, contentType)
      ));

    // If roomId and phaseId provided, create new assignment
    if (roomId && phaseId) {
      // Get current max order for this phase
      const existingContent = await db
        .select()
        .from(phaseContent)
        .where(eq(phaseContent.phaseId, phaseId))
        .orderBy(phaseContent.order);
      
      const nextOrder = existingContent.length > 0 
        ? Math.max(...existingContent.map(c => c.order)) + 1 
        : 0;

      await db.insert(phaseContent).values({
        phaseId,
        contentType,
        contentId: courseId,
        order: nextOrder,
      });
    }
  }

  // ========================================
  // ACCESS CONTROL OPERATIONS
  // ========================================

  async checkUserAccess(userId: string, accessType: string, accessId?: string): Promise<boolean> {
    const now = new Date();
    
    // Build conditions based on accessId
    const conditions = accessId
      ? and(
          eq(userAccess.userId, userId),
          eq(userAccess.accessType, accessType),
          eq(userAccess.accessId, accessId),
          eq(userAccess.isActive, true)
        )
      : and(
          eq(userAccess.userId, userId),
          eq(userAccess.accessType, accessType),
          eq(userAccess.isActive, true)
        );

    const [access] = await db
      .select()
      .from(userAccess)
      .where(conditions!)
      .limit(1);

    if (!access) return false;

    // Check if expired
    if (access.expiresAt && access.expiresAt < now) {
      return false;
    }

    return true;
  }

  async grantUserAccess(data: InsertUserAccess): Promise<UserAccess> {
    const [created] = await db.insert(userAccess).values(data).returning();
    return created;
  }

  async listActiveAccess(userId: string): Promise<UserAccess[]> {
    const now = new Date();
    return await db
      .select()
      .from(userAccess)
      .where(
        and(
          eq(userAccess.userId, userId),
          eq(userAccess.isActive, true)
        )
      );
  }

  async revokeUserAccess(userId: string, accessType: string, accessId?: string): Promise<boolean> {
    const conditions = accessId
      ? and(
          eq(userAccess.userId, userId),
          eq(userAccess.accessType, accessType),
          eq(userAccess.accessId, accessId)
        )
      : and(
          eq(userAccess.userId, userId),
          eq(userAccess.accessType, accessType)
        );

    await db
      .update(userAccess)
      .set({ isActive: false })
      .where(conditions!);
    
    return true;
  }

  // ========================================
  // PURCHASES OPERATIONS
  // ========================================

  async createPurchase(data: InsertPurchase): Promise<Purchase> {
    const [created] = await db.insert(purchases).values(data).returning();
    return created;
  }

  async updatePurchaseStatus(id: string, status: string, metadata?: any): Promise<Purchase> {
    const updateData: any = { status };
    if (metadata) {
      updateData.metadata = metadata;
    }

    const [updated] = await db
      .update(purchases)
      .set(updateData)
      .where(eq(purchases.id, id))
      .returning();
    
    return updated;
  }

  async listPurchasesForUser(userId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.purchasedAt));
  }

  async getPurchaseByStripeIntent(stripePaymentIntentId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.stripePaymentIntentId, stripePaymentIntentId));
    return purchase;
  }

  // ========================================
  // COMMENTS OPERATIONS
  // ========================================

  async getLessonComments(lessonId: string, userId?: string): Promise<Array<Comment & { 
    user: { firstName: string; lastName: string; profileImageUrl: string | null }; 
    isLikedByCurrentUser?: boolean;
    replies: Array<Comment & { user: { firstName: string; lastName: string; profileImageUrl: string | null }; isLikedByCurrentUser?: boolean }> 
  }>> {
    // Fetch all comments for the lesson with user data
    const allComments = await db
      .select({
        comment: comments,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.lessonId, lessonId))
      .orderBy(comments.createdAt);

    // Get liked comment IDs if userId is provided
    const likedCommentIds = userId ? await this.getUserLikedCommentIds(userId, lessonId) : new Set<string>();

    // Build nested structure: root comments with their replies
    const commentsMap = new Map<string, Comment & { 
      user: { firstName: string; lastName: string; profileImageUrl: string | null }; 
      isLikedByCurrentUser?: boolean;
      replies: any[] 
    }>();

    // First pass: create all comment objects
    allComments.forEach(({ comment, user }) => {
      commentsMap.set(comment.id, {
        ...comment,
        user: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          profileImageUrl: user?.profileImageUrl || null,
        },
        isLikedByCurrentUser: likedCommentIds.has(comment.id),
        replies: [],
      });
    });

    // Second pass: organize into tree structure
    const rootComments: any[] = [];
    commentsMap.forEach((comment) => {
      if (comment.parentCommentId) {
        // This is a reply - add it to its parent's replies array
        const parent = commentsMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        // This is a root comment
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  async createComment(data: Omit<InsertComment, 'depth' | 'replyCount' | 'rootCommentId' | 'metadata'> & { metadata?: any }): Promise<Comment> {
    // Root comments have depth 0 and no parent
    const [created] = await db
      .insert(comments)
      .values({
        ...data,
        depth: 0,
        replyCount: 0,
        rootCommentId: null,
        metadata: data.metadata || {},
      })
      .returning();

    // Update rootCommentId to point to itself (for root comments)
    const [updated] = await db
      .update(comments)
      .set({ rootCommentId: created.id })
      .where(eq(comments.id, created.id))
      .returning();

    return updated;
  }

  async createReply(parentCommentId: string, data: Omit<InsertComment, 'parentCommentId' | 'depth' | 'replyCount' | 'rootCommentId' | 'metadata'> & { metadata?: any }): Promise<Comment> {
    // Get parent comment to determine depth and rootCommentId
    const [parentComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parentCommentId));

    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const depth = (parentComment.depth || 0) + 1;
    const rootCommentId = parentComment.rootCommentId || parentComment.id;

    // Create the reply
    const [created] = await db
      .insert(comments)
      .values({
        ...data,
        parentCommentId,
        depth,
        replyCount: 0,
        rootCommentId,
        metadata: data.metadata || {},
      })
      .returning();

    // Update parent's reply count
    await db
      .update(comments)
      .set({ 
        replyCount: sql`${comments.replyCount} + 1` 
      })
      .where(eq(comments.id, parentCommentId));

    return created;
  }

  async markCommentReviewed(commentId: string): Promise<Comment> {
    const [updated] = await db
      .update(comments)
      .set({ isAdminReviewed: true })
      .where(eq(comments.id, commentId))
      .returning();

    if (!updated) {
      throw new Error('Comment not found');
    }

    return updated;
  }

  async deleteComment(commentId: string): Promise<void> {
    // First delete all likes for replies to this comment
    const repliesToDelete = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.parentCommentId, commentId));
    
    for (const reply of repliesToDelete) {
      await db
        .delete(commentLikes)
        .where(eq(commentLikes.commentId, reply.id));
    }
    
    // Delete all replies to this comment
    await db
      .delete(comments)
      .where(eq(comments.parentCommentId, commentId));
    
    // Delete likes for the comment itself
    await db
      .delete(commentLikes)
      .where(eq(commentLikes.commentId, commentId));
    
    // Finally delete the comment itself
    await db
      .delete(comments)
      .where(eq(comments.id, commentId));
  }

  async getCommentById(commentId: string): Promise<Comment | undefined> {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));
    
    return comment;
  }

  async getUnreadCommentCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.isAdminReviewed, false));

    return Number(result[0]?.count || 0);
  }

  async getAllComments(filter?: 'all' | 'pending' | 'reviewed'): Promise<Array<Comment & {
    user: { firstName: string; lastName: string; profileImageUrl: string | null };
    lesson: { id: string; title: string; courseId: string };
    course: { id: string; title: string };
    roomSlug: string | null;
  }>> {
    // First, get the room slug for each course using a subquery
    const roomSlugsSubquery = db
      .select({
        courseId: phaseContent.contentId,
        roomSlug: rooms.slug,
        phaseOrder: phases.order,
        contentOrder: phaseContent.order,
      })
      .from(phaseContent)
      .innerJoin(phases, eq(phaseContent.phaseId, phases.id))
      .innerJoin(rooms, eq(phases.roomId, rooms.id))
      .where(eq(phaseContent.contentType, 'course'))
      .orderBy(phases.order, phaseContent.order)
      .as('room_slugs');

    let query = db
      .select({
        comment: comments,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        lesson: {
          id: lessons.id,
          title: lessons.title,
          courseId: lessons.courseId,
        },
        course: {
          id: courses.id,
          title: courses.title,
        },
        roomSlug: roomSlugsSubquery.roomSlug,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(lessons, eq(comments.lessonId, lessons.id))
      .leftJoin(courses, eq(lessons.courseId, courses.id))
      .leftJoin(roomSlugsSubquery, eq(courses.id, roomSlugsSubquery.courseId))
      .orderBy(desc(comments.createdAt));

    if (filter === 'pending') {
      query = query.where(eq(comments.isAdminReviewed, false)) as any;
    } else if (filter === 'reviewed') {
      query = query.where(eq(comments.isAdminReviewed, true)) as any;
    }

    const result = await query;

    // Group by comment ID to get the first room slug (in case of duplicates)
    const commentMap = new Map<string, any>();
    
    for (const row of result) {
      const commentId = row.comment.id;
      if (!commentMap.has(commentId)) {
        commentMap.set(commentId, {
          ...row.comment,
          user: {
            firstName: row.user?.firstName || '',
            lastName: row.user?.lastName || '',
            profileImageUrl: row.user?.profileImageUrl || null,
          },
          lesson: {
            id: row.lesson?.id || '',
            title: row.lesson?.title || 'Lección eliminada',
            courseId: row.lesson?.courseId || '',
          },
          course: {
            id: row.course?.id || '',
            title: row.course?.title || 'Curso eliminado',
          },
          roomSlug: row.roomSlug || null,
        });
      }
    }

    return Array.from(commentMap.values());
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const [existingLike] = await db
      .select()
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, userId)
        )
      );

    if (existingLike) {
      await db
        .delete(commentLikes)
        .where(
          and(
            eq(commentLikes.commentId, commentId),
            eq(commentLikes.userId, userId)
          )
        );

      await db
        .update(comments)
        .set({ likeCount: sql`${comments.likeCount} - 1` })
        .where(eq(comments.id, commentId));

      const [updated] = await db
        .select({ likeCount: comments.likeCount })
        .from(comments)
        .where(eq(comments.id, commentId));

      return { liked: false, likeCount: updated?.likeCount || 0 };
    } else {
      await db
        .insert(commentLikes)
        .values({ commentId, userId });

      await db
        .update(comments)
        .set({ likeCount: sql`${comments.likeCount} + 1` })
        .where(eq(comments.id, commentId));

      const [updated] = await db
        .select({ likeCount: comments.likeCount })
        .from(comments)
        .where(eq(comments.id, commentId));

      return { liked: true, likeCount: updated?.likeCount || 0 };
    }
  }

  async getUserLikedCommentIds(userId: string, lessonId: string): Promise<Set<string>> {
    const likes = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .leftJoin(comments, eq(commentLikes.commentId, comments.id))
      .where(
        and(
          eq(commentLikes.userId, userId),
          eq(comments.lessonId, lessonId)
        )
      );

    return new Set(likes.map(like => like.commentId));
  }

  // Community chat methods
  async getAllCommunityChannels(): Promise<CommunityChannel[]> {
    try {
      const channels = await db
        .select()
        .from(communityChannels);
      return channels.sort((a, b) => {
        if (a.section !== b.section) {
          return a.section.localeCompare(b.section);
        }
        return (a.order || 0) - (b.order || 0);
      });
    } catch (error) {
      console.error("Error in getAllCommunityChannels:", error);
      throw error;
    }
  }

  async getChannelMessages(channelId: string, limit: number = 50): Promise<any[]> {
    const messages = await db
      .select({
        message: communityMessages,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(communityMessages)
      .leftJoin(users, eq(communityMessages.userId, users.id))
      .where(eq(communityMessages.channelId, channelId))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit);

    return messages.reverse();
  }

  async createCommunityMessage(channelId: string, userId: string, content: string): Promise<CommunityMessage> {
    const [message] = await db
      .insert(communityMessages)
      .values({ channelId, userId, content })
      .returning();

    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db
      .delete(communityMessages)
      .where(eq(communityMessages.id, messageId));
  }

  async pinMessage(messageId: string): Promise<CommunityMessage> {
    const [message] = await db
      .update(communityMessages)
      .set({ isPinned: true })
      .where(eq(communityMessages.id, messageId))
      .returning();

    return message;
  }

  async unpinMessage(messageId: string): Promise<CommunityMessage> {
    const [message] = await db
      .update(communityMessages)
      .set({ isPinned: false })
      .where(eq(communityMessages.id, messageId))
      .returning();

    return message;
  }

  // Community posts methods
  async getChannelPosts(channelId: string, limit: number = 50): Promise<any[]> {
    const posts = await db
      .select({
        post: communityPosts,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.channelId, channelId))
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit);

    return posts.reverse();
  }

  async getPostComments(postId: string): Promise<any[]> {
    const comments = await db
      .select({
        comment: communityPostComments,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(communityPostComments)
      .leftJoin(users, eq(communityPostComments.userId, users.id))
      .where(eq(communityPostComments.postId, postId))
      .orderBy(communityPostComments.createdAt);

    return comments;
  }

  async createCommunityPost(channelId: string, userId: string, title: string, content: string, imageUrl?: string): Promise<any> {
    const [post] = await db
      .insert(communityPosts)
      .values({ channelId, userId, title, content, imageUrl })
      .returning();

    return post;
  }

  async createPostComment(postId: string, userId: string, content: string): Promise<any> {
    const [comment] = await db
      .insert(communityPostComments)
      .values({ postId, userId, content })
      .returning();

    return comment;
  }

  async initializeCommunityChannels(): Promise<void> {
    // Core general channels
    const generalChannels = [
      { slug: 'anuncios', name: 'Anuncios', description: 'Actualizaciones y noticias importantes', icon: '📢', section: 'Comunidad', order: 1, isReadOnly: false },
      { slug: 'empieza-aqui', name: 'Empieza aquí', description: 'Guías y tutoriales de cómo usar la plataforma', icon: '🏠', section: 'Comunidad', order: 2, isReadOnly: true },
      { slug: 'presentante', name: 'Preséntate', description: 'Conoce a los miembros de la comunidad', icon: '👋', section: 'Comunidad', order: 3, isReadOnly: false },
      { slug: 'comparte-proyecto', name: 'Comparte tu proyecto o trabajo', description: 'Muestra tus proyectos y trabajos realizados', icon: '🚀', section: 'Comunidad', order: 4, isReadOnly: false },
      { slug: 'redes-chat', name: 'Redes de Chat', description: 'Enlaces y redes de comunicación de la comunidad', icon: '📝', section: 'Comunidad', order: 5, isReadOnly: false },
      { slug: 'leaderboard', name: 'Clasificación', description: 'Ranking de usuarios por puntos y participación', icon: '🏆', section: 'Comunidad', order: 6, isReadOnly: true },
    ];

    // Create general channels
    for (const channel of generalChannels) {
      const existing = await db.query.communityChannels.findFirst({
        where: eq(communityChannels.slug, channel.slug),
      });
      if (!existing) {
        await db.insert(communityChannels).values(channel);
      }
    }

    const questionChannel = await db.query.communityChannels.findFirst({
      where: eq(communityChannels.slug, 'haz-tu-pregunta'),
    });
    if (!questionChannel) {
      const generalChannel = await db.query.communityChannels.findFirst({
        where: eq(communityChannels.slug, 'general'),
      });
      const nextOrder = (generalChannel?.order ?? 6) + 1;
      await db.insert(communityChannels).values({
        slug: 'haz-tu-pregunta',
        name: 'Haz tu Pregunta',
        description: 'Preguntas sobre las guías y el contenido',
        icon: '❓',
        section: 'Comunidad',
        order: nextOrder,
        isReadOnly: false,
      });
    }

    // Create dynamic channels for each room (sala)
    const allRooms = await db.select().from(rooms);
    for (const room of allRooms) {
      const channelSlug = `dudas-${room.slug}`;
      const existing = await db.query.communityChannels.findFirst({
        where: eq(communityChannels.slug, channelSlug),
      });
      if (!existing) {
        await db.insert(communityChannels).values({
          slug: channelSlug,
          name: `Dudas - ${room.title}`,
          description: `Preguntas y dudas del curso: ${room.title}`,
          icon: '❓',
          section: 'Cursos de Salas',
          order: 1,
          isActive: true,
        });
      }
    }
  }
}

// Export storage instance
export const storage = new DatabaseStorage();