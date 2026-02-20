// Supabase Authentication Routes - Replacement for Replit Auth
import { Express, Request, Response } from "express";
import { supabaseAuth, AuthenticatedRequest, supabaseAdmin } from "./supabaseAuth";
import { storage } from "./storage";
import { sendEmailVerificationEmail } from "./emailMarketing";

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

    // Account exists but has no password: allow only if admin; otherwise direct to Google or forgot password
    if (!user.password || user.password.trim() === '') {
      const adminUser = await storage.getAdminUser(user.id);
      if (adminUser && adminUser.isActive !== false) {
        // Admin without password: allow login (bypass password check)
        await storage.updateUserLastLogin(user.id);
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
        return res.json({
          message: "Login exitoso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token,
        });
      }
      if (user.provider === 'google') {
        return res.status(401).json({
          message: "Esta cuenta se creó con Google. Usa el botón «Continuar con Google» para iniciar sesión."
        });
      }
      return res.status(401).json({
        message: "Esta cuenta no tiene contraseña. Usa «Has olvidado tu contraseña» para crear una."
      });
    }

    // Verify password
    let passwordValid = false;
    try {
      const bcrypt = await import('bcrypt');
      const bcryptModule = (bcrypt as any).default || bcrypt;
      passwordValid = await bcryptModule.compare(password, user.password);
    } catch (error: any) {
      try {
        const storedPassword = Buffer.from(user.password, 'base64').toString('utf-8');
        passwordValid = storedPassword === password;
      } catch {
        passwordValid = user.password === password;
      }
    }

    if (!passwordValid) {
      return res.status(401).json({
        message: "Email o contraseña incorrectos. Si olvidaste tu contraseña, usa «Has olvidado tu contraseña»."
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
   * Register new user. Uses Supabase when configured; otherwise fallback to simple DB auth.
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email y contraseña son requeridos",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }
      if (password.length < 6) {
        return res.status(400).json({
          message: "La contraseña debe tener al menos 6 caracteres",
        });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "Este email ya está registrado",
        });
      }

      // When Supabase is not configured: simple registration (DB + token)
      if (!supabaseAdmin) {
        let hashedPassword: string;
        try {
          const bcrypt = await import("bcrypt");
          const bcryptModule = (bcrypt as any).default || bcrypt;
          hashedPassword = await bcryptModule.hash(password, 10);
        } catch (e: any) {
          console.error("bcrypt not available, using fallback:", e?.message);
          hashedPassword = Buffer.from(password).toString("base64");
        }
        const newUser = await storage.createUser({
          email,
          password: hashedPassword,
          firstName: firstName || "",
          lastName: lastName || "",
          provider: "email",
          isEmailVerified: false,
        });
        const crypto = await import("crypto");
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.setEmailVerificationToken(newUser.id, verificationToken, verificationExpires);
        try {
          await sendEmailVerificationEmail(
            newUser.email,
            newUser.firstName || newUser.email,
            verificationToken
          );
        } catch (emailErr: any) {
          console.error("Verification email error:", emailErr?.message);
        }
        const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString("base64");
        return res.json({
          message: "Usuario registrado. Revisa tu correo para verificar tu cuenta.",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            isEmailVerified: false,
          },
          token,
        });
      }

      // Supabase path
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || "",
          last_name: lastName || "",
        },
      });

      if (authError || !authData.user) {
        console.error("Supabase registration error:", authError);
        return res.status(400).json({
          message: authError?.message || "Error al registrar usuario",
        });
      }

      let dbUser = await storage.getUserByEmail(authData.user.email!);
      if (!dbUser) {
        dbUser = await storage.createUser({
          id: authData.user.id,
          email: authData.user.email!,
          firstName: firstName || "",
          lastName: lastName || "",
          profileImageUrl: "",
          provider: "supabase",
          isEmailVerified: true,
        });
      } else {
        await storage.updateUserProfile(dbUser.id, {
          provider: "supabase",
          isEmailVerified: true,
          profileImageUrl: dbUser.profileImageUrl || "",
          firstName: firstName || dbUser.firstName || "",
          lastName: lastName || dbUser.lastName || "",
        });
        dbUser = await storage.getUser(dbUser.id);
      }

      const token = Buffer.from(`${dbUser!.id}:${Date.now()}`).toString("base64");
      res.json({
        message: "Usuario registrado exitosamente",
        user: {
          id: dbUser!.id,
          email: dbUser!.email,
          firstName: dbUser!.firstName,
          lastName: dbUser!.lastName,
        },
        token,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: error?.message || "Error al registrar usuario",
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
        // Check if error is due to HTML response (malformed URL or network issue)
        const errorMessage = err?.message || String(err);
        if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('Unexpected token')) {
          console.log("⚠️ Supabase returned HTML instead of JSON - likely URL misconfiguration or network issue");
          console.log("   Falling back to simple auth...");
        } else {
          console.log("⚠️ Supabase login error:", errorMessage);
        }
        authError = err;
        authData = null;
      }

      // If Supabase login fails, fallback to simple auth
      if (authError || !authData?.user) {
        const errorMsg = authError?.message || "Unknown error";
        // Only log if it's not a JSON parsing error (which we already handled)
        if (!errorMsg.includes('<!DOCTYPE') && !errorMsg.includes('Unexpected token')) {
          console.log("⚠️ Supabase login failed, falling back to simple auth:", errorMsg);
        }
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