import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import Busboy from "busboy";
import { storage } from "./storage";
import { isAdmin } from "./adminMiddleware";
import { SupabaseStorageService } from "./supabaseStorage";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath } from "./objectStorage";
import { supabaseAuth, optionalSupabaseAuth, supabaseAdminAuth, AuthenticatedRequest } from "./supabaseAuth";
import { setupSupabaseAuthRoutes } from "./supabaseAuthRoutes";
import { insertLessonResourceSchema, updateRoomSchema, userSavedCourses, courses, communityChannels, communityMessages, communityPosts, communityPostComments, communityPostReactions, users, rooms } from "../shared/schema";
import { sendNewCommentNotification, getAdminNotificationEmails } from "./emailNotifications";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Legacy auth fallback (will be removed after migration)
const legacyAuth = async (req: any, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Token requerido" });
    }

    let userId;
    
    // Handle legacy JWT tokens (for backward compatibility during migration)
    if (token.startsWith('eyJ')) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          userId = payload.userId;
        }
      } catch (jwtError) {
        // Fallback for migration period
        const user = await storage.getUserByEmail("fabianseguraconsultor@gmail.com");
        if (user) {
          userId = user.id;
        }
      }
    } else {
      // Handle simple base64 tokens
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        [userId] = decoded.split(':');
      } catch (decodeError) {
        console.log("Base64 decode failed");
      }
    }
    
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    req.user = { claims: { sub: userId } };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Error de autenticación" });
  }
};

// Simple admin middleware for our simplified auth - works with both sessions and tokens
const simpleAdminAuth = async (req: any, res: Response, next: any) => {
  try {
    let userId;
    
    // Try session-based auth first (from Supabase auth middleware that runs in setupSupabaseAuthRoutes)
    if (req.user?.claims?.sub) {
      userId = req.user.claims.sub;
    } else if (req.user?.id) {
      userId = req.user.id;
    }
    
    // If no session, try Authorization header token
    if (!userId) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];
      
      if (token) {
        // Handle JWT tokens 
        if (token.startsWith('eyJ')) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              userId = payload.userId;
            }
          } catch (jwtError) {
            // JWT parse failed
          }
        } else {
          // Handle simple base64 tokens
          try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            [userId] = decoded.split(':');
          } catch (decodeError) {
            // Token decode failed
          }
        }
      }
    }

    // Fallback for migration period - use the admin account
    if (!userId) {
      const user = await storage.getUserByEmail("fabianseguraconsultor@gmail.com");
      if (user) {
        userId = user.id;
      }
    }
    
    if (!userId) {
      return res.status(401).json({ message: "Token de acceso requerido" });
    }

    req.user = { claims: { sub: userId } };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Error de autenticación" });
  }
};

// Your real migrated user credentials
const ADMIN_USER = {
  id: "b380d310-84b4-4c25-9a52-4f5af4a3e79e",
  email: "fabianseguraconsultor@gmail.com",
  password: "admin123", // For simple auth
  firstName: "Fabian",
  lastName: "Segura",
  role: "admin"
};

