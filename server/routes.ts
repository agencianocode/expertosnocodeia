import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAuth, AuthenticatedRequest } from "./supabaseAuth";
import { setupSupabaseAuthRoutes } from "./supabaseAuthRoutes";
import { isAdmin } from "./adminMiddleware";
import { insertCommentSchema } from "@shared/schema";
import { sendNewCommentNotification, getAdminNotificationEmails } from "./emailNotifications";
import { db, pool } from "./db";
import { communityChannels, communityMessages, liveEvents } from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

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
      const activity = await storage.getUserRecentContent(userId);
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
      
      // Record onboarding_completed event
      try {
        const { recordEvent } = await import('./eventSystem');
        await recordEvent(userId, 'onboarding_completed', {
          experienceLevel,
          mainGoal,
        });
      } catch (error: any) {
        console.error('Error recording onboarding_completed event:', error.message);
      }

      // Get personalized recommendations
      let recommendations = null;
      try {
        const { getPersonalizedRecommendations } = await import('./onboardingPersonalization');
        recommendations = await getPersonalizedRecommendations(userId);
      } catch (error: any) {
        console.error('Error getting personalized recommendations:', error.message);
      }
      
      res.json({ 
        ...response, 
        recommendations 
      });
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

  // Admin onboarding analytics (authenticated admin only)
  app.get("/api/admin/onboarding/analytics", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const analytics = await storage.getOnboardingAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching onboarding analytics:", error);
      res.status(500).json({ message: "Failed to fetch onboarding analytics" });
    }
  });

  // Admin get all onboarding responses (authenticated admin only)
  app.get("/api/admin/onboarding/responses", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
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

      console.log("📝 Creating comment - userId:", userId, "lessonId:", lessonId);
      console.log("📝 Request body:", req.body);

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

      console.log("✅ Validated data:", validatedData);

      const comment = await storage.createComment(validatedData);
      console.log("✅ Comment created:", comment);

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

  // Community chat routes
  app.get("/api/community/channels", async (req, res) => {
    try {
      const channels = await db.select().from(communityChannels);
      const sorted = channels.sort((a: any, b: any) => {
        if (a.section !== b.section) return a.section.localeCompare(b.section);
        return (a.order || 0) - (b.order || 0);
      });
      res.json(sorted);
    } catch (error: any) {
      console.error("Error fetching community channels:", error);
      res.status(500).json({ message: "Failed to fetch channels", error: error.message });
    }
  });

  app.get("/api/community/channels/:channelId/messages", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getChannelMessages(channelId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/community/channels/:channelId/messages", async (req: AuthenticatedRequest, res) => {
    try {
      const { channelId } = req.params;
      const { content } = req.body;
      
      // Get user from session or request (from supabaseAuthRoutes setup)
      const userId = req.user?.id || (req as any).user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Autenticación requerida" });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const message = await storage.createCommunityMessage(channelId, userId, content);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // ============================================
  // LIVE EVENTS ROUTES
  // ============================================
  
  // Initialize live_events table if it doesn't exist
  const initLiveEventsTable = async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS live_events (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR NOT NULL,
          description TEXT,
          host_name VARCHAR NOT NULL,
          host_avatar VARCHAR,
          host_role VARCHAR,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          timezone VARCHAR DEFAULT 'America/Bogota',
          is_active BOOLEAN DEFAULT true,
          is_live BOOLEAN DEFAULT false,
          join_url VARCHAR,
          room_name VARCHAR,
          event_type VARCHAR DEFAULT 'live',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("✅ live_events table initialized");
    } catch (error: any) {
      // Table might already exist, that's fine
      if (!error.message?.includes('already exists')) {
        console.error("❌ Error creating live_events table:", error.message);
        console.error("Error details:", error);
      } else {
        console.log("✅ live_events table already exists");
      }
    }
  };
  
  // Initialize table on startup
  initLiveEventsTable();
  
  // Get all events (for calendar)
  app.get("/api/events", async (req, res) => {
    try {
      const events = await db.select().from(liveEvents)
        .where(eq(liveEvents.isActive, true))
        .orderBy(desc(liveEvents.startTime));
      
      // Transform to calendar format
      const calendarEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        date: event.startTime?.toISOString().split('T')[0],
        type: event.eventType,
        startTime: event.startTime,
        endTime: event.endTime,
        hostName: event.hostName,
        isLive: event.isLive,
      }));
      
      res.json(calendarEvents);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events", error: error.message });
    }
  });

  // Get current live event (for community sidebar widget)
  app.get("/api/community/live-event", async (req, res) => {
    try {
      const now = new Date();
      
      // Find event that is either:
      // 1. Manually marked as live (isLive = true)
      // 2. Currently within the scheduled time window
      const events = await db.select().from(liveEvents)
        .where(eq(liveEvents.isActive, true))
        .orderBy(desc(liveEvents.startTime));
      
      // First check for manually live events
      let liveEvent = events.find(e => e.isLive === true);
      
      // If no manual live, check for events within time window
      if (!liveEvent) {
        liveEvent = events.find(e => {
          if (!e.startTime || !e.endTime) return false;
          const start = new Date(e.startTime);
          const end = new Date(e.endTime);
          return now >= start && now <= end;
        });
      }
      
      if (liveEvent) {
        res.json({
          id: liveEvent.id,
          title: liveEvent.title,
          hostName: liveEvent.hostName,
          hostAvatar: liveEvent.hostAvatar,
          hostRole: liveEvent.hostRole,
          joinUrl: liveEvent.joinUrl || `/live/${liveEvent.id}`,
          isLive: true,
          startTime: liveEvent.startTime,
          endTime: liveEvent.endTime,
        });
      } else {
        res.json({ isLive: false });
      }
    } catch (error: any) {
      console.error("Error fetching live event:", error);
      res.status(500).json({ message: "Failed to fetch live event", error: error.message });
    }
  });

  // Get specific live event details
  app.get("/api/community/live-event/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const [event] = await db.select().from(liveEvents)
        .where(eq(liveEvents.id, eventId));
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({
        id: event.id,
        title: event.title,
        description: event.description,
        hostName: event.hostName,
        hostAvatar: event.hostAvatar,
        hostRole: event.hostRole,
        joinUrl: event.joinUrl || `/live/${event.id}`,
        roomName: event.roomName || `ExpertosNoCodeIA-${event.id}`,
        isLive: event.isLive,
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        participants: [], // Will be populated by Jitsi
      });
    } catch (error: any) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Failed to fetch event", error: error.message });
    }
  });

  // Admin routes for managing live events
  app.get("/api/admin/live-events", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const events = await db.select().from(liveEvents)
        .orderBy(desc(liveEvents.startTime));
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ message: "Failed to fetch events", error: error.message });
    }
  });

  app.post("/api/admin/live-events", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
      // Ensure we always return JSON
      res.setHeader('Content-Type', 'application/json');
      
      const { title, description, hostName, hostAvatar, hostRole, startTime, endTime, eventType, joinUrl } = req.body;
      
      console.log("📝 Creating event with data:", { title, hostName, startTime, endTime, eventType });
      
      if (!title || !hostName || !startTime || !endTime) {
        console.log("❌ Missing required fields");
        return res.status(400).json({ message: "Title, hostName, startTime and endTime are required" });
      }
      
      // Validate dates
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      if (endDate <= startDate) {
        return res.status(400).json({ message: "End time must be after start time" });
      }
      
      console.log("💾 Inserting event into database...");
      const [newEvent] = await db.insert(liveEvents).values({
        title,
        description,
        hostName,
        hostAvatar,
        hostRole,
        startTime: startDate,
        endTime: endDate,
        eventType: eventType || 'live',
        joinUrl,
        isActive: true,
        isLive: false,
      }).returning();
      
      console.log("✅ Event created successfully:", newEvent);
      res.status(201).json(newEvent);
    } catch (error: any) {
      console.error("❌ Error creating event:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      // Ensure we return JSON even on error
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create event", error: error.message || "Unknown error" });
      } else {
        next(error);
      }
    }
  });

  app.patch("/api/admin/live-events/:eventId", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { eventId } = req.params;
      const updates = req.body;
      
      // Convert date strings to Date objects if present
      if (updates.startTime) updates.startTime = new Date(updates.startTime);
      if (updates.endTime) updates.endTime = new Date(updates.endTime);
      updates.updatedAt = new Date();
      
      const [updated] = await db.update(liveEvents)
        .set(updates)
        .where(eq(liveEvents.id, eventId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event", error: error.message });
    }
  });

  // Toggle live status
  app.post("/api/admin/live-events/:eventId/toggle-live", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { eventId } = req.params;
      
      const [event] = await db.select().from(liveEvents)
        .where(eq(liveEvents.id, eventId));
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // If we're setting this event to live, turn off other live events first
      if (!event.isLive) {
        await db.update(liveEvents)
          .set({ isLive: false })
          .where(eq(liveEvents.isLive, true));
      }
      
      const [updated] = await db.update(liveEvents)
        .set({ isLive: !event.isLive, updatedAt: new Date() })
        .where(eq(liveEvents.id, eventId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling live status:", error);
      res.status(500).json({ message: "Failed to toggle live status", error: error.message });
    }
  });

  app.delete("/api/admin/live-events/:eventId", supabaseAuth, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { eventId } = req.params;
      
      await db.delete(liveEvents).where(eq(liveEvents.id, eventId));
      
      res.json({ message: "Event deleted" });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event", error: error.message });
    }
  });

  // Initialize channels on startup
  storage.initializeCommunityChannels().catch(err => console.error("Error initializing channels:", err));

  const httpServer = createServer(app);
  return httpServer;
}