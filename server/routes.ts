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

  // Get all guides
  app.get("/api/guides", async (req, res) => {
    try {
      const guides = await storage.getAllGuides();
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

  const httpServer = createServer(app);
  return httpServer;
}