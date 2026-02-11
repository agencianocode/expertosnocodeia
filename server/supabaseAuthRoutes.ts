// Supabase Authentication Routes - Replacement for Replit Auth
import { Express, Request, Response } from "express";
import { supabaseAuth, AuthenticatedRequest, supabaseAdmin } from "./supabaseAuth";
import { storage } from "./storage";

// Simple auth login handler (shared with simple-routes.ts)
async function handleSimpleAuthLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos"
      });
    }

    // Get user from database
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: "Email o contraseña incorrectos"
      });
    }

    // Verify password
    let passwordValid = false;
    
    if (user.password) {
      try {
        // Use bcrypt (already installed in package.json)
        const bcrypt = await import('bcrypt');
        const bcryptModule = (bcrypt as any).default || bcrypt;
        passwordValid = await bcryptModule.compare(password, user.password);
      } catch (error: any) {
        // Fallback: simple comparison (for development/legacy passwords)
        try {
          const storedPassword = Buffer.from(user.password, 'base64').toString('utf-8');
          passwordValid = storedPassword === password;
        } catch {
          // If password is not base64, try direct comparison (legacy)
          passwordValid = user.password === password;
        }
      }
    }

    // Only allow login without password if user has no password set (for migration)
    // Once password is set, it must be validated
    if (!passwordValid && !user.password) {
      console.log("⚠️ User has no password set, allowing login for migration");
      passwordValid = true; // Only for users without password
    }

    if (!passwordValid) {
      return res.status(401).json({
        message: "Email o contraseña incorrectos"
      });
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Create session token
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
  } catch (error: any) {
    console.error("Simple auth login error:", error);
    res.status(500).json({
      message: error.message || "Error interno del servidor"
    });
  }
}

export function setupSupabaseAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register
   * Register new user with Supabase
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email y contraseña son requeridos" 
        });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({ 
          message: "Supabase no configurado. Configura las variables de entorno." 
        });
      }

      // Register user in Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          first_name: firstName || '',
          last_name: lastName || '',
        },
      });

      if (authError || !authData.user) {
        console.error("Supabase registration error:", authError);
        return res.status(400).json({ 
          message: authError?.message || "Error al registrar usuario" 
        });
      }

      // Check if user already exists in our database
      let dbUser = await storage.getUserByEmail(authData.user.email!);
      
      if (!dbUser) {
        // Create user in our database with Supabase ID
        dbUser = await storage.createUser({
          id: authData.user.id, // ✅ Use Supabase Auth ID
          email: authData.user.email!,
          firstName: firstName || '',
          lastName: lastName || '',
          profileImageUrl: '',
          provider: 'supabase',
          isEmailVerified: true,
          role: 'user', // Default role for new users
        });
      } else {
        // Update existing user to use Supabase provider
        dbUser = await storage.updateUserProfile(dbUser.id, {
          provider: 'supabase',
          isEmailVerified: true,
          firstName: firstName || dbUser.firstName || '',
          lastName: lastName || dbUser.lastName || '',
        });
      }

      // Get session token
      const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: authData.user.email!,
      });

      res.json({
        message: "Usuario registrado exitosamente",
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
        },
        // Note: Client should use Supabase client to get access token
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        message: error.message || "Error interno del servidor" 
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login with Supabase (with fallback to simple auth)
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email y contraseña son requeridos" 
        });
      }

      // If Supabase is not configured, use simple auth
      if (!supabaseAdmin) {
        return handleSimpleAuthLogin(req, res);
      }

      // Try Supabase login first
      let authData, authError;
      try {
        const result = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });
        authData = result.data;
        authError = result.error;
      } catch (err: any) {
        authError = err;
        authData = null;
      }

      // If Supabase login fails, fallback to simple auth
      if (authError || !authData?.user) {
        console.log("⚠️ Supabase login failed, falling back to simple auth:", authError?.message || "Unknown error");
        // Call simple auth handler directly
        return handleSimpleAuthLogin(req, res);
      }

      // Supabase login succeeded
      // Get or create user in our database using Supabase ID
      let dbUser = await storage.getUserByEmail(email);
      
      if (!dbUser) {
        // Create new user with Supabase ID
        dbUser = await storage.createUser({
          id: authData.user.id, // Use Supabase ID
          email: authData.user.email!,
          firstName: authData.user.user_metadata?.first_name || '',
          lastName: authData.user.user_metadata?.last_name || '',
          profileImageUrl: authData.user.user_metadata?.avatar_url || '',
          provider: 'supabase',
          isEmailVerified: !!authData.user.email_confirmed_at,
          role: 'user', // Default role for new users
        });
      } else if (dbUser.id !== authData.user.id) {
        // User exists but with different ID - need to sync IDs
        console.log(`⚠️ User ${email} has different IDs - DB: ${dbUser.id}, Supabase: ${authData.user.id}`);
        // For now, use the existing DB user but log the mismatch
        // In a future migration, we could update the ID
      }

      // ALWAYS use simple token with DB user ID for consistency
      // This avoids ID mismatch issues between Supabase Auth and DB
      const token = Buffer.from(`${dbUser.id}:${Date.now()}`).toString('base64');
      
      res.json({
        message: "Login exitoso",
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
        },
        token: token,
        supabaseToken: authData.session?.access_token, // Optional: for future use
      });
    } catch (error: any) {
      console.error("Supabase login error:", error);
      // On error, fallback to simple auth
      return handleSimpleAuthLogin(req, res);
    }
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  app.get("/api/auth/me", supabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get full user info from database to include isEmailVerified
      const dbUser = await storage.getUser(req.user.id);
      
      res.json({
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profileImageUrl: req.user.profileImageUrl,
        isEmailVerified: dbUser?.isEmailVerified || false,
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