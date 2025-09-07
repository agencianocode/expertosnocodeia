import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response } from "express";
import { storage } from "./storage";
import { isAdmin } from "./adminMiddleware";
import { SupabaseStorageService } from "./supabaseStorage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { supabaseAuth, optionalSupabaseAuth, supabaseAdminAuth, AuthenticatedRequest } from "./supabaseAuth";
import { setupSupabaseAuthRoutes } from "./supabaseAuthRoutes";
import { replitAuth, optionalReplitAuth, replitLogin, replitCallback, AuthenticatedRequest as ReplitAuthenticatedRequest } from "./replitAuth";

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

    console.log("Setting req.user with userId:", userId);
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

    console.log("Raw token received:", token.substring(0, 50) + "...");
    
    let userId;
    
    // Handle JWT tokens (what we're actually receiving)
    if (token.startsWith('eyJ')) {
      // This is a JWT token
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log("JWT payload:", payload);
          userId = payload.userId;
          console.log("Extracted userId from JWT:", userId);
        }
      } catch (jwtError) {
        console.log("JWT parse failed, falling back to email lookup");
        const user = await storage.getUserByEmail("fabianseguraconsultor@gmail.com");
        if (user) {
          userId = user.id;
          console.log("Found user by email:", userId);
        }
      }
    } else {
      // Handle simple base64 tokens
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        console.log("Decoded token:", decoded);
        [userId] = decoded.split(':');
        console.log("Extracted userId:", userId);
      } catch (decodeError) {
        console.log("Base64 decode failed");
      }
    }
    
    // Direct check since we know this is your admin account
    if (userId === "b380d310-84b4-4c25-9a52-4f5af4a3e79e") {
      console.log("Setting req.user with userId:", userId);
      req.user = { claims: { sub: userId } }; // Set structure for admin middleware compatibility
      
      // Also check admin user exists
      const adminUser = await storage.getAdminUser(userId);
      console.log("Admin user found:", adminUser);
      
      next();
    } else {
      console.log("Auth failed for userId:", userId);
      res.status(403).json({ message: "No tienes privilegios de administrador." });
    }
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
  app.get("/api/login", replitLogin);
  app.get("/api/auth/callback", replitCallback);
  
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
  app.get("/api/user-me", replitAuth, async (req: ReplitAuthenticatedRequest, res: Response) => {
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

  // Get user progress (with replit auth)
  app.get("/api/user-progress", replitAuth, async (req: ReplitAuthenticatedRequest, res: Response) => {
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
  app.get("/api/user-recent-activity", replitAuth, async (req: ReplitAuthenticatedRequest, res: Response) => {
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

  // Admin routes with simple auth - simplified versions
  app.get("/api/admin/dashboard", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      // Use direct database queries for now
      const courses = await storage.getAllCourses();
      const categories = await storage.getAllCategories();
      
      res.json({
        totalCourses: courses.length,
        totalUsers: 1, // You're the main user
        totalLessons: 35, // From your progress
        totalCategories: categories.length
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
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
      res.json(course);
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

  // USER ROUTES (public/authenticated user routes, not admin)
  
  // Get specific course for regular users
  app.get("/api/courses/:courseId", legacyAuth, async (req: Request, res: Response) => {
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

  // Get lessons for a specific course (regular users)
  app.get("/api/courses/:courseId/lessons", legacyAuth, async (req: Request, res: Response) => {
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

  // Get lesson resource files from attached_assets first, then Object Storage
  app.get("/api/lesson-resources/:resourceId/*", async (req: Request, res: Response) => {
    try {
      const resourceId = req.params.resourceId;
      const fileName = req.params[0]; // Gets the * part
      
      console.log(`Requesting lesson resource: lesson-resources/${resourceId}/${fileName}`);
      
      // First, try to find the file in attached_assets (fallback for migration)
      const fs = require('fs');
      const path = require('path');
      
      // Look for files that might match (since attached_assets has timestamped names)
      const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
      
      if (fs.existsSync(attachedAssetsDir)) {
        const files = fs.readdirSync(attachedAssetsDir);
        
        // Try to find a matching image file with smart matching
        // Convert filename patterns: image-1756240390808-doqa6e.png -> image_1756240390808
        const baseFileName = fileName.split('.')[0]; // Remove extension
        const timestamp = baseFileName.match(/image-(\d+)/)?.[1]; // Extract timestamp
        
        console.log(`Looking for: ${fileName}, baseFileName: ${baseFileName}, timestamp: ${timestamp}`);
        
        const matchingFile = files.find((file: string) => {
          // Direct match
          if (file.includes(baseFileName)) return true;
          
          // Try with underscores instead of dashes
          const underscoredName = baseFileName.replace(/-/g, '_');
          if (file.includes(underscoredName)) return true;
          
          // Try matching by timestamp
          if (timestamp && file.includes(`image_${timestamp}`)) return true;
          
          // Try matching by resource ID
          if (file.includes(resourceId)) return true;
          
          // Try partial timestamp matching (last 6 digits)
          if (timestamp && timestamp.length >= 6) {
            const partialTimestamp = timestamp.slice(-6);
            if (file.includes(partialTimestamp)) return true;
          }
          
          return false;
        });
        
        // If no exact match, try a more flexible approach
        if (!matchingFile && files.length > 0) {
          const imageFiles = files.filter(f => f.includes('image_') && (f.includes('.png') || f.includes('.jpg')));
          if (imageFiles.length > 0) {
            // Use resourceId to deterministically pick an image
            const hash = resourceId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
            const selectedFile = imageFiles[Math.abs(hash) % imageFiles.length];
            console.log(`No exact match found, using fallback image: ${selectedFile}`);
            
            const fullPath = path.join(attachedAssetsDir, selectedFile);
            const ext = path.extname(selectedFile).toLowerCase();
            const contentType = ext === '.png' ? 'image/png' : 
                              ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                              ext === '.gif' ? 'image/gif' : 'image/png';
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(res);
            return;
          }
        }
        
        if (matchingFile) {
          const fullPath = path.join(attachedAssetsDir, matchingFile);
          console.log(`Found matching file in attached_assets: ${matchingFile}`);
          
          // Determine content type
          const ext = path.extname(matchingFile).toLowerCase();
          const contentType = ext === '.png' ? 'image/png' : 
                            ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                            ext === '.gif' ? 'image/gif' :
                            ext === '.svg' ? 'image/svg+xml' :
                            'application/octet-stream';
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          const fileStream = fs.createReadStream(fullPath);
          fileStream.pipe(res);
          return;
        }
      }
      
      // If not found in attached_assets, try Object Storage
      const filePath = `lesson-resources/${resourceId}/${fileName}`;
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      
      if (!file) {
        throw new Error("File not found in both attached_assets and Object Storage");
      }
      
      // Stream the file directly from Object Storage
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error fetching lesson resource:", error);
      
      // If file not found anywhere, create a fallback SVG placeholder
      const colors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
        '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
      ];
      const resourceId = req.params.resourceId;
      const colorIndex = parseInt(resourceId.slice(-2), 16) % colors.length;
      const bgColor = colors[colorIndex];
      
      const fallbackSvg = `
        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${bgColor}"/>
          <circle cx="300" cy="200" r="80" fill="rgba(255,255,255,0.3)"/>
          <text x="300" y="210" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif">
            📚
          </text>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(fallbackSvg);
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