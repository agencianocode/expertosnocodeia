import type { Express } from "express";
import { createServer, type Server } from "http";
// import { setupEmailPasswordAuth } from "./auth/routes"; // Commented out - module not found

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup new authentication system only
  // setupEmailPasswordAuth(app); // Commented out - module not found

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}