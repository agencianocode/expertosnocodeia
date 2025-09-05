// Supabase Authentication Routes - Replacement for Replit Auth
import { Express, Request, Response } from "express";
import { supabaseAuth, AuthenticatedRequest } from "./supabaseAuth";

export function setupSupabaseAuthRoutes(app: Express) {
  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  app.get("/api/auth/me", supabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      res.json({
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profileImageUrl: req.user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout handled by Supabase client-side, this just confirms logout
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // With Supabase, logout is typically handled client-side
    // This endpoint can be used for cleanup if needed
    res.json({ message: "Logout exitoso" });
  });

  /**
   * GET /api/auth/session
   * Alternative endpoint to check auth status
   */
  app.get("/api/auth/session", supabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      res.json({
        authenticated: true,
        user: req.user,
        supabaseUser: {
          id: req.supabaseUser?.id,
          email: req.supabaseUser?.email,
          email_verified: req.supabaseUser?.email_confirmed_at ? true : false,
        }
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}