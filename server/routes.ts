import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAuth, AuthenticatedRequest } from "./supabaseAuth";
import { setupSupabaseAuthRoutes } from "./supabaseAuthRoutes";
import { isAdmin } from "./adminMiddleware";
import { insertCommentSchema } from "@shared/schema";
import { sendNewCommentNotification, getAdminNotificationEmails } from "./emailNotifications";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Supabase authentication routes
  setupSupabaseAuthRoutes(app);

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Debug endpoint to clear bad tokens
  app.post('/api/debug/clear-auth', (req, res) => {
    res.json({ 
      message: 'Clear localStorage authToken on client side',
      instructions: 'Run: localStorage.removeItem("authToken"); location.reload();'
    });
  });

  // Essential app routes
  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get all guides
  app.get("/api/guides", async (req, res) => {
    try {
      const guides = await storage.getAllGuides();
      console.log('Guides from storage:', guides.length, guides);
      res.json(guides);
    } catch (error) {
      console.error("Error fetching guides:", error);
      res.status(500).json({ message: "Failed to fetch guides" });
    }
  });

  // Get all workshops
  app.get("/api/workshops", async (req, res) => {
    try {
      const workshops = await storage.getAllWorkshops();
      res.json(workshops);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      res.status(500).json({ message: "Failed to fetch workshops" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get user progress (authenticated)
  app.get("/api/user-progress", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Get recent activity (authenticated)
  app.get("/api/user-recent-activity", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const activity = await storage.getUserRecentCourses(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Save onboarding responses (authenticated)
  app.post("/api/onboarding/submit", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { experienceLevel, workAreas, learningMethods, goals, aiTools, mainGoal } = req.body;

      const onboardingData = {
        userId,
        experienceLevel,
        workAreas: workAreas || [],
        learningMethods: learningMethods || [],
        goals: goals || [],
        aiTools: aiTools || [],
        mainGoal,
      };

      const response = await storage.saveOnboardingResponse(onboardingData);
      res.json(response);
    } catch (error) {
      console.error("Error saving onboarding response:", error);
      res.status(500).json({ message: "Failed to save onboarding response" });
    }
  });

  // Get user onboarding response (authenticated)
  app.get("/api/onboarding/response", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const response = await storage.getUserOnboardingResponse(userId);
      res.json(response || null);
    } catch (error) {
      console.error("Error fetching onboarding response:", error);
      res.status(500).json({ message: "Failed to fetch onboarding response" });
    }
  });

  // Admin onboarding analytics (authenticated admin only - check simple-routes.ts for proper admin auth)
  app.get("/api/admin/onboarding/analytics", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // TODO: Add proper admin check when integrating with admin middleware
      const analytics = await storage.getOnboardingAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching onboarding analytics:", error);
      res.status(500).json({ message: "Failed to fetch onboarding analytics" });
    }
  });

  // Admin get all onboarding responses (authenticated admin only)
  app.get("/api/admin/onboarding/responses", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // TODO: Add proper admin check when integrating with admin middleware
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const responses = await storage.getAllOnboardingResponses(limit, offset);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching onboarding responses:", error);
      res.status(500).json({ message: "Failed to fetch onboarding responses" });
    }
  });

  // ========================================
  // ROOMS & PHASES ROUTES
  // ========================================

  // Get all published rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getPublishedRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Get room detail with phases (public, but includes user access if authenticated)
  app.get("/api/rooms/:slug", async (req: AuthenticatedRequest, res) => {
    try {
      const { slug } = req.params;
      const userId = req.user?.id; // Optional userId if authenticated
      
      const roomDetail = await storage.getRoomDetailWithPhases(slug, userId);
      
      if (!roomDetail) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(roomDetail);
    } catch (error) {
      console.error("Error fetching room detail:", error);
      res.status(500).json({ message: "Failed to fetch room detail" });
    }
  });

  // ========================================
  // ACCESS CONTROL ROUTES
  // ========================================

  // Get user's active access grants (authenticated)
  app.get("/api/access", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const access = await storage.listActiveAccess(userId);
      res.json(access);
    } catch (error) {
      console.error("Error fetching user access:", error);
      res.status(500).json({ message: "Failed to fetch user access" });
    }
  });

  // Check if user has access to specific content (authenticated)
  app.get("/api/access/check", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { accessType, accessId } = req.query;

      if (!accessType || typeof accessType !== 'string') {
        return res.status(400).json({ message: "accessType is required" });
      }

      const hasAccess = await storage.checkUserAccess(
        userId, 
        accessType, 
        accessId as string | undefined
      );

      res.json({ hasAccess });
    } catch (error) {
      console.error("Error checking user access:", error);
      res.status(500).json({ message: "Failed to check user access" });
    }
  });

  // ========================================
  // PURCHASES ROUTES (Stripe integration will be added later)
  // ========================================

  // Get user's purchases (authenticated)
  app.get("/api/purchases", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const purchases = await storage.listPurchasesForUser(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // ========================================
  // COMMENTS ROUTES
  // ========================================

  // Get all comments for a lesson (authenticated)
  app.get("/api/lessons/:lessonId/comments", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user!.id;

      // TODO: Add lesson access check
      // const lesson = await storage.getLessonById(lessonId);
      // if (!lesson) return res.status(404).json({ message: "Lesson not found" });
      // Verify user has access to the course containing this lesson

      const comments = await storage.getLessonComments(lessonId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching lesson comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create a new root comment on a lesson (authenticated)
  app.post("/api/lessons/:lessonId/comments", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user!.id;

      // Validate request body
      const validationSchema = insertCommentSchema.omit({
        isAdminReviewed: true,
        parentCommentId: true,
      });
      const validatedData = validationSchema.parse({
        ...req.body,
        lessonId,
        userId,
      });

      const comment = await storage.createComment(validatedData);

      // Send email notification (non-blocking)
      const lesson = lessonId ? await storage.getLessonById(lessonId) : null;
      const course = lesson?.courseId ? await storage.getCourseById(lesson.courseId) : null;
      
      if (lesson && course) {
        getAdminNotificationEmails().then(async (adminEmails) => {
          if (adminEmails.length > 0) {
            await sendNewCommentNotification({
              commentId: comment.id,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              courseTitle: course.title,
              authorName: `${req.user!.firstName} ${req.user!.lastName}`,
              commentContent: comment.content,
              recipientEmails: adminEmails,
              isReply: false,
            });
          }
        }).catch(err => console.error('Failed to send notification:', err));
      }

      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Reply to a comment (authenticated)
  app.post("/api/comments/:id/replies", supabaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id: parentCommentId } = req.params;
      const userId = req.user!.id;

      // Validate request body
      const validationSchema = insertCommentSchema.omit({
        isAdminReviewed: true,
        parentCommentId: true,
      });
      const validatedData = validationSchema.parse({
        ...req.body,
        userId,
      });

      const reply = await storage.createReply(parentCommentId, validatedData);

      // Send email notification (non-blocking)
      const lesson = validatedData.lessonId ? await storage.getLessonById(validatedData.lessonId) : null;
      const course = lesson?.courseId ? await storage.getCourseById(lesson.courseId) : null;
      const parentComment = await storage.getCommentById(parentCommentId);
      
      if (lesson && course) {
        getAdminNotificationEmails().then(async (adminEmails) => {
          const recipientEmails = [...adminEmails];
          
          // Also notify the parent comment author if it's not the same user
          if (parentComment && parentComment.userId !== userId) {
            const parentAuthor = await storage.getUser(parentComment.userId);
            if (parentAuthor?.email) {
              recipientEmails.push(parentAuthor.email);
            }
          }

          if (recipientEmails.length > 0) {
            await sendNewCommentNotification({
              commentId: reply.id,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              courseTitle: course.title,
              authorName: `${req.user!.firstName} ${req.user!.lastName}`,
              commentContent: reply.content,
              recipientEmails: recipientEmails,
              isReply: true,
              parentAuthorEmail: parentComment?.userId ? (await storage.getUser(parentComment.userId))?.email : undefined,
            });
          }
        }).catch(err => console.error('Failed to send notification:', err));
      }

      res.status(201).json(reply);
    } catch (error: any) {
      console.error("Error creating reply:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid reply data", errors: error.errors });
      }
      if (error.message === 'Parent comment not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Mark comment as reviewed (admin only)
  app.patch("/api/comments/:id/review", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id: commentId } = req.params;

      const updated = await storage.markCommentReviewed(commentId);
      res.json(updated);
    } catch (error: any) {
      console.error("Error marking comment as reviewed:", error);
      if (error.message === 'Comment not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to mark comment as reviewed" });
    }
  });

  // Get unread comment count (admin only)
  app.get("/api/admin/comments/unread-count", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const count = await storage.getUnreadCommentCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread comment count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Get all comments with filters (admin only)
  app.get("/api/admin/comments", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const filter = (req.query.filter as 'all' | 'pending' | 'reviewed') || 'all';
      const comments = await storage.getAllComments(filter);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching admin comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}