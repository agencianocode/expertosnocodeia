import { RequestHandler } from "express";
import { storage } from "./storage";

// Middleware to check if user is an admin
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    console.log("isAdmin middleware - req.user:", req.user);
    // Get userId from req.user (set by supabaseAuth middleware)
    const userId = req.user?.id || req.user?.claims?.sub;
    const userEmail = req.user?.email;
    console.log("isAdmin middleware - userId:", userId);
    console.log("isAdmin middleware - userEmail:", userEmail);
    
    if (!userId && !userEmail) {
      console.log("isAdmin middleware - No userId or email found");
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    let adminUser = await storage.getAdminUser(userId);
    console.log("isAdmin middleware - adminUser by ID:", adminUser);
    
    // If not found by ID and we have an email, try finding by email
    if ((!adminUser || !adminUser.isActive) && userEmail) {
      console.log("isAdmin middleware - Trying to find user by email:", userEmail);
      const dbUser = await storage.getUserByEmail(userEmail);
      if (dbUser) {
        console.log("isAdmin middleware - Found user by email, ID:", dbUser.id);
        adminUser = await storage.getAdminUser(dbUser.id);
        console.log("isAdmin middleware - adminUser by email lookup:", adminUser);
      }
    }
    
    if (!adminUser || !adminUser.isActive) {
      console.log("isAdmin middleware - Admin user not found or inactive");
      return res.status(403).json({ 
        message: "No tienes privilegios de administrador." 
      });
    }

    // Add admin info to request for further use
    req.adminUser = adminUser;
    console.log("isAdmin middleware - Success, proceeding");
    next();
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Middleware to check specific permissions
export const hasPermission = (permission: string): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const adminUser = req.adminUser;
      
      if (!adminUser) {
        return res.status(403).json({ 
          message: "Acceso denegado. Usuario administrador requerido." 
        });
      }

      // Super admins have all permissions
      if (adminUser.role === 'super_admin') {
        return next();
      }

      // Check if user has specific permission
      if (!adminUser.permissions || !adminUser.permissions.includes(permission)) {
        return res.status(403).json({ 
          message: `Acceso denegado. Se requiere el permiso: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
};