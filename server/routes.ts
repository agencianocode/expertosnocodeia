import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAuth, AuthenticatedRequest } from "./supabaseAuth";
import { setupSupabaseAuthRoutes } from "./supabaseAuthRoutes";

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

  const httpServer = createServer(app);
  return httpServer;
}