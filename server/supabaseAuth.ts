// Supabase Authentication Service - Migration from Replit Auth
import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Initialize Supabase client (fallback for development)
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Only create client if we have real credentials
export const supabaseAdmin = supabaseUrl !== 'https://placeholder.supabase.co' 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  supabaseUser?: any;
}

/**
 * Supabase JWT Authentication middleware
 */
export const supabaseAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: "Token de acceso requerido",
        reason: "no_token" 
      });
    }

    // Verify token with Supabase (fallback for development)
    if (!supabaseAdmin) {
      return res.status(503).json({ 
        message: "Supabase no configurado - usar autenticación legacy",
        reason: "supabase_not_configured" 
      });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        message: "Token inválido o expirado",
        reason: "invalid_token" 
      });
    }

    // Get or create user in our database
    let dbUser = await storage.getUserByEmail(user.email!);
    
    if (!dbUser) {
      // Create user if doesn't exist (for first-time Supabase users)
      dbUser = await storage.createUser({
        email: user.email!,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        profileImageUrl: user.user_metadata?.avatar_url || '',
        provider: 'supabase',
        isEmailVerified: true, // Supabase handles email verification
      });
    }

    // Attach both Supabase user and our DB user to request
    req.supabaseUser = user;
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName || undefined,
      lastName: dbUser.lastName || undefined,
      profileImageUrl: dbUser.profileImageUrl || undefined,
    };

    next();
  } catch (error) {
    console.error("Supabase auth middleware error:", error);
    return res.status(401).json({ 
      message: "Error de autenticación",
      reason: "auth_error" 
    });
  }
};

/**
 * Optional Supabase authentication middleware - doesn't fail if no token
 */
export const optionalSupabaseAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token && supabaseAdmin) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        const dbUser = await storage.getUserByEmail(user.email!);
        
        if (dbUser) {
          req.supabaseUser = user;
          req.user = {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName || undefined,
            lastName: dbUser.lastName || undefined,
            profileImageUrl: dbUser.profileImageUrl || undefined,
          };
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if there's an error
    next();
  }
};

/**
 * Admin authentication middleware using Supabase + our admin table
 */
export const supabaseAdminAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // First verify with Supabase
    await supabaseAuth(req, res, () => {});
    
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Check if user is admin in our system
    const adminUser = await storage.getAdminUser(req.user.id);
    
    if (!adminUser || !adminUser.isActive) {
      return res.status(403).json({ message: "Acceso denegado - Admin requerido" });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ 
      message: "Error de autenticación de administrador" 
    });
  }
};