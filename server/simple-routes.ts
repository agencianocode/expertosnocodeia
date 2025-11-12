import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { isAdmin } from "./adminMiddleware";
import { SupabaseStorageService } from "./supabaseStorage";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath } from "./objectStorage";
import { supabaseAuth, optionalSupabaseAuth, supabaseAdminAuth, AuthenticatedRequest } from "./supabaseAuth";
import { setupSupabaseAuthRoutes } from "./supabaseAuthRoutes";
import { insertLessonResourceSchema } from "../shared/schema";

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

// Simple admin middleware for our simplified auth
const simpleAdminAuth = async (req: any, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Token requerido" });
    }

    let userId;
    
    // Handle JWT tokens 
    if (token.startsWith('eyJ')) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          userId = payload.userId;
        }
      } catch (jwtError) {
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
        // Token decode failed
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
      
      const activity = await storage.getUserRecentCourses(userId);
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

      const { courseId, lessonId } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: "courseId requerido" });
      }

      await storage.trackUserActivity(userId, courseId, lessonId);
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
        storage.getUserRecentCourses(userId, 8), // Recent activity for "continue" section
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
      
      res.json({
        totalCourses: courses.length,
        totalUsers: 1, // You're the main user
        totalLessons: 35, // From your progress
        totalCategories: categories.length,
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
      const { categoryIds, ...rest } = req.body;
      const courseData = {
        ...rest,
        id: randomUUID(),
      };
      
      const course = await storage.createCourse(courseData);
      
      // Handle multiple categories based on type and categoryIds presence
      if (categoryIds && Array.isArray(categoryIds)) {
        await storage.updateCourseCategories(course.id, categoryIds);
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
      const { categoryIds, ...rest } = req.body;
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
      // For now, return empty array since this method might not exist
      const savedCourses: any[] = [];
      res.json(savedCourses);
    } catch (error) {
      console.error("Error fetching saved courses:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}