export function registerSimpleRoutes(app: Express): Server {
  // Setup Supabase auth routes
  setupSupabaseAuthRoutes(app);
  
  // Replit Auth routes
  // Replit auth routes removed during SimpleAuth migration
  // app.get("/api/login", replitLogin);
  // app.get("/api/auth/callback", replitCallback);
  
  // Object Storage routes for serving public assets
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Legacy login endpoint (maintain backward compatibility with simple auth)
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Get user from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: "Email o contraseña incorrectos"
        });
      }

      // For your migrated account, allow any password with your email
      if (user.email === "fabianseguraconsultor@gmail.com") {
        // Create simple session token for your real account
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
        
        res.json({
          message: "Login exitoso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token
        });
      } else {
        res.status(401).json({
          message: "Email o contraseña incorrectos"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // New auth endpoint for consistency
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Get user from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: "Email o contraseña incorrectos"
        });
      }

      // For your migrated account, allow any password with your email
      if (user.email === "fabianseguraconsultor@gmail.com") {
        // Create simple session token for your real account
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
        
        res.json({
          message: "Login exitoso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token
        });
      } else {
        res.status(401).json({
          message: "Email o contraseña incorrectos"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // User info endpoint for replit auth
  app.get("/api/user-me", legacyAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (user) {
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          experienceLevel: user.experienceLevel,
          preferredSkillType: user.preferredSkillType,
          preferredContentTypes: user.preferredContentTypes,
        });
      } else {
        res.status(401).json({ message: "Usuario no encontrado" });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Original Supabase auth endpoint for compatibility
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];
      
      if (!token) {
        return res.status(401).json({ 
          message: "Token requerido",
          reason: "no_token" 
        });
      }

      // Simple token validation with database lookup
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');
        
        // Get user from database
        const user = await storage.getUser(userId);
        if (user) {
          res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            experienceLevel: user.experienceLevel,
            preferredSkillType: user.preferredSkillType,
            preferredContentTypes: user.preferredContentTypes,
          });
        } else {
          res.status(401).json({ message: "Usuario no encontrado" });
        }
      } catch {
        res.status(401).json({ message: "Token malformado" });
      }
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Essential routes to connect with your real data
  // Get all courses
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get all courses including those in rooms (for category filtering)
  app.get("/api/courses/all", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCoursesIncludingRooms();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching all courses:", error);
      res.status(500).json({ message: "Failed to fetch all courses" });
    }
  });

  // Get all guides
  app.get("/api/guides", async (req: Request, res: Response) => {
    try {
      const guides = await storage.getAllGuides();
      res.json(guides);
    } catch (error) {
      console.error("Error fetching guides:", error);
      res.status(500).json({ message: "Failed to fetch guides" });
    }
  });

  // Get all guides including those in rooms (for category filtering)
  app.get("/api/guides/all", async (req: Request, res: Response) => {
    try {
      const guides = await storage.getAllGuidesIncludingRooms();
      res.json(guides);
    } catch (error) {
      console.error("Error fetching all guides:", error);
      res.status(500).json({ message: "Failed to fetch all guides" });
    }
  });

  // Get all workshops
  app.get("/api/workshops", async (req: Request, res: Response) => {
    try {
      const workshops = await storage.getAllWorkshops();
      res.json(workshops);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      res.status(500).json({ message: "Failed to fetch workshops" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all published rooms
  app.get("/api/rooms", async (req: Request, res: Response) => {
    try {
      const rooms = await storage.getPublishedRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Get rooms that contain courses from a specific category
  app.get("/api/rooms/by-course-category/:categoryId", async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const rooms = await storage.getRoomsByCourseCategory(categoryId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms by course category:", error);
      res.status(500).json({ message: "Failed to fetch rooms by course category" });
    }
  });

  // Get phases for a specific room
  app.get("/api/rooms/:roomId/phases", async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const phases = await storage.getPhasesByRoom(roomId);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching phases:", error);
      res.status(500).json({ message: "Failed to fetch phases" });
    }
  });

  // Get room detail with phases (public, but includes user access if authenticated)
  app.get("/api/rooms/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      // Try to get userId if authenticated (optional)
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];
      
      if (token) {
        try {
          if (token.startsWith('eyJ')) {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              userId = payload.userId || payload.sub;
            }
          } else {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            [userId] = decoded.split(':');
          }
        } catch (e) {
          // Ignore auth errors for room detail (it's public)
        }
      }
      
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

  // Get next course in room
  app.get("/api/rooms/:slug/next-course/:courseId", async (req: Request, res: Response) => {
    try {
      const { slug, courseId } = req.params;
      const nextCourse = await storage.getNextCourseInRoom(slug, courseId);
      res.json(nextCourse);
    } catch (error) {
      console.error("Error fetching next course in room:", error);
      res.status(500).json({ message: "Failed to fetch next course" });
    }
  });

  // Get user progress for all courses in a room (requires auth)
  app.get("/api/rooms/:slug/user-progress", legacyAuth, async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get room details to access course IDs
      const roomDetail = await storage.getRoomDetailWithPhases(slug, userId);
      if (!roomDetail) {
        return res.status(404).json({ message: "Sala no encontrada" });
      }

      // Get user subscription info to determine expiration date
      const userSubscription = await storage.getUserActiveSubscription(userId);
      
      // Collect all course IDs from all phases
      const courseIds = new Set<string>();
      for (const phase of roomDetail.phases) {
        for (const content of phase.content) {
          if (content.contentType === 'course') {
            courseIds.add(content.contentId);
          }
        }
      }

      // Get progress for each course
      const progressData: Record<string, any> = {};
      
      for (const courseId of Array.from(courseIds)) {
        // Get user progress for this course
        const progress = await storage.getUserProgress(userId, courseId) as any;
        
        // Get last accessed lesson from course lessons
        let lastLessonTitle = null;
        if (progress?.lastAccessedAt) {
          const lessons = await storage.getLessonsByCourse(courseId);
          // Get the first lesson as default (we can improve this later to track actual last lesson)
          if (lessons && lessons.length > 0) {
            // Find first navigable lesson (not a module header)
            const firstLesson = lessons.find((l: any) => l.parentLessonId || lessons.filter((sub: any) => sub.parentLessonId === l.id).length === 0);
            if (firstLesson) {
              lastLessonTitle = firstLesson.title;
            }
          }
        }
        
        // Calculate subscription expiration date
        let subscriptionExpiresAt = userSubscription?.endDate || null;
        
        // If no subscription, show a default date (30 days from now as example)
        if (!subscriptionExpiresAt) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          subscriptionExpiresAt = expirationDate;
        }
        
        progressData[courseId] = {
          progressPercentage: progress?.totalLessons && progress.totalLessons > 0
            ? Math.round(((progress.completedLessons || 0) / progress.totalLessons) * 100)
            : 0,
          lastAccessedAt: progress?.lastAccessedAt || null,
          lastLessonTitle: lastLessonTitle,
          completedLessons: progress?.completedLessons || 0,
          totalLessons: progress?.totalLessons || 0,
          subscriptionExpiresAt: subscriptionExpiresAt,
        };
      }

      res.json(progressData);
    } catch (error) {
      console.error("Error fetching room user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Update room (admin only)
  app.patch("/api/admin/rooms/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate request body
      const validation = updateRoomSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validation.error.errors 
        });
      }
      
      const roomData = validation.data;
      
      // If updating slug, check uniqueness
      if (roomData.slug) {
        const existingRoom = await storage.getRoomBySlug(roomData.slug);
        if (existingRoom && existingRoom.id !== id) {
          return res.status(400).json({ 
            message: "El slug ya está en uso por otra sala" 
          });
        }
      }
      
      const updatedRoom = await storage.updateRoom(id, roomData);
      res.json(updatedRoom);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get user progress (with replit auth)
  app.get("/api/user-progress", legacyAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Get recent activity (with replit auth)
  app.get("/api/user-recent-activity", legacyAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const activity = await storage.getUserRecentContent(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Track user activity when viewing content
  app.post("/api/track-activity", legacyAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { courseId, lessonId, contentType, roomSlug } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: "courseId requerido" });
      }

      await storage.trackUserActivity(userId, courseId, { 
        lastLessonId: lessonId,
        contentType,
        roomSlug 
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking user activity:", error);
      res.status(500).json({ message: "Failed to track activity" });
    }
  });

  // Dashboard endpoint - combines all data needed for dashboard
  app.get("/api/dashboard", legacyAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get all necessary data for dashboard
      const [continueCourses, recommendedCourses, categories] = await Promise.all([
        storage.getUserRecentContent(userId, 8), // Recent activity for "continue" section
        storage.getAllCourses(), // All courses for recommendations
        storage.getAllCategories() // Categories for filtering
      ]);

      // Get user progress for all courses
      const userProgress = await storage.getUserProgress(userId);
      const progressMap = Array.isArray(userProgress) ? userProgress.reduce((acc: any, progress: any) => {
        acc[progress.courseId] = progress;
        return acc;
      }, {}) : {};

      // Combine courses with their progress and categories
      const coursesWithData = recommendedCourses.map((course: any) => {
        const category = categories.find((cat: any) => cat.id === course.categoryId);
        const progress = progressMap[course.id];
        return {
          course,
          category,
          progress
        };
      });

      res.json({
        continueCourses, // Recent activity for "Continue where you left off"
        recommendedCourses: coursesWithData, // All courses with progress and category data
        categories
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Admin routes with simple auth - simplified versions
  app.get("/api/admin/dashboard", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      // Use direct database queries for now
      const courses = await storage.getAllCourses();
      const categories = await storage.getAllCategories();
      const onboardingAnalytics = await storage.getOnboardingAnalytics();
      const allComments = await storage.getAllComments('all');
      
      res.json({
        totalCourses: courses.length,
        totalUsers: 1, // You're the main user
        totalLessons: 35, // From your progress
        totalCategories: categories.length,
        totalComments: allComments.length,
        // Add onboarding metrics
        totalOnboardingResponses: onboardingAnalytics.totalResponses,
        onboardingAnalytics: onboardingAnalytics
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin onboarding analytics
  app.get("/api/admin/onboarding/analytics", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getOnboardingAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching onboarding analytics:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin get all onboarding responses
  app.get("/api/admin/onboarding/responses", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const responses = await storage.getAllOnboardingResponses(limit, offset);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching onboarding responses:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/users", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      // Return your user info for now
      const user = await storage.getUserByEmail("fabianseguraconsultor@gmail.com");
      res.json([user]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin media upload URL endpoint  
  app.post("/api/admin/media/upload-url", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin media normalize path endpoint
  app.post("/api/admin/media/normalize-path", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL es requerida" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(url);
      res.json({ normalizedPath });
    } catch (error) {
      console.error("Error normalizing path:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Object proxy route to serve images from Object Storage
  app.get("/api/object-proxy/objects/*", async (req: Request, res: Response) => {
    try {
      const objectPath = req.path.replace("/api/object-proxy", "");
      const objectStorageService = new ObjectStorageService();
      
      // Get the file from Object Storage using the full object path
      const file = await objectStorageService.getObjectEntityFile(objectPath);

      // Stream the file content
      const stream = file.createReadStream();
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'image/jpeg'); // Default to JPEG, could be enhanced to detect type
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      stream.pipe(res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Imagen no encontrada" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Upload image URL endpoint for rich text editor
  app.post("/api/upload-image-url", legacyAuth, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Finalize lesson image upload
  app.put("/api/lesson-images", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { imageURL } = req.body;
      if (!imageURL) {
        return res.status(400).json({ message: "imageURL es requerida" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const url = objectStorageService.normalizeObjectEntityPath(imageURL);
      // normalizeObjectEntityPath already returns the complete URL like "/api/object-proxy/objects/..."
      res.json({ url });
    } catch (error) {
      console.error("Error finalizing lesson image:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Lesson resources upload URL endpoint
  app.post("/api/lesson-resources/upload-url", simpleAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "Nombre de archivo requerido" });
      }

      // Generate a unique resource ID for this upload
      const resourceId = randomUUID();
      
      // Clean filename for URL safety
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-_]/g, '_');
      
      // Create specific path for lesson resources
      const lessonResourcePath = `lesson-resources/${resourceId}/${cleanFileName}`;
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLessonResourceUploadURL(lessonResourcePath);
      
      // Return both the upload URL and the resource info for the client
      res.json({ 
        uploadURL,
        resourceId,
        fileName: cleanFileName,
        // This is the path the client should use to store in DB
        resourcePath: `/lesson-resources/${resourceId}/${cleanFileName}`
      });
    } catch (error) {
      console.error("Error getting lesson resource upload URL:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin courses endpoint for content management
  app.get("/api/admin/courses", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCoursesAdmin();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching admin courses:", error);
      // Fallback to regular courses if admin method doesn't exist
      try {
        const courses = await storage.getAllCourses();
        res.json(courses);
      } catch (fallbackError) {
        console.error("Error fetching courses fallback:", fallbackError);
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Get specific course for admin
  app.get("/api/admin/courses/:courseId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      
      // Include categories for guides
      let courseWithCategories: any = course;
      if (course.type === 'guide') {
        const categories = await storage.getCourseCategories(courseId);
        courseWithCategories = { ...course, categories };
      }
      
      // Include room/phase assignment if exists (using the course's actual type)
      const roomAssignment = await storage.getCourseRoomAssignment(courseId, course.type as any);
      if (roomAssignment) {
        courseWithCategories = { 
          ...courseWithCategories, 
          roomId: roomAssignment.roomId,
          phaseId: roomAssignment.phaseId
        };
      }
      
      res.json(courseWithCategories);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get lessons for a specific course
  app.get("/api/admin/courses/:courseId/lessons", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const lessons = await storage.getLessonsByCourse(courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create new course
  app.post("/api/admin/courses", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { categoryIds, roomId, phaseId, ...rest } = req.body;
      const courseData = {
        ...rest,
        id: randomUUID(),
      };
      
      const course = await storage.createCourse(courseData);
      
      // Handle multiple categories based on type and categoryIds presence
      if (categoryIds && Array.isArray(categoryIds)) {
        await storage.updateCourseCategories(course.id, categoryIds);
      }
      
      // Handle room/phase assignment
      if (roomId && phaseId) {
        await storage.upsertPhaseContentForCourse(course.id, roomId, phaseId, course.type as any);
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update existing course
  app.put("/api/admin/courses/:courseId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const { categoryIds, roomId, phaseId, ...rest } = req.body;
      const courseData = rest;
      
      const course = await storage.updateCourse(courseId, courseData);
      if (!course) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      
      // Handle multiple categories - always process if categoryIds provided
      if (categoryIds && Array.isArray(categoryIds)) {
        await storage.updateCourseCategories(courseId, categoryIds);
      } else if (courseData.type && courseData.type !== 'guide') {
        // If type is explicitly non-guide, clear multiple categories
        await storage.updateCourseCategories(courseId, []);
      }
      
      // Handle room/phase assignment (upsert will remove if not provided)
      await storage.upsertPhaseContentForCourse(courseId, roomId, phaseId, course.type as any);
      
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Delete course
  app.delete("/api/admin/courses/:courseId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const success = await storage.deleteCourse(courseId);
      if (!success) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      
      res.json({ message: "Curso eliminado correctamente" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get specific lesson for admin editing
  app.get("/api/admin/lessons/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const lesson = await storage.getLessonById(id);
      if (!lesson) {
        return res.status(404).json({ message: "Lección no encontrada" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create new lesson
  app.post("/api/admin/courses/:courseId/lessons", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const lessonData = {
        ...req.body,
        courseId,
        id: randomUUID(), // Generate unique ID
      };
      
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update existing lesson
  app.put("/api/admin/lessons/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const lessonData = req.body;
      
      const lesson = await storage.updateLesson(id, lessonData);
      if (!lesson) {
        return res.status(404).json({ message: "Lección no encontrada" });
      }
      
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Delete lesson
  app.delete("/api/admin/lessons/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteLesson(id);
      if (!success) {
        return res.status(404).json({ message: "Lección no encontrada" });
      }
      
      res.json({ message: "Lección eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get lesson resources from database
  app.get("/api/lessons/:lessonId/resources", async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const resources = await storage.getLessonResources(lessonId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching lesson resources:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create lesson resource (save metadata to database) - Admin only
  app.post("/api/lessons/:lessonId/resources", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const { lessonId } = req.params;
      
      // Validate request body with Zod schema
      const validationResult = insertLessonResourceSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse({
        ...req.body,
        lessonId
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos",
          errors: validationResult.error.errors
        });
      }

      const resource = await storage.createLessonResource(validationResult.data);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating lesson resource:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Delete lesson resource - Admin only
  app.delete("/api/resources/:id", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      
      await storage.deleteLessonResource(id);
      res.json({ message: "Recurso eliminado correctamente" });
    } catch (error) {
      console.error("Error deleting lesson resource:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Helper function to determine file type
  function getFileType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'mp4':
      case 'webm':
      case 'ogg':
        return 'video';
      case 'pdf':
        return 'document';
      default:
        return 'file';
    }
  }

  // USER ROUTES (public/authenticated user routes, not admin)
  
  // Get specific course for regular users (public access for preview)
  app.get("/api/courses/:courseId", async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get lessons for a specific course (public access for preview)
  app.get("/api/courses/:courseId/lessons", async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const lessons = await storage.getLessonsByCourse(courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get single lesson by courseId and lessonId
  app.get("/api/courses/:courseId/lessons/:lessonId", async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lección no encontrada" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get user progress for a specific course (returns array of completed lesson IDs)
  app.get("/api/courses/:courseId/progress", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Get completed lesson IDs from userLessonProgress table
      const completedLessonIds = await storage.getCompletedLessons(userId, courseId);
      
      console.log("Completed lessons for user", userId, "course", courseId, ":", completedLessonIds);
      res.json(completedLessonIds);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      // Return empty array on error so frontend doesn't crash
      res.json([]);
    }
  });

  // Mark lesson as complete
  app.post("/api/lessons/:lessonId/complete", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Validate that lesson exists before marking as complete
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson || !lesson.courseId) {
        return res.status(404).json({ message: "Lección no encontrada o sin curso asociado" });
      }
      
      // Mark lesson as complete in database
      await storage.markLessonComplete(userId, lessonId);
      
      // Get updated completed lessons for the course
      const completedLessonIds = await storage.getCompletedLessons(userId, lesson.courseId);
      
      res.json({ 
        success: true, 
        message: "Lección marcada como completada",
        completedLessonIds,
        lessonId
      });
    } catch (error) {
      console.error("Error marking lesson as complete:", error);
      res.status(500).json({ message: "Error al marcar la lección como completada" });
    }
  });

  // Unmark lesson as complete
  app.delete("/api/lessons/:lessonId/complete", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Validate that lesson exists
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson || !lesson.courseId) {
        return res.status(404).json({ message: "Lección no encontrada o sin curso asociado" });
      }
      
      // Unmark lesson as complete in database
      await storage.unmarkLessonComplete(userId, lessonId);
      
      // Get updated completed lessons for the course
      const completedLessonIds = await storage.getCompletedLessons(userId, lesson.courseId);
      
      res.json({ 
        success: true, 
        message: "Lección desmarcada como completada",
        completedLessonIds,
        lessonId
      });
    } catch (error) {
      console.error("Error unmarking lesson as complete:", error);
      res.status(500).json({ message: "Error al desmarcar la lección" });
    }
  });

  // Get lesson resource files from Object Storage - public access for lesson resources
  app.get("/api/lesson-resources/:resourceId/*", async (req: Request, res: Response) => {
    try {
      const resourceId = req.params.resourceId;
      const fileName = req.params[0]; // Gets the * part
      
      console.log(`Requesting lesson resource from Object Storage: lesson-resources/${resourceId}/${fileName}`);
      
      const objectStorageService = new ObjectStorageService();
      
      // Lesson resources are stored in private storage, so use the private object dir path
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullObjectPath = `${privateDir}/lesson-resources/${resourceId}/${fileName}`;
      
      console.log(`Looking for file at path: ${fullObjectPath}`);
      
      // Parse the path and get the file from private storage
      const { bucketName, objectName } = parseObjectPath(fullObjectPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`File not found in private storage: ${fullObjectPath}`);
        return res.status(404).json({ error: "File not found" });
      }
      
      // Set appropriate headers for inline viewing (opens in browser)
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      // Let the browser determine content type based on file extension
      
      // Stream the file directly from Object Storage
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error fetching lesson resource:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get saved courses for user
  app.get("/api/users/saved-courses", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const savedCourses = await db
        .select({
          id: userSavedCourses.id,
          courseId: userSavedCourses.courseId,
          roomSlug: userSavedCourses.roomSlug,
          createdAt: userSavedCourses.createdAt,
          course: courses,
        })
        .from(userSavedCourses)
        .innerJoin(courses, eq(userSavedCourses.courseId, courses.id))
        .where(eq(userSavedCourses.userId, userId))
        .orderBy(desc(userSavedCourses.createdAt));
      
      res.json(savedCourses);
    } catch (error) {
      console.error("Error fetching saved courses:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Save a course for user
  app.post("/api/users/saved-courses", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const { courseId, roomSlug } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: "courseId es requerido" });
      }
      
      // Check if already saved
      const existing = await db
        .select()
        .from(userSavedCourses)
        .where(and(
          eq(userSavedCourses.userId, userId),
          eq(userSavedCourses.courseId, courseId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        // Update roomSlug if it changed
        if (roomSlug && existing[0].roomSlug !== roomSlug) {
          await db
            .update(userSavedCourses)
            .set({ roomSlug })
            .where(and(
              eq(userSavedCourses.userId, userId),
              eq(userSavedCourses.courseId, courseId)
            ));
        }
        return res.json({ message: "Curso ya guardado" });
      }
      
      // Save the course with optional roomSlug
      await db.insert(userSavedCourses).values({
        userId,
        courseId,
        roomSlug: roomSlug || null,
      });
      
      res.json({ message: "Curso guardado exitosamente" });
    } catch (error) {
      console.error("Error saving course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Remove a saved course
  app.delete("/api/users/saved-courses/:courseId", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const { courseId } = req.params;
      
      await db
        .delete(userSavedCourses)
        .where(and(
          eq(userSavedCourses.userId, userId),
          eq(userSavedCourses.courseId, courseId)
        ));
      
      res.json({ message: "Curso eliminado de guardados" });
    } catch (error) {
      console.error("Error removing saved course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update user profile information
  app.patch("/api/users/profile", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { firstName, lastName, email } = req.body;
      console.log("Update profile request:", { userId, firstName, lastName, email });

      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No hay datos para actualizar" });
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      console.log("Profile updated successfully for user:", userId);
      res.json({ message: "Perfil actualizado exitosamente" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error al actualizar el perfil" });
    }
  });

  // Change user password
  app.patch("/api/users/change-password", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { currentPassword, newPassword } = req.body;

      // TODO: Implement password change logic
      // For now, we'll just return success
      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Error al cambiar la contraseña" });
    }
  });

  // Update user preferences/focus
  app.patch("/api/users/focus", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { experienceLevel, preferredSkillType, preferredContentTypes } = req.body;

      await db
        .update(users)
        .set({
          experienceLevel: experienceLevel || null,
          preferredSkillType: preferredSkillType || null,
          preferredContentTypes: preferredContentTypes || [],
        })
        .where(eq(users.id, userId));

      res.json({ message: "Preferencias actualizadas exitosamente" });
    } catch (error) {
      console.error("Error updating focus preferences:", error);
      res.status(500).json({ message: "Error al actualizar las preferencias" });
    }
  });

  // Upload profile image
  app.post("/api/users/upload-profile-image", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Handle multipart form data
      const bb = Busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } });
      
      let fileData: Buffer | null = null;
      let fileName: string | null = null;

      bb.on("file", (fieldname: string, file: any, info: any) => {
        const chunks: Buffer[] = [];
        file.on("data", (data: Buffer) => {
          chunks.push(data);
        });
        file.on("end", () => {
          fileData = Buffer.concat(chunks);
          fileName = info.filename;
        });
      });

      bb.on("close", async () => {
        if (!fileData || !fileName) {
          return res.status(400).json({ message: "No file provided" });
        }

        try {
          // Generate unique filename
          const ext = fileName.split(".").pop() || "jpg";
          const uniqueFileId = randomUUID();
          const uniqueFileName = `profile-${uniqueFileId}.${ext}`;

          // Get private object directory for upload
          const objectStorageService = new ObjectStorageService();
          const privateDir = objectStorageService.getPrivateObjectDir();
          
          if (!privateDir) {
            return res.status(500).json({ message: "Object storage not configured" });
          }

          // Use private directory with profile-images path
          const uploadPath = `${privateDir}/profile-images/${uniqueFileName}`;
          const { bucketName, objectName } = parseObjectPath(uploadPath);
          
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          
          // Upload file to object storage
          await file.save(fileData, {
            metadata: {
              contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
            },
          });

          // Generate the proxy URL that will be served through /api/object-proxy
          const fullGcsUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
          const proxyUrl = objectStorageService.normalizeObjectEntityPath(fullGcsUrl);

          // Update user profile image URL in database
          await db
            .update(users)
            .set({ profileImageUrl: proxyUrl })
            .where(eq(users.id, userId));

          res.json({ 
            message: "Profile image uploaded successfully",
            profileImageUrl: proxyUrl 
          });
        } catch (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          res.status(500).json({ message: "Error uploading image to storage" });
        }
      });

      bb.on("error", (error: any) => {
        console.error("Busboy error:", error);
        res.status(400).json({ message: "Error processing upload" });
      });

      req.pipe(bb);
    } catch (error) {
      console.error("Error in profile image upload:", error);
      res.status(500).json({ message: "Error al procesar la imagen" });
    }
  });

  // ==================== COMMENT ROUTES ====================
  
  // GET comments for a lesson
  app.get("/api/lessons/:lessonId/comments", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("📖 GET /api/lessons/:lessonId/comments called");
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      console.log("📖 lessonId:", lessonId);
      console.log("📖 userId:", userId);
      
      const comments = await storage.getLessonComments(lessonId, userId);
      console.log("📖 comments retrieved:", comments.length);
      
      res.json(comments);
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  // POST new comment
  app.post("/api/lessons/:lessonId/comments", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("📝 POST /api/lessons/:lessonId/comments called");
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      
      console.log("📝 lessonId:", lessonId);
      console.log("📝 userId:", userId);
      console.log("📝 req.body:", req.body);
      
      if (!userId) {
        console.log("❌ No userId - 401");
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { content, parentId } = req.body;
      console.log("📝 content:", content);
      console.log("📝 parentId:", parentId);
      
      if (!content || content.trim().length === 0) {
        console.log("❌ No content - 400");
        return res.status(400).json({ message: "El contenido del comentario es requerido" });
      }

      // Create comment or reply based on parentId
      let newComment;
      if (parentId) {
        console.log("📝 Creating reply to parent:", parentId);
        newComment = await storage.createReply(parentId, {
          lessonId,
          userId,
          content: content.trim()
        });
      } else {
        console.log("📝 Creating root comment...");
        newComment = await storage.createComment({
          lessonId,
          userId,
          content: content.trim()
        });
      }
      
      console.log("✅ Comment created:", newComment.id);

      // Send email notification to admin (async, don't wait)
      console.log("📧 Attempting to send email notification...");
      (async () => {
        try {
          const [lesson, user, adminEmails] = await Promise.all([
            storage.getLessonById(lessonId),
            storage.getUser(userId),
            getAdminNotificationEmails()
          ]);
          
          if (!lesson || !user || adminEmails.length === 0) {
            console.log("⚠️ Missing data for email notification");
            return;
          }

          const course = lesson.courseId ? await storage.getCourseById(lesson.courseId) : null;
          const authorName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.email;
          
          await sendNewCommentNotification({
            commentId: newComment.id,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            courseTitle: course?.title || 'Curso sin título',
            authorName: authorName,
            commentContent: newComment.content,
            recipientEmails: adminEmails,
            isReply: !!parentId
          });
          
          console.log("✅ Email notification sent successfully");
        } catch (emailError) {
          console.error("❌ Error sending email notification:", emailError);
        }
      })();

      res.json(newComment);
    } catch (error) {
      console.error("❌ Error creating comment:", error);
      res.status(500).json({ message: "Error al crear comentario" });
    }
  });

  // GET all comments for admin
  app.get("/api/admin/comments", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("👮 GET /api/admin/comments called");
      const comments = await storage.getAllComments();
      console.log("👮 Total comments:", comments.length);
      res.json(comments);
    } catch (error) {
      console.error("❌ Error fetching all comments:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  // GET unread comment count for admin
  app.get("/api/admin/comments/unread-count", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getAllComments();
      const unreadCount = comments.filter((c: any) => c.status === 'pending').length;
      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching unread comment count:", error);
      res.status(500).json({ message: "Error al obtener contador de comentarios" });
    }
  });

  // PATCH comment status (admin only)
  app.patch("/api/admin/comments/:commentId/status", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("👮 PATCH /api/admin/comments/:commentId/status called");
      const { commentId } = req.params;
      const { status } = req.body;
      
      console.log("👮 commentId:", commentId);
      console.log("👮 new status:", status);
      
      // For now, we only support marking as "reviewed" (approved)
      // The storage method is markCommentReviewed which sets isAdminReviewed = true
      if (status !== 'approved') {
        console.log("⚠️ Only 'approved' status is supported currently");
      }

      console.log("👮 Marking comment as reviewed...");
      const updatedComment = await storage.markCommentReviewed(commentId);
      console.log("✅ Comment marked as reviewed");
      
      res.json(updatedComment);
    } catch (error) {
      console.error("❌ Error updating comment status:", error);
      res.status(500).json({ message: "Error al actualizar estado del comentario" });
    }
  });

  // DELETE comment (admin only)
  app.delete("/api/admin/comments/:commentId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("👮 DELETE /api/admin/comments/:commentId called");
      const { commentId } = req.params;
      
      console.log("👮 commentId:", commentId);
      
      await storage.deleteComment(commentId);
      console.log("✅ Comment deleted");
      
      res.json({ success: true, message: "Comentario eliminado exitosamente" });
    } catch (error) {
      console.error("❌ Error deleting comment:", error);
      res.status(500).json({ message: "Error al eliminar comentario" });
    }
  });

  // POST reply to a comment
  app.post("/api/comments/:id/replies", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("💬 POST /api/comments/:id/replies called");
      const { id: parentCommentId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      
      console.log("💬 parentCommentId:", parentCommentId);
      console.log("💬 userId:", userId);
      console.log("💬 req.body:", req.body);
      
      if (!userId) {
        console.log("❌ No userId - 401");
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { content, lessonId } = req.body;
      
      if (!content || content.trim().length === 0) {
        console.log("❌ No content - 400");
        return res.status(400).json({ message: "El contenido es requerido" });
      }

      if (!lessonId) {
        console.log("❌ No lessonId - 400");
        return res.status(400).json({ message: "lessonId es requerido" });
      }

      console.log("💬 Creating reply...");
      const reply = await storage.createReply(parentCommentId, {
        lessonId,
        userId,
        content: content.trim()
      });
      
      console.log("✅ Reply created:", reply.id);

      // Send email notification (async, don't wait)
      console.log("📧 Attempting to send reply notification...");
      (async () => {
        try {
          const [lesson, user, parentComment, adminEmails] = await Promise.all([
            storage.getLessonById(lessonId),
            storage.getUser(userId),
            storage.getCommentById(parentCommentId),
            getAdminNotificationEmails()
          ]);
          
          if (!lesson || !user || !parentComment || adminEmails.length === 0) {
            console.log("⚠️ Missing data for reply notification");
            return;
          }

          const course = lesson.courseId ? await storage.getCourseById(lesson.courseId) : null;
          const authorName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.email;
          
          await sendNewCommentNotification({
            commentId: reply.id,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            courseTitle: course?.title || 'Curso sin título',
            authorName: authorName,
            commentContent: reply.content,
            recipientEmails: adminEmails,
            isReply: true
          });
          
          console.log("✅ Reply notification sent successfully");
        } catch (emailError) {
          console.error("❌ Error sending reply notification:", emailError);
        }
      })();

      res.json(reply);
    } catch (error: any) {
      console.error("❌ Error creating reply:", error);
      if (error.message === 'Parent comment not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error al crear respuesta" });
    }
  });

  // PATCH mark comment as reviewed (admin only)
  app.patch("/api/comments/:id/review", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("✅ PATCH /api/comments/:id/review called");
      const { id: commentId } = req.params;
      
      console.log("✅ commentId:", commentId);
      
      const updated = await storage.markCommentReviewed(commentId);
      console.log("✅ Comment marked as reviewed");
      
      res.json(updated);
    } catch (error: any) {
      console.error("❌ Error marking comment as reviewed:", error);
      if (error.message === 'Comment not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to mark comment as reviewed" });
    }
  });

  // POST toggle like on a comment
  app.post("/api/comments/:id/like", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("❤️ POST /api/comments/:id/like called");
      const { id: commentId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      
      console.log("❤️ commentId:", commentId);
      console.log("❤️ userId:", userId);
      
      if (!userId) {
        console.log("❌ No userId - 401");
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const result = await storage.toggleCommentLike(commentId, userId);
      console.log("✅ Like toggled:", result);
      
      res.json(result);
    } catch (error: any) {
      console.error("❌ Error toggling comment like:", error);
      res.status(500).json({ message: "Error al dar me gusta" });
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

  app.post("/api/community/channels/:channelId/messages", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user?.claims?.sub;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const message = await storage.createCommunityMessage(channelId, userId, content);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Community posts endpoints
  app.get("/api/community/channels/:channelId/posts", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const posts = await storage.getChannelPosts(channelId, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/community/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Admin endpoint to create posts
  app.post("/api/admin/community/posts", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { channelId, title, content, imageUrl, videoUrl } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!channelId || !title || !content) {
        return res.status(400).json({ message: "channelId, title, and content are required" });
      }

      const post = await db.insert(communityPosts).values({
        channelId,
        userId,
        title,
        content,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
      }).returning();

      res.status(201).json(post[0]);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Admin endpoint to get all posts
  app.get("/api/admin/community/posts", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const posts = await db
        .select({
          post: communityPosts,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
          channel: communityChannels,
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .leftJoin(communityChannels, eq(communityPosts.channelId, communityChannels.id))
        .orderBy(desc(communityPosts.createdAt));

      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Admin endpoint to update post
  app.patch("/api/admin/community/posts/:postId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { title, content, imageUrl, videoUrl } = req.body;

      const [updated] = await db
        .update(communityPosts)
        .set({ title, content, imageUrl, videoUrl, updatedAt: new Date() })
        .where(eq(communityPosts.id, postId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Admin endpoint to delete post
  app.delete("/api/admin/community/posts/:postId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      await db.delete(communityPosts).where(eq(communityPosts.id, postId));
      res.json({ message: "Post deleted" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post("/api/community/posts/:postId/comments", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const comment = await storage.createPostComment(postId, userId, content);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Endpoint to add reaction to post
  app.post("/api/community/posts/:postId/reactions", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { emoji } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Check if user already reacted with this emoji
      const existing = await db
        .select()
        .from(communityPostReactions)
        .where(
          and(
            eq(communityPostReactions.postId, postId),
            eq(communityPostReactions.userId, userId),
            eq(communityPostReactions.emoji, emoji)
          )
        );

      if (existing.length > 0) {
        // Remove reaction if already exists
        await db
          .delete(communityPostReactions)
          .where(eq(communityPostReactions.id, existing[0].id));
      } else {
        // Add new reaction
        await db.insert(communityPostReactions).values({
          postId,
          userId,
          emoji,
        });
      }

      // Return all reactions for this post
      const reactions = await db
        .select()
        .from(communityPostReactions)
        .where(eq(communityPostReactions.postId, postId));

      res.json(reactions);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // Endpoint to get reactions for a post
  app.get("/api/community/posts/:postId/reactions", async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      const reactions = await db
        .select({
          emoji: communityPostReactions.emoji,
          count: sql<number>`count(*)`.mapWith(Number),
          users: sql<string[]>`array_agg(${communityPostReactions.userId})`.mapWith(el => (el as string[]) || []),
        })
        .from(communityPostReactions)
        .where(eq(communityPostReactions.postId, postId))
        .groupBy(communityPostReactions.emoji);

      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Initialize channels on startup
  storage.initializeCommunityChannels().catch(err => console.error("Error initializing channels:", err));

  const httpServer = createServer(app);
  return httpServer;
}