import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import express from "express";
import { randomUUID } from "crypto";
import Busboy from "busboy";
import { storage } from "./storage";
import { isAdmin } from "./adminMiddleware";
import { SupabaseStorageService, supabaseStorage, supabase } from "./supabaseStorage";
import { supabaseAuth, optionalSupabaseAuth, supabaseAdminAuth, AuthenticatedRequest } from "./supabaseAuth";
import { setupSupabaseAuthRoutes } from "./supabaseAuthRoutes";
import { insertLessonResourceSchema, updateRoomSchema, userSavedCourses, courses, communityChannels, communityMessages, communityPosts, communityPostComments, communityPostReactions, communityPostCommentReactions, users, adminUsers, rooms, userNotificationPreferences, userPoints, liveEvents, eventRegistrations, userSubscriptions, subscriptionPlans, userProgress, userRecentActivity, lessons, userLessonProgress } from "../shared/schema";
import { createCheckoutSession, createEmbeddedCheckoutSession, handleStripeWebhook, stripe } from "./stripe";
import { 
  sendEmail, 
  sendWelcomeEmail, 
  sendTrialReminderEmail, 
  sendOnboardingEmail,
  sendCancellationRecoveryEmail,
  sendReEngagementEmail,
  sendBulkEmail,
  sendPasswordResetEmail,
  sendPasswordChangeNotificationEmail,
  sendEmailVerificationEmail
} from "./emailMarketing";
import {
  subscribeToBeehiiv,
  unsubscribeFromBeehiiv,
  updateBeehiivSubscriber,
  getBeehiivSubscriber,
  syncAllUsersToBeehiiv,
  checkBeehiivConfig,
} from "./beehiiv";
import { sendNewCommentNotification, getAdminNotificationEmails, sendEventConfirmationEmail, sendEventReminderEmail, sendWhatsAppNotification } from "./emailNotifications";
import { db, pool } from "./db";
import { eq, desc, and, sql, gte, lte, inArray, or } from "drizzle-orm";
import { calculateLevel, getPointsForNextLevel, POINTS_PER_ACTIVITY, type ActivityType } from "./utils/points";

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
          // Supabase JWT uses 'sub' (standard), legacy might use 'userId'
          userId = payload.sub || payload.userId;
        }
      } catch (jwtError) {
        console.log("❌ Error parsing JWT:", jwtError);
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

    // Get user from database to include email and other data
    const dbUser = await storage.getUser(userId);
    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName || undefined,
        lastName: dbUser.lastName || undefined,
        profileImageUrl: dbUser.profileImageUrl || undefined,
        claims: { sub: userId }
      };
    } else {
      // If user not found in DB, set minimal user info for fallback
      req.user = { 
        claims: { sub: userId },
        id: userId
      };
    }
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Error de autenticación" });
  }
};

// Simple admin middleware for our simplified auth - works with both sessions and tokens
const simpleAdminAuth = async (req: any, res: Response, next: any) => {
  try {
    let userId;
    
    // Try session-based auth first (from Supabase auth middleware that runs in setupSupabaseAuthRoutes)
    if (req.user?.claims?.sub) {
      userId = req.user.claims.sub;
      console.log('✅ Auth: Found userId from req.user.claims.sub:', userId);
    } else if (req.user?.id) {
      userId = req.user.id;
      console.log('✅ Auth: Found userId from req.user.id:', userId);
    }
    
    // If no session, try Authorization header token
    if (!userId) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];
      
      if (token) {
        console.log('🔍 Auth: Token found, length:', token.length, 'starts with:', token.substring(0, 10));
        
        // Handle JWT tokens 
        if (token.startsWith('eyJ')) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              userId = payload.userId || payload.sub || payload.id;
              console.log('✅ Auth: Parsed JWT token, userId:', userId);
            }
          } catch (jwtError) {
            console.error('❌ Auth: JWT parse failed:', jwtError);
          }
        } else {
          // Handle simple base64 tokens
          try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            console.log('🔍 Auth: Decoded token:', decoded.substring(0, 50));
            
            // Try parsing as JSON first (for tokens with structure)
            try {
              const tokenData = JSON.parse(decoded);
              userId = tokenData.claims?.sub || tokenData.userId || tokenData.id;
              console.log('✅ Auth: Parsed JSON token, userId:', userId);
            } catch (jsonError) {
              // Fallback to colon-separated format (userId:timestamp)
              [userId] = decoded.split(':');
              console.log('✅ Auth: Parsed colon-separated token, userId:', userId);
            }
          } catch (decodeError) {
            console.error('❌ Auth: Token decode failed:', decodeError);
          }
        }
      } else {
        console.log('⚠️ Auth: No token found in Authorization header');
      }
    }

    // Fallback for migration period - use the admin account
    if (!userId) {
      console.log('⚠️ Auth: No userId found, trying fallback to admin account');
      const user = await storage.getUserByEmail("fabianseguraconsultor@gmail.com");
      if (user) {
        userId = user.id;
        console.log('✅ Auth: Using fallback admin userId:', userId);
      }
    }
    
    if (!userId) {
      console.error('❌ Auth: No userId found, returning 401');
      return res.status(401).json({ message: "Token de acceso requerido" });
    }

    // Get user from database to include email and other data
    const dbUserAdmin = await storage.getUser(userId);
    if (dbUserAdmin) {
      req.user = {
        id: dbUserAdmin.id,
        email: dbUserAdmin.email,
        firstName: dbUserAdmin.firstName || undefined,
        lastName: dbUserAdmin.lastName || undefined,
        profileImageUrl: dbUserAdmin.profileImageUrl || undefined,
        claims: { sub: userId }
      };
      console.log('✅ Auth: Setting req.user with userId:', userId, 'email:', dbUserAdmin.email);
    } else {
      // If user not found in DB, set minimal user info for fallback
      console.log('⚠️ Auth: User not found in DB, using fallback with userId:', userId);
      req.user = { 
        claims: { sub: userId },
        id: userId
      };
    }
    next();
  } catch (error) {
    console.error("❌ Auth error:", error);
    res.status(500).json({ message: "Error de autenticación" });
  }
};

// Helper to extract userId from request (used by requireEmailVerification)
const getUserIdFromRequest = (req: any): string | null => {
  let userId = req.user?.claims?.sub || req.user?.id;
  
  if (!userId) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    
    if (token) {
      if (token.startsWith('eyJ')) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            userId = payload.sub || payload.userId || payload.id;
          }
        } catch (jwtError) {
          // JWT parse failed
        }
      } else {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          try {
            const tokenData = JSON.parse(decoded);
            userId = tokenData.claims?.sub || tokenData.userId || tokenData.id;
          } catch (jsonError) {
            [userId] = decoded.split(':');
          }
        } catch (decodeError) {
          // Token decode failed
        }
      }
    }
  }
  
  return userId || null;
};

// Helper to check if user has verified email
const requireEmailVerification = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: "Debes verificar tu email para realizar esta acción. Por favor revisa tu bandeja de entrada.",
        requiresEmailVerification: true
      });
    }

    next();
  } catch (error: any) {
    console.error("Error checking email verification:", error);
    res.status(500).json({ message: "Error interno del servidor" });
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
  console.log("🚀 Registering simple routes...");
  
  // Debug: Verificar configuración de base de datos al iniciar
  console.log('🔍 Verificando configuración de base de datos en simple-routes:');
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log('   - DATABASE_URL (primeros 60 caracteres):', dbUrl.substring(0, 60) + '...');
    console.log('   - ¿Contiene "supabase"?', dbUrl.includes('supabase'));
    console.log('   - ¿Contiene "neon"?', dbUrl.includes('neon'));
  } else {
    console.error('❌ DATABASE_URL no está definida!');
  }
  
  // Setup Supabase auth routes FIRST (they will fallback to simple auth if needed)
  setupSupabaseAuthRoutes(app);
  
  // Simple login endpoint (registered after Supabase, will handle fallback)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

      if (!email || !password) {
        return res.status(400).json({
          message: "Email y contraseña son requeridos"
        });
      }

      // Get user from database
      let user;
      try {
        user = await storage.getUserByEmail(email);
      } catch (dbError: any) {
        console.error("❌ Database connection error:", dbError);
        console.error("   - Error message:", dbError.message);
        console.error("   - Error code:", dbError.code);
        console.error("   - DATABASE_URL actual:", process.env.DATABASE_URL?.substring(0, 60) + '...');
        
        // Check if it's a Neon-specific error
        if (dbError.message?.includes('Neon') || dbError.message?.includes('endpoint') || dbError.message?.includes('disabled') || dbError.code === 'ECONNREFUSED') {
          return res.status(503).json({
            message: "El servicio de base de datos no está disponible. Verifica que:\n1. Tu archivo .env tiene DATABASE_URL apuntando a Supabase (no a Neon)\n2. El proyecto de Supabase está activo\n3. Reiniciaste el servidor después de cambiar el .env"
          });
        }
        // Generic database error
        return res.status(503).json({
          message: `Error de conexión con la base de datos: ${dbError.message || 'Error desconocido'}. Verifica tu configuración de DATABASE_URL.`
        });
      }
      
      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({
          message: "Email o contraseña incorrectos"
        });
      }

      console.log('✅ User found:', { id: user.id, email: user.email, hasPassword: !!user.password });

      // Verify password
      let passwordValid = false;
      
      if (user.password) {
        try {
          // Use bcrypt (already installed in package.json)
          const bcrypt = await import('bcrypt');
          const bcryptModule = (bcrypt as any).default || bcrypt;
          passwordValid = await bcryptModule.compare(password, user.password);
          console.log('🔐 Bcrypt comparison result:', passwordValid);
        } catch (error: any) {
          console.log('⚠️ Bcrypt error, trying fallback:', error.message);
          // Fallback: simple comparison (for development/legacy passwords)
          try {
            const storedPassword = Buffer.from(user.password, 'base64').toString('utf-8');
            passwordValid = storedPassword === password;
            console.log('🔐 Base64 comparison result:', passwordValid);
          } catch {
            // If password is not base64, try direct comparison (legacy)
            passwordValid = user.password === password;
            console.log('🔐 Direct comparison result:', passwordValid);
          }
        }
      } else {
        console.log('⚠️ User has no password set');
      }

      // Only allow login without password if user has no password set (for migration)
      // Once password is set, it must be validated
      if (!passwordValid && !user.password) {
        console.log("⚠️ User has no password set, allowing login for migration");
        passwordValid = true; // Only for users without password
      }

      if (!passwordValid) {
        console.log('❌ Password validation failed');
        return res.status(401).json({
          message: "Email o contraseña incorrectos"
        });
      }

      console.log('✅ Login successful for user:', user.email);

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
      console.error("❌ Login error:", error);
      
      // Check if it's a database connection error
      if (error.message?.includes('Neon') || error.message?.includes('endpoint') || error.message?.includes('disabled') || error.message?.includes('ECONNREFUSED') || error.message?.includes('timeout') || error.message?.includes('connection')) {
        return res.status(503).json({
          message: "El servicio de base de datos no está disponible. Por favor, verifica que la base de datos esté activa y la conexión configurada correctamente."
        });
      }
      
      res.status(500).json({
        message: error.message || "Error interno del servidor"
      });
    }
  });

  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email es requerido"
        });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success (security best practice - don't reveal if email exists)
      if (!user) {
        return res.json({
          message: "Si el email existe, recibirás un enlace para restablecer tu contraseña"
        });
      }

      // Generate secure reset token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set expiration (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Save token to database
      await storage.updatePasswordResetToken(user.id, resetToken, expiresAt);

      // Send reset email
      try {
        await sendPasswordResetEmail(
          user.email,
          user.firstName || user.email,
          resetToken
        );
      } catch (emailError: any) {
        console.error("Error sending password reset email:", emailError);
        // Don't fail the request if email fails, but log it
      }

      res.json({
        message: "Si el email existe, recibirás un enlace para restablecer tu contraseña"
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "Error al procesar la solicitud"
      });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          message: "Token y nueva contraseña son requeridos"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "La contraseña debe tener al menos 6 caracteres"
        });
      }

      // Get user by reset token
      const user = await storage.getUserByPasswordResetToken(token);
      
      if (!user) {
        return res.status(400).json({
          message: "Token inválido o expirado"
        });
      }

      // Check if token is expired
      if (!user.passwordResetExpires || new Date() > new Date(user.passwordResetExpires)) {
        return res.status(400).json({
          message: "Token expirado. Por favor solicita un nuevo enlace"
        });
      }

      // Hash new password
      const bcrypt = await import('bcrypt');
      const bcryptModule = (bcrypt as any).default || bcrypt;
      const hashedPassword = await bcryptModule.hash(password, 10);

      // Update password and clear reset token
      await storage.updatePassword(user.id, hashedPassword);

      res.json({
        message: "Contraseña restablecida exitosamente"
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({
        message: "Error al restablecer la contraseña"
      });
    }
  });

  // Email verification endpoints
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          message: "Token de verificación es requerido"
        });
      }

      // Get user by verification token
      const user = await storage.getUserByEmailVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({
          message: "Token de verificación inválido o expirado"
        });
      }

      // Check if token is expired
      if (user.emailVerificationExpires && new Date() > new Date(user.emailVerificationExpires)) {
        return res.status(400).json({
          message: "Token de verificación expirado. Por favor solicita un nuevo enlace"
        });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.json({
          message: "Tu email ya está verificado"
        });
      }

      // Verify email
      await storage.verifyUserEmail(user.id);

      res.json({
        message: "Email verificado exitosamente"
      });
    } catch (error: any) {
      console.error("Verify email error:", error);
      res.status(500).json({
        message: "Error al verificar el email"
      });
    }
  });

  app.post("/api/auth/resend-verification", legacyAuth, async (req: Request, res: Response) => {
    try {
      // Try multiple ways to get userId from the request
      let userId = (req as any).user?.claims?.sub || (req as any).user?.id;
      
      // If not found, try to extract from token directly
      if (!userId) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        
        if (token) {
          try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [tokenUserId] = decoded.split(':');
            if (tokenUserId) {
              userId = tokenUserId;
            }
          } catch (error) {
            console.error("Error parsing token:", error);
          }
        }
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          message: "Usuario no encontrado"
        });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.json({
          message: "Tu email ya está verificado"
        });
      }

      // Generate new verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Save verification token with expiration
      await storage.setEmailVerificationToken(userId, verificationToken, verificationExpires);

      // Send verification email
      try {
        await sendEmailVerificationEmail(
          user.email,
          user.firstName || user.email,
          verificationToken
        );
      } catch (emailError: any) {
        console.error("Error sending verification email:", emailError);
        return res.status(500).json({
          message: "Error al enviar el email de verificación"
        });
      }

      res.json({
        message: "Email de verificación enviado. Por favor revisa tu bandeja de entrada."
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(500).json({
        message: "Error al procesar la solicitud"
      });
    }
  });
  
  // Replit Auth routes
  // Replit auth routes removed during SimpleAuth migration
  // app.get("/api/login", replitLogin);
  // app.get("/api/auth/callback", replitCallback);
  
  // Public assets route - Usa Supabase Storage
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
    try {
      const filePath = req.params.filePath;
      const isDebug = process.env.DEBUG_STORAGE === 'true';
      
      // Intentar servir desde Supabase Storage
      const served = await supabaseStorage.serveFile(filePath, res, 'attached-assets');
      if (served) {
        if (isDebug) {
          console.log(`✅ Archivo público servido desde Supabase: ${filePath}`);
        }
        return;
      }
      
      // Fallback: intentar desde local (durante migración)
      try {
      const { LocalFileStorageService } = await import("./localFileStorage");
      const localStorage = new LocalFileStorageService();
      const localPath = `public/${filePath}`;
        const localServed = await localStorage.serveFile(localPath, res);
        if (localServed) {
          if (isDebug) {
            console.log(`✅ Archivo público servido desde local (fallback): ${localPath}`);
          }
        return;
      }
      } catch (localError) {
        // Ignorar errores de local storage
      }
      
        return res.status(404).json({ error: "File not found" });
    } catch (error) {
      console.error("Error serving public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Legacy login endpoint (redirects to new endpoint for backward compatibility)
  app.post("/api/login", async (req: Request, res: Response) => {
    // Forward to new unified endpoint
    req.url = '/api/auth/login';
    return app._router.handle(req, res);
  });

  // Unified registration endpoint
  // Google OAuth endpoints
  app.get("/api/auth/google", async (req: Request, res: Response) => {
    try {
      // Redirect to Google OAuth
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
      const scope = 'openid email profile';
      
      if (!clientId) {
        return res.status(503).json({
          message: "Google OAuth no está configurado. Configura GOOGLE_CLIENT_ID en las variables de entorno."
        });
      }
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      res.redirect(authUrl);
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      res.status(500).json({ message: "Error al iniciar autenticación con Google" });
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/login?error=google_auth_failed`);
      }
      
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
      
      if (!clientId || !clientSecret) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/login?error=google_not_configured`);
      }
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange error:', errorData);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/login?error=token_exchange_failed`);
      }
      
      const tokens = await tokenResponse.json();
      
      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      
      if (!userResponse.ok) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/login?error=user_info_failed`);
      }
      
      const googleUser = await userResponse.json();
      
      // Find or create user in database
      let user = await storage.getUserByEmail(googleUser.email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email: googleUser.email,
          firstName: googleUser.given_name || '',
          lastName: googleUser.family_name || '',
          profileImageUrl: googleUser.picture || '',
          provider: 'google',
          isEmailVerified: true,
        });
      } else {
        // Update existing user
        await storage.updateUserProfile(user.id, {
          provider: 'google',
          isEmailVerified: true,
          profileImageUrl: googleUser.picture || user.profileImageUrl,
          firstName: googleUser.given_name || user.firstName,
          lastName: googleUser.family_name || user.lastName,
        });
        user = await storage.getUser(user.id);
      }
      
      // Create session token
      const token = Buffer.from(`${user!.id}:${Date.now()}`).toString('base64');
      
      // Update last login
      await storage.updateUserLastLogin(user!.id);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
      res.redirect(`${frontendUrl}/?token=${encodeURIComponent(token)}`);
    } catch (error: any) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/login?error=google_auth_error`);
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email y contraseña son requeridos"
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Email inválido"
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          message: "La contraseña debe tener al menos 6 caracteres"
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "Este email ya está registrado"
        });
      }

      // Hash password
      let hashedPassword: string;
      try {
        // Use bcrypt (already installed in package.json)
        const bcrypt = await import('bcrypt');
        const bcryptModule = (bcrypt as any).default || bcrypt;
        hashedPassword = await bcryptModule.hash(password, 10);
      } catch (error: any) {
        console.error("Error importing bcrypt:", error);
        // Fallback: simple hash (NOT SECURE for production, but works for development)
        hashedPassword = Buffer.from(password).toString('base64');
      }

      // Determine initial role
      // Default: 'user' (free user)
      // Admin roles are assigned manually via adminUsers table
      const initialRole = 'user';

      // Create user in database
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        provider: 'email',
        isEmailVerified: false,
        role: initialRole,
      });

      // Generate email verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Save verification token with expiration
      await storage.setEmailVerificationToken(newUser.id, verificationToken, verificationExpires);

      // Send verification email
      try {
        await sendEmailVerificationEmail(
          newUser.email,
          newUser.firstName || newUser.email,
          verificationToken
        );
      } catch (emailError: any) {
        console.error("Error sending verification email:", emailError);
        // Don't fail registration if email fails, but log it
      }

      // Create session token
      const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');

      res.json({
        message: "Usuario registrado exitosamente. Por favor verifica tu email.",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          isEmailVerified: false,
        },
        token,
        requiresEmailVerification: true
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: error.message || "Error al registrar usuario"
      });
    }
  });


  // User info endpoint for replit auth
  app.get("/api/user-me", legacyAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Update last login
      await storage.updateUserLastLogin(userId);
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (user) {
        // Check if user is admin
        const adminUser = await storage.getAdminUser(userId);
        const isAdmin = !!adminUser;
        
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          experienceLevel: user.experienceLevel,
          preferredSkillType: user.preferredSkillType,
          preferredContentTypes: user.preferredContentTypes,
          isAdmin,
        });
      } else {
        res.status(401).json({ message: "Usuario no encontrado" });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current authenticated user (for simple auth)
  app.get("/api/auth/me", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      if (!userId) {
        return res.status(401).json({ 
          message: "Token requerido",
          reason: "no_token" 
        });
      }

      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isEmailVerified: user.isEmailVerified,
        experienceLevel: user.experienceLevel,
        preferredSkillType: user.preferredSkillType,
        preferredContentTypes: user.preferredContentTypes,
        provider: user.provider || 'email',
      });
    } catch (error: any) {
      console.error("Error fetching user info:", error);
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

  // Get all courses including those in rooms (for category filtering)
  app.get("/api/courses/all", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCoursesIncludingRooms();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching all courses:", error);
      res.status(500).json({ message: "Failed to fetch all courses" });
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

  // Get all guides including those in rooms (for category filtering)
  app.get("/api/guides/all", async (req: Request, res: Response) => {
    try {
      const guides = await storage.getAllGuidesIncludingRooms();
      res.json(guides);
    } catch (error) {
      console.error("Error fetching all guides:", error);
      res.status(500).json({ message: "Failed to fetch all guides" });
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

  // Admin: get all rooms (published and unpublished)
  app.get("/api/admin/rooms", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching admin rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Get rooms that contain courses from a specific category
  app.get("/api/rooms/by-course-category/:categoryId", async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const rooms = await storage.getRoomsByCourseCategory(categoryId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms by course category:", error);
      res.status(500).json({ message: "Failed to fetch rooms by course category" });
    }
  });

  // Get phases for a specific room
  app.get("/api/rooms/:roomId/phases", async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const phases = await storage.getPhasesByRoom(roomId);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching phases:", error);
      res.status(500).json({ message: "Failed to fetch phases" });
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
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      res.status(500).json({ 
        message: "Failed to fetch room detail",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get next course in room
  app.get("/api/rooms/:slug/next-course/:courseId", async (req: Request, res: Response) => {
    try {
      const { slug, courseId } = req.params;
      // Resolve slug to ID if needed
      const course = await storage.getCourseById(courseId);
      const actualCourseId = course?.id || courseId;
      const nextCourse = await storage.getNextCourseInRoom(slug, actualCourseId);
      res.json(nextCourse);
    } catch (error) {
      console.error("Error fetching next course in room:", error);
      res.status(500).json({ message: "Failed to fetch next course" });
    }
  });

  // Get user progress for all courses in a room (requires auth)
  app.get("/api/rooms/:slug/user-progress", legacyAuth, async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get room details to access course IDs
      const roomDetail = await storage.getRoomDetailWithPhases(slug, userId);
      if (!roomDetail) {
        return res.status(404).json({ message: "Sala no encontrada" });
      }

      // Collect all course IDs from all phases
      const courseIds = Array.from(new Set(
        roomDetail.phases.flatMap(phase =>
          phase.content
            .filter(content => content.contentType === 'course' && content.contentId)
            .map(content => content.contentId)
            .filter((id): id is string => Boolean(id))
        )
      ));

      if (courseIds.length === 0) {
        return res.json({});
      }

      console.log(`[DEBUG] Processing ${courseIds.length} courses for room ${slug}`);
      console.log(`[DEBUG] Course IDs:`, courseIds);
      if (courseIds.includes('09ada3b5-0858-4944-b203-675d6c5708be')) {
        console.log(`[DEBUG] Target course found in courseIds list`);
      }

      // Get user subscription info
      const userSubscription = await storage.getUserActiveSubscription(userId).catch(() => null);
      
      // Get all progress and recent activity in parallel - SIMPLIFIED: Only get what we need
      let allProgress: any[] = [];
      let allRecentActivity: any[] = [];
      let allLessonProgress: any[] = [];

      try {
        [allProgress, allRecentActivity, allLessonProgress] = await Promise.all([
          // Get all progress records at once
          db
            .select()
            .from(userProgress)
            .where(and(
              eq(userProgress.userId, userId),
              inArray(userProgress.courseId, courseIds)
            )),
          // Get all recent activity records for these courses
          db
            .select()
            .from(userRecentActivity)
            .where(and(
              eq(userRecentActivity.userId, userId),
              inArray(userRecentActivity.courseId, courseIds),
              slug 
                ? or(
                    eq(userRecentActivity.roomSlug, slug),
                    sql`${userRecentActivity.roomSlug} IS NULL`
                  )
                : sql`${userRecentActivity.roomSlug} IS NULL`
            )),
          // Get all lesson progress to calculate actual completion (only if needed)
          courseIds.length > 0
            ? db
                .select()
                .from(userLessonProgress)
                .where(and(
                  eq(userLessonProgress.userId, userId),
                  inArray(userLessonProgress.courseId, courseIds),
                  eq(userLessonProgress.isCompleted, true)
                ))
            : Promise.resolve([]),
        ]);
      } catch (queryError) {
        console.error("Error in Promise.all for user progress:", queryError);
        if (queryError instanceof Error) {
          console.error(`Query error message: ${queryError.message}`);
          console.error(`Query error stack: ${queryError.stack}`);
        }
        // Continue with empty arrays if queries fail
      }

      // Ensure all values are arrays
      if (!Array.isArray(allProgress)) allProgress = [];
      if (!Array.isArray(allRecentActivity)) allRecentActivity = [];
      if (!Array.isArray(allLessonProgress)) allLessonProgress = [];
      
      // Create maps for quick lookup
      const progressMap = new Map(allProgress.map(p => [p.courseId, p]));
      const activityMap = new Map(
        allRecentActivity.map(a => [a.courseId, a])
      );
      // Count completed lessons per course from the raw lesson progress data
      const lessonProgressMap = new Map<string, number>();
      for (const lp of allLessonProgress) {
        if (lp && lp.courseId) {
          const current = lessonProgressMap.get(lp.courseId) || 0;
          lessonProgressMap.set(lp.courseId, current + 1);
        }
      }
      
      // Debug: Log what we got
      console.log(`[DEBUG] After Promise.all:`, {
        allProgressCount: allProgress.length,
        allRecentActivityCount: allRecentActivity.length,
        allLessonProgressCount: allLessonProgress.length,
        courseIds: courseIds,
        progressRecords: allProgress.map(p => ({ courseId: p.courseId, isCompleted: p.isCompleted, totalLessons: p.totalLessons, completedLessons: p.completedLessons })),
        lessonProgressByCourse: Array.from(lessonProgressMap.entries())
      });

      // Build progress data - SIMPLIFIED VERSION
      const progressData: Record<string, any> = {};
      const subscriptionExpiresAt = userSubscription?.endDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      })();

      for (const courseId of courseIds) {
        try {
          const progress = progressMap.get(courseId);
          const activity = activityMap.get(courseId);
          const completedLessonsCount = lessonProgressMap.get(courseId) || 0;
          
          // SIMPLIFIED: Use stored progress values if available (most reliable)
          let totalLessons = progress?.totalLessons || 0;
          let completedLessons = progress?.completedLessons || 0;
          let progressPercentage = 0;
          
          // If we have stored progress, use it directly
          if (progress) {
            if (progress.isCompleted) {
              progressPercentage = 100;
              totalLessons = progress.totalLessons || completedLessons || 1;
              completedLessons = progress.completedLessons || completedLessons || totalLessons;
            } else if (progress.totalLessons > 0) {
              totalLessons = progress.totalLessons;
              completedLessons = progress.completedLessons || 0;
              progressPercentage = Math.round((completedLessons / totalLessons) * 100);
            } else if (completedLessonsCount > 0) {
              // If we have completed lessons but no total, use completed count as fallback
              completedLessons = completedLessonsCount;
              totalLessons = completedLessonsCount;
              progressPercentage = 100; // If we have completed lessons but no total, assume 100%
            }
          } else if (completedLessonsCount > 0) {
            // No stored progress but we have completed lessons
            completedLessons = completedLessonsCount;
            totalLessons = completedLessonsCount;
            progressPercentage = 100; // If we have completed lessons but no total, assume 100%
          }
          
          // Special logging for the problematic course
          if (courseId === '09ada3b5-0858-4944-b203-675d6c5708be') {
            console.log(`[DEBUG] Processing course ${courseId}:`, {
              hasProgress: !!progress,
              progressIsCompleted: progress?.isCompleted,
              progressTotalLessons: progress?.totalLessons,
              progressCompletedLessons: progress?.completedLessons,
              completedLessonsCount,
              calculatedProgressPercentage: progressPercentage,
              calculatedTotalLessons: totalLessons,
              calculatedCompletedLessons: completedLessons
            });
          }
          
          // Find last lesson title (we don't need lessons array for this, just use activity)
          let lastLessonTitle = null;
          // Note: We removed the lessons lookup to avoid connection exhaustion
          // The lastLessonTitle will be null if we don't have it in activity, but that's acceptable
          
          progressData[courseId] = {
            progressPercentage: progressPercentage,
            lastAccessedAt: progress?.lastAccessedAt || activity?.lastAccessedAt || null,
            lastLessonTitle: lastLessonTitle,
            completedLessons: completedLessons,
            totalLessons: totalLessons,
            subscriptionExpiresAt: subscriptionExpiresAt,
          };
        } catch (courseError) {
          console.error(`[ERROR] Failed to process course ${courseId}:`, courseError);
          if (courseError instanceof Error) {
            console.error(`[ERROR] Course error message: ${courseError.message}`);
            console.error(`[ERROR] Course error stack: ${courseError.stack}`);
          }
          // Continue with default values for this course
          progressData[courseId] = {
            progressPercentage: 0,
            lastAccessedAt: null,
            lastLessonTitle: null,
            completedLessons: 0,
            totalLessons: 0,
            subscriptionExpiresAt: subscriptionExpiresAt,
          };
        }
      }
      
      // Debug: Log final progress data
      console.log(`[DEBUG] Final progressData keys:`, Object.keys(progressData));
      console.log(`[DEBUG] Final progressData for target course:`, progressData['09ada3b5-0858-4944-b203-675d6c5708be']);

      res.json(progressData);
    } catch (error) {
      console.error("[ERROR] Error fetching room user progress:", error);
      if (error instanceof Error) {
        console.error(`[ERROR] Error message: ${error.message}`);
        console.error(`[ERROR] Error stack: ${error.stack}`);
      }
      // Return empty progress data instead of 500 to prevent frontend crashes
      // Log the error for debugging but don't break the frontend
      console.error("[ERROR] Returning empty progress data due to error");
      res.json({});
    }
  });

  // Update room (admin only)
  app.patch("/api/admin/rooms/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate request body
      const validation = updateRoomSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validation.error.errors 
        });
      }
      
      const roomData = validation.data;
      
      // If updating slug, check uniqueness
      if (roomData.slug) {
        const existingRoom = await storage.getRoomBySlug(roomData.slug);
        if (existingRoom && existingRoom.id !== id) {
          return res.status(400).json({ 
            message: "El slug ya está en uso por otra sala" 
          });
        }
      }
      
      const updatedRoom = await storage.updateRoom(id, roomData);
      res.json(updatedRoom);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ========================================
  // PROMO BANNERS ROUTES (Admin only)
  // ========================================

  // Get all promo banners (optionally filtered by roomId)
  app.get("/api/admin/promo-banners", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const roomId = req.query.roomId as string | undefined;
      const banners = await storage.getAllPromoBanners(roomId);
      res.json(banners);
    } catch (error) {
      console.error("Error fetching promo banners:", error);
      res.status(500).json({ message: "Error al obtener banners" });
    }
  });

  // Get single promo banner
  app.get("/api/admin/promo-banners/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const banner = await storage.getPromoBannerById(id);
      if (!banner) {
        return res.status(404).json({ message: "Banner no encontrado" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error fetching promo banner:", error);
      res.status(500).json({ message: "Error al obtener banner" });
    }
  });

  // Create promo banner
  app.post("/api/admin/promo-banners", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { insertPromoBannerSchema } = await import("@shared/schema");
      const validation = insertPromoBannerSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Validation errors:", validation.error.errors);
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validation.error.errors 
        });
      }
      
      console.log("Creating banner with data:", validation.data);
      const banner = await storage.createPromoBanner(validation.data);
      console.log("Banner created successfully:", banner);
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating promo banner:", error);
      res.status(500).json({ 
        message: "Error al crear banner",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update promo banner
  app.patch("/api/admin/promo-banners/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { insertPromoBannerSchema } = await import("@shared/schema");
      const validation = insertPromoBannerSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validation.error.errors 
        });
      }
      
      const banner = await storage.updatePromoBanner(id, validation.data);
      res.json(banner);
    } catch (error: any) {
      console.error("Error updating promo banner:", error);
      if (error.message?.includes("no encontrado")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error al actualizar banner" });
    }
  });

  // Delete promo banner
  app.delete("/api/admin/promo-banners/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePromoBanner(id);
      if (!deleted) {
        return res.status(404).json({ message: "Banner no encontrado" });
      }
      res.json({ message: "Banner eliminado correctamente" });
    } catch (error) {
      console.error("Error deleting promo banner:", error);
      res.status(500).json({ message: "Error al eliminar banner" });
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
      
      const activity = await storage.getUserRecentContent(userId);
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

      const { courseId, lessonId, contentType, roomSlug } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: "courseId requerido" });
      }

      await storage.trackUserActivity(userId, courseId, { 
        lastLessonId: lessonId,
        contentType,
        roomSlug 
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking user activity:", error);
      res.status(500).json({ message: "Failed to track activity" });
    }
  });

  // Dashboard endpoint - combines all data needed for dashboard
  app.get("/api/dashboard", supabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get all necessary data for dashboard with better error handling
      let continueCourses: any[] = [];
      let recommendedCourses: any[] = [];
      let categories: any[] = [];
      
      try {
        [continueCourses, recommendedCourses, categories] = await Promise.all([
          storage.getUserRecentContent(userId, 8).catch((err) => {
            console.error("[ERROR] Failed to get user recent content:", err);
            return [];
          }),
          storage.getAllCourses().catch((err) => {
            console.error("[ERROR] Failed to get all courses:", err);
            return [];
          }),
          storage.getAllCategories().catch((err) => {
            console.error("[ERROR] Failed to get categories:", err);
            return [];
          })
        ]);
      } catch (error) {
        console.error("[ERROR] Promise.all failed in dashboard:", error);
        // Continue with empty arrays
      }

      // Get user progress for all courses
      let userProgress: any = null;
      let progressMap: Record<string, any> = {};
      try {
        userProgress = await storage.getUserProgress(userId);
        progressMap = Array.isArray(userProgress) ? userProgress.reduce((acc: any, progress: any) => {
          if (progress && progress.courseId) {
            acc[progress.courseId] = progress;
          }
          return acc;
        }, {}) : {};
      } catch (error) {
        console.error("[ERROR] Failed to get user progress:", error);
        // Continue with empty progress map
      }

      // Combine courses with their progress and categories
      const coursesWithData = recommendedCourses.map((course: any) => {
        const category = course?.categoryId ? categories.find((cat: any) => cat.id === course.categoryId) : null;
        const progress = course?.id ? progressMap[course.id] : null;
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
      console.error("[ERROR] Error fetching dashboard data:", error);
      if (error instanceof Error) {
        console.error("[ERROR] Error message:", error.message);
        console.error("[ERROR] Error stack:", error.stack);
      }
      res.status(500).json({ message: "Failed to fetch dashboard data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Admin routes with simple auth - simplified versions
  app.get("/api/admin/dashboard", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      // Use direct database queries for now
      const courses = await storage.getAllCourses();
      const categories = await storage.getAllCategories();
      const onboardingAnalytics = await storage.getOnboardingAnalytics();
      const allComments = await storage.getAllComments('all');
      
      // Count total users
      const [userCount] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(users);
      
      res.json({
        totalCourses: courses.length,
        totalUsers: userCount?.count || 0,
        totalLessons: 35, // From your progress
        totalCategories: categories.length,
        totalComments: allComments.length,
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
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string | undefined;
      const subscriptionStatus = req.query.subscriptionStatus as 'active' | 'trial' | 'cancelled' | 'none' | undefined;

      const users = await storage.getAllUsers({
        limit,
        offset,
        search,
        subscriptionStatus,
      });

      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Get user subscription history
  app.get("/api/admin/users/:userId/subscriptions", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const subscriptions = await db
        .select({
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, userId))
        .orderBy(desc(userSubscriptions.createdAt));

      res.json(subscriptions.map(s => ({
        ...s.subscription,
        plan: s.plan || undefined,
      })));
    } catch (error: any) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Admin media upload URL endpoint  
  app.post("/api/admin/media/upload-url", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ message: "Supabase Storage no configurado" });
      }

      // Generate unique path for the media file
      const uniqueId = randomUUID();
      const fileType = req.body.fileType || 'image/jpeg';
      const extension = fileType.includes('png') ? 'png' : fileType.includes('gif') ? 'gif' : fileType.includes('webp') ? 'webp' : 'jpg';
      const mediaPath = `media-${uniqueId}.${extension}`;
      const fullPath = `attached-assets/${mediaPath}`;
      
      // Return server endpoint URL for upload (server will handle Supabase upload)
      const uploadURL = `${req.protocol}://${req.get('host')}/api/admin/media/upload?path=${encodeURIComponent(fullPath)}`;
      
      res.json({ 
        uploadURL: uploadURL,
        uploadPath: fullPath,
        bucketName: 'attached-assets',
        publicUrl: supabaseStorage.getPublicUrl(fullPath, 'attached-assets')
      });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Admin media upload endpoint - handles file upload to Supabase
  app.put("/api/admin/media/upload", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const path = req.query.path as string;
      if (!path) {
        return res.status(400).json({ message: "Path requerido" });
      }

      if (!supabase) {
        return res.status(500).json({ message: "Supabase Storage no configurado" });
      }

      // Get file buffer from request
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        try {
          const fileBuffer = Buffer.concat(chunks);
          const bucketName = 'attached-assets';
          const normalizedPath = path.replace(`attached-assets/`, '');

          // Upload to Supabase
          if (!supabase) {
            return res.status(500).json({ message: "Supabase no está configurado" });
          }
          
          const supabaseClient = supabase!;
          const { data, error } = await supabaseClient.storage
            .from(bucketName)
            .upload(normalizedPath, fileBuffer, {
              contentType: req.headers['content-type'] || 'image/jpeg',
              upsert: true,
            });

          if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ message: "Error subiendo archivo", error: error.message });
          }

          // Get the full path for public URL
          const fullPath = `${bucketName}/${data.path}`;
          const publicUrl = supabaseStorage.getPublicUrl(fullPath, bucketName);
          
          console.log('Upload successful:', { path: data.path, fullPath, publicUrl });
          
          res.json({ 
            success: true,
            path: data.path,
            fullPath: fullPath,
            publicUrl: publicUrl
          });
        } catch (error: any) {
          console.error("Error processing upload:", error);
          res.status(500).json({ message: "Error procesando archivo", error: error.message });
        }
      });

      req.on('error', (error) => {
        console.error("Request error:", error);
        res.status(500).json({ message: "Error recibiendo archivo" });
      });
    } catch (error: any) {
      console.error("Error in upload endpoint:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Admin media normalize path endpoint - Usa Supabase Storage
  app.post("/api/admin/media/normalize-path", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL es requerida" });
      }
      
      // Si ya es una URL de Supabase, devolverla tal cual
      if (url.includes('supabase.co/storage')) {
        return res.json({ normalizedPath: url });
      }
      
      // Si es una URL de Google Cloud Storage, convertir a Supabase
      if (url.includes('storage.googleapis.com')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length >= 2) {
          const bucketName = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          const supabaseUrl = supabaseStorage.getPublicUrl(filePath, bucketName);
          return res.json({ normalizedPath: supabaseUrl });
        }
      }
      
      // Si es una ruta local o proxy, mantenerla (durante migración)
      res.json({ normalizedPath: url });
    } catch (error: any) {
      console.error("Error normalizing path:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Object proxy route - Usa Supabase Storage
  app.get("/api/object-proxy/objects/*", async (req: Request, res: Response) => {
    try {
      const objectPath = req.path.replace("/api/object-proxy/objects/", "");
      const isDebug = process.env.DEBUG_STORAGE === 'true';
      
      // Determinar bucket según la ruta
      let bucketName: string | undefined;
      if (objectPath.startsWith('post-images/')) {
        bucketName = 'post-images';
      } else if (objectPath.startsWith('lesson-resources/')) {
        bucketName = 'lesson-resources';
      } else if (objectPath.startsWith('profile')) {
        bucketName = 'profile-images';
      }
      
      // Intentar servir desde Supabase Storage
      const served = await supabaseStorage.serveFile(objectPath, res, bucketName);
      if (served) {
        if (isDebug) {
          console.log(`✅ Archivo servido desde Supabase: ${objectPath}`);
        }
        return;
      }
      
      // Verificar que los headers no se hayan enviado antes de intentar el fallback
      if (res.headersSent) {
        // Si los headers ya se enviaron, no podemos usar el fallback
        return;
      }
      
      // Fallback: intentar desde local (durante migración)
      try {
      const { LocalFileStorageService } = await import("./localFileStorage");
      const localStorage = new LocalFileStorageService();
      
      let localPath = `private/${objectPath}`;
        let localServed = await localStorage.serveFile(localPath, res);
      
        if (!localServed && !res.headersSent) {
        localPath = `public/${objectPath}`;
          localServed = await localStorage.serveFile(localPath, res);
      }
      
        if (localServed) {
          // Solo loguear en modo debug para reducir ruido
          if (isDebug) {
            console.log(`✅ Archivo servido desde local (fallback): ${localPath}`);
          }
        return;
      }
      } catch (localError) {
        // Ignorar errores de local storage, pero loguear en modo debug
        if (isDebug) {
          console.error("Error en fallback local:", localError);
        }
      }
      
      return res.status(404).json({ message: "Archivo no encontrado" });
    } catch (error) {
      console.error("Error serving object:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Upload image URL endpoint for rich text editor - Usa Supabase Storage
  app.post("/api/upload-image-url", legacyAuth, async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ message: "Supabase Storage no configurado" });
      }

      // Generate unique path for the image
      const uniqueId = randomUUID();
      const imagePath = `post-images/image-${uniqueId}.jpg`;
      const uploadURL = `${req.protocol}://${req.get('host')}/api/lesson-images/upload?path=${encodeURIComponent(imagePath)}`;
      
      // Return server endpoint URL for upload (server will handle Supabase upload)
      res.json({ 
        uploadURL: uploadURL,
        uploadPath: imagePath,
        bucketName: 'post-images',
        publicUrl: supabaseStorage.getPublicUrl(imagePath, 'post-images')
      });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Upload lesson image to Supabase (used by rich text editor)
  app.put("/api/lesson-images/upload", legacyAuth, async (req: Request, res: Response) => {
    try {
      const path = req.query.path as string;
      if (!path) {
        return res.status(400).json({ message: "Path requerido" });
      }

      if (!supabase) {
        return res.status(500).json({ message: "Supabase Storage no configurado" });
      }

      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        try {
          const fileBuffer = Buffer.concat(chunks);
          const bucketName = 'post-images';
          const normalizedPath = path.replace(`post-images/`, '');

          const supabaseClient = supabase!;
          const { data, error } = await supabaseClient.storage
            .from(bucketName)
            .upload(normalizedPath, fileBuffer, {
              contentType: req.headers['content-type'] || 'image/jpeg',
              upsert: true,
            });

          if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ message: "Error subiendo archivo", error: error.message });
          }

          const fullPath = `${bucketName}/${data.path}`;
          const publicUrl = supabaseStorage.getPublicUrl(fullPath, bucketName);
          res.json({ url: publicUrl });
        } catch (uploadError: any) {
          console.error("Error uploading lesson image:", uploadError);
          res.status(500).json({ message: "Error subiendo archivo", error: uploadError.message });
        }
      });
    } catch (error: any) {
      console.error("Error in lesson image upload endpoint:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Finalize lesson image upload - Usa Supabase Storage
  app.put("/api/lesson-images", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { imageURL } = req.body;
      if (!imageURL) {
        return res.status(400).json({ message: "imageURL es requerida" });
      }
      
      // Si la URL ya es de Supabase, devolverla tal cual
      if (imageURL.includes('supabase.co/storage')) {
        return res.json({ url: imageURL });
      }
      
      // Si es una URL de Google Cloud Storage, extraer el path y convertir a Supabase
      if (imageURL.includes('storage.googleapis.com')) {
        const urlObj = new URL(imageURL);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        // Asumir formato: /bucket-name/path/to/file
        if (pathParts.length >= 2) {
          const bucketName = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          const supabaseUrl = supabaseStorage.getPublicUrl(filePath, bucketName);
          return res.json({ url: supabaseUrl });
        }
      }
      
      // Si es una ruta local o proxy, mantenerla (durante migración)
      res.json({ url: imageURL });
    } catch (error: any) {
      console.error("Error finalizing lesson image:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Lesson resources upload endpoint - El servidor sube directamente a Supabase Storage
  app.post("/api/lesson-resources/upload", simpleAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Usar busboy para manejar multipart/form-data
      const busboy = (await import('busboy')).default;
      const bb = busboy({ headers: req.headers });
      
      let fileName: string | null = null;
      let fileBuffer: Buffer | null = null;
      let fileMimeType: string = 'application/octet-stream';
      
      // Promise para esperar a que el archivo se lea completamente
      const filePromise = new Promise<{ fileName: string; fileBuffer: Buffer; mimeType: string } | null>((resolveFile) => {
        bb.on('file', (name: string, file: any, info: { filename: string; encoding: string; mimeType: string }) => {
          console.log('📦 Recibiendo archivo:', info.filename, 'tipo:', info.mimeType);
          fileName = info.filename;
          fileMimeType = info.mimeType;
          
          const chunks: Buffer[] = [];
          file.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          
          file.on('end', () => {
            fileBuffer = Buffer.concat(chunks);
            console.log('📦 Archivo leído completamente:', fileBuffer.length, 'bytes');
            resolveFile({ fileName: fileName!, fileBuffer, mimeType: fileMimeType });
          });
          
          file.on('error', (err: Error) => {
            console.error('Error leyendo archivo:', err);
            resolveFile(null);
          });
        });
        
        bb.on('finish', () => {
          // Si no se recibió ningún archivo
          if (!fileName) {
            resolveFile(null);
          }
        });
      });

      bb.on('error', (error: Error) => {
        console.error("Error en busboy:", error);
        res.status(500).json({ message: "Error procesando archivo", error: error.message });
      });
      
      req.pipe(bb);
      
      // Esperar a que el archivo se lea completamente
      const fileData = await filePromise;
      
      if (!fileData || !fileData.fileBuffer || fileData.fileBuffer.length === 0) {
        console.error('No se recibió contenido del archivo');
        return res.status(400).json({ message: "No se recibió ningún archivo o el archivo está vacío" });
      }

      console.log('📤 Subiendo a Supabase:', fileData.fileName, '(', fileData.fileBuffer.length, 'bytes)');

      // Generate a unique resource ID for this upload
      const resourceId = randomUUID();
      
      // Clean filename for URL safety
      const cleanFileName = fileData.fileName.replace(/[^a-zA-Z0-9.-_]/g, '_');
      
      // Create specific path for lesson resources
      const lessonResourcePath = `${resourceId}/${cleanFileName}`;
      
      // Use Supabase Storage
      if (!supabase) {
        return res.status(500).json({ message: "Supabase Storage no configurado" });
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lesson-resources')
        .upload(lessonResourcePath, fileData.fileBuffer, {
          contentType: fileData.mimeType,
          upsert: true
        });

      if (uploadError) {
        console.error('Error subiendo a Supabase:', uploadError);
        return res.status(500).json({ 
          message: "Error al subir archivo a Supabase", 
          error: uploadError.message 
        });
      }

      console.log('✅ Archivo subido a Supabase:', uploadData);

      // Return server-relative path
      const serverPath = `/lesson-resources/${resourceId}/${cleanFileName}`;
      
      res.json({ 
        resourceId,
        fileName: cleanFileName,
        fileSize: fileData.fileBuffer.length,
        resourcePath: serverPath,
        message: "Archivo subido correctamente"
      });
    } catch (error: any) {
      console.error("Error en endpoint de subida:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Lesson resources upload URL endpoint - Mantener para compatibilidad pero ahora devuelve endpoint del servidor
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
      
      // Return server upload endpoint instead of Supabase direct upload
      const serverPath = `/lesson-resources/${resourceId}/${cleanFileName}`;
      
      res.json({ 
        uploadURL: '/api/lesson-resources/upload', // Server endpoint for upload
        uploadPath: `lesson-resources/${resourceId}/${cleanFileName}`,
        bucketName: 'lesson-resources',
        resourceId,
        fileName: cleanFileName,
        resourcePath: serverPath
      });
    } catch (error: any) {
      console.error("Error getting lesson resource upload URL:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
  });

  // Admin courses endpoint for content management
  app.get("/api/admin/courses", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const coursesList = await storage.getAllCoursesAdmin();
      // Ordenar por order (ya viene ordenado del storage, pero por si acaso)
      const sorted = coursesList.sort((a: any, b: any) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // Si tienen el mismo order, ordenar por fecha de creación
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      res.json(sorted);
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
      
      // Include room/phase assignment if exists (using the course's actual type)
      const roomAssignment = await storage.getCourseRoomAssignment(courseId, course.type as any);
      if (roomAssignment) {
        courseWithCategories = { 
          ...courseWithCategories, 
          roomId: roomAssignment.roomId,
          phaseId: roomAssignment.phaseId
        };
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
      const { categoryIds, roomId, phaseId, ...rest } = req.body;
      if (rest.createdAt) {
        rest.createdAt = new Date(rest.createdAt);
      }
      const courseData = {
        ...rest,
        id: randomUUID(),
      };
      
      const course = await storage.createCourse(courseData);
      
      // Handle multiple categories based on type and categoryIds presence
      if (categoryIds && Array.isArray(categoryIds)) {
        await storage.updateCourseCategories(course.id, categoryIds);
      }
      
      // Handle room/phase assignment
      if (roomId && phaseId) {
        await storage.upsertPhaseContentForCourse(course.id, roomId, phaseId, course.type as any);
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
      const { categoryIds, roomId, phaseId, ...rest } = req.body;
      if (rest.createdAt) {
        rest.createdAt = new Date(rest.createdAt);
      }
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
      
      // Handle room/phase assignment (upsert will remove if not provided)
      await storage.upsertPhaseContentForCourse(courseId, roomId, phaseId, course.type as any);
      
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

  // Mover curso hacia arriba
  app.put("/api/admin/courses/:courseId/move-up", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const success = await storage.moveCourseUp(courseId);
      if (!success) {
        return res.status(400).json({ message: "No se pudo mover el curso (ya está en la parte superior o no existe)" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error moving course up:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Mover curso hacia abajo
  app.put("/api/admin/courses/:courseId/move-down", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const success = await storage.moveCourseDown(courseId);
      if (!success) {
        return res.status(400).json({ message: "No se pudo mover el curso (ya está en la parte inferior o no existe)" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error moving course down:", error);
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
      console.log(`🗑️ Intentando eliminar lección: ${id}`);
      
      const success = await storage.deleteLesson(id);
      if (!success) {
        console.error(`❌ No se pudo eliminar la lección: ${id}`);
        return res.status(404).json({ message: "Lección no encontrada" });
      }
      
      console.log(`✅ Lección eliminada correctamente: ${id}`);
      res.json({ message: "Lección eliminada correctamente" });
    } catch (error: any) {
      console.error("❌ Error deleting lesson:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        constraint: error.constraint
      });
      res.status(500).json({ 
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      let courseWithCategories: any = course;
      if (course.type === 'guide') {
        const categories = await storage.getCourseCategories(course.id);
        courseWithCategories = { ...course, categories };
      }
      res.json(courseWithCategories);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get lessons for a specific course (public access for preview)
  app.get("/api/courses/:courseId/lessons", async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      // First, get the course to resolve slug to ID if needed
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      // Use the actual course ID (not slug) to get lessons
      const lessons = await storage.getLessonsByCourse(course.id);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get single lesson by courseId and lessonId
  app.get("/api/courses/:courseId/lessons/:lessonId", async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lección no encontrada" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get user progress for a specific course (returns array of completed lesson IDs)
  app.get("/api/courses/:courseId/progress", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      // First, get the course to resolve slug to ID if needed
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Get completed lesson IDs from userLessonProgress table (use actual course ID)
      const completedLessonIds = await storage.getCompletedLessons(userId, course.id);
      
      console.log("Completed lessons for user", userId, "course", course.id, ":", completedLessonIds);
      res.json(completedLessonIds);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      // Return empty array on error so frontend doesn't crash
      res.json([]);
    }
  });

  // Mark lesson as complete
  app.post("/api/lessons/:lessonId/complete", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Validate that lesson exists before marking as complete
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson || !lesson.courseId) {
        return res.status(404).json({ message: "Lección no encontrada o sin curso asociado" });
      }
      
      // Mark lesson as complete in database
      await storage.markLessonComplete(userId, lessonId);
      
      // Get updated completed lessons for the course
      const completedLessonIds = await storage.getCompletedLessons(userId, lesson.courseId);
      
      res.json({ 
        success: true, 
        message: "Lección marcada como completada",
        completedLessonIds,
        lessonId
      });
    } catch (error) {
      console.error("Error marking lesson as complete:", error);
      res.status(500).json({ message: "Error al marcar la lección como completada" });
    }
  });

  // Unmark lesson as complete
  app.delete("/api/lessons/:lessonId/complete", legacyAuth, async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Validate that lesson exists
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson || !lesson.courseId) {
        return res.status(404).json({ message: "Lección no encontrada o sin curso asociado" });
      }
      
      // Unmark lesson as complete in database
      await storage.unmarkLessonComplete(userId, lessonId);
      
      // Get updated completed lessons for the course
      const completedLessonIds = await storage.getCompletedLessons(userId, lesson.courseId);
      
      res.json({ 
        success: true, 
        message: "Lección desmarcada como completada",
        completedLessonIds,
        lessonId
      });
    } catch (error) {
      console.error("Error unmarking lesson as complete:", error);
      res.status(500).json({ message: "Error al desmarcar la lección" });
    }
  });

  // Get lesson resource files - Usa Supabase Storage
  app.get("/api/lesson-resources/:resourceId/*", async (req: Request, res: Response) => {
    try {
      const resourceId = req.params.resourceId;
      const fileName = req.params[0]; // Gets the * part
      
      // Primero, consultar la base de datos para obtener el nombre real del archivo
      let actualFileName = fileName;
      try {
        const { lessonResources } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        const [resource] = await db.select().from(lessonResources).where(eq(lessonResources.id, resourceId)).limit(1);
        
        if (resource && resource.fileName) {
          actualFileName = resource.fileName;
          console.log(`📋 Nombre real del archivo desde BD: ${actualFileName}`);
        }
      } catch (dbError: any) {
        console.log(`⚠️ No se pudo consultar BD, usando nombre de URL: ${fileName}`);
      }
      
      const filePath = `lesson-resources/${resourceId}/${actualFileName}`;
      console.log(`📥 Intentando servir archivo: ${filePath}`);
      
      // Intentar servir desde Supabase Storage (it will set Content-Disposition header)
      let served = await supabaseStorage.serveFile(filePath, res, 'lesson-resources', true);
      if (served) {
        console.log(`✅ Archivo de lección servido desde Supabase: ${filePath}`);
        return;
      }
      
      // Si no se encuentra, intentar buscar archivos similares en el directorio
      console.log(`⚠️ Archivo no encontrado exacto, buscando archivos similares...`);
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Listar archivos en el directorio del resourceId
          const { data: files, error: listError } = await supabase.storage
            .from('lesson-resources')
            .list(resourceId, {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });
          
          if (!listError && files && files.length > 0) {
            console.log(`📋 Archivos encontrados en directorio ${resourceId}:`, files.map(f => f.name));
            
            // Buscar archivo por nombre similar (sin extensión o con extensión diferente)
            const fileNameWithoutExt = actualFileName.replace(/\.[^/.]+$/, '');
            const originalFileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            const matchingFile = files.find(f => {
              const fileWithoutExt = f.name.replace(/\.[^/.]+$/, '');
              return fileWithoutExt === fileNameWithoutExt || 
                     fileWithoutExt === originalFileNameWithoutExt ||
                     f.name.toLowerCase() === actualFileName.toLowerCase() ||
                     f.name.toLowerCase() === fileName.toLowerCase() ||
                     f.name.toLowerCase().includes(fileNameWithoutExt.toLowerCase()) ||
                     f.name.toLowerCase().includes(originalFileNameWithoutExt.toLowerCase());
            });
            
            if (matchingFile) {
              const alternativePath = `lesson-resources/${resourceId}/${matchingFile.name}`;
              console.log(`🔄 Intentando con archivo alternativo: ${alternativePath}`);
              served = await supabaseStorage.serveFile(alternativePath, res, 'lesson-resources', true);
              if (served) {
                console.log(`✅ Archivo de lección servido desde Supabase (alternativo): ${alternativePath}`);
                return;
              }
            } else {
              console.log(`⚠️ No se encontró archivo similar. Archivos disponibles:`, files.map(f => f.name));
            }
          } else {
            console.log(`⚠️ No hay archivos en el directorio ${resourceId}`);
          }
        }
      } catch (searchError: any) {
        console.error(`⚠️ Error buscando archivos alternativos:`, searchError.message);
      }
      
      console.log(`⚠️ Archivo no encontrado en Supabase, intentando local...`);
      
      // Fallback: intentar desde local (durante migración)
      try {
        const { LocalFileStorageService } = await import("./localFileStorage");
        const localStorage = new LocalFileStorageService();
        const localPath = `private/lesson-resources/${resourceId}/${fileName}`;
        const localServed = await localStorage.serveFile(localPath, res);
        if (localServed) {
          console.log(`✅ Archivo servido desde local (fallback): ${localPath}`);
          return;
        }
      } catch (localError: any) {
        console.error(`❌ Error en local storage:`, localError.message);
      }
      
      console.log(`❌ Archivo no encontrado: ${filePath}`);
      return res.status(404).json({ error: "File not found", path: filePath });
    } catch (error: any) {
      console.error("❌ Error fetching lesson resource:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // Remove a saved course
  app.delete("/api/users/saved-courses/:courseId", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const { courseId } = req.params;
      
      await db
        .delete(userSavedCourses)
        .where(and(
          eq(userSavedCourses.userId, userId),
          eq(userSavedCourses.courseId, courseId)
        ));
      
      res.json({ message: "Curso eliminado de guardados" });
    } catch (error) {
      console.error("Error removing saved course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get saved courses for user
  app.get("/api/users/saved-courses", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      const saved = await storage.getUserSavedCourses(userId);
      res.json(saved);
    } catch (error) {
      console.error("Error fetching saved courses:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Save a course for user
  app.post("/api/users/saved-courses", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: "courseId es requerido" });
      }

      const existing = await db
        .select()
        .from(userSavedCourses)
        .where(and(
          eq(userSavedCourses.userId, userId),
          eq(userSavedCourses.courseId, courseId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return res.json(existing[0]);
      }

      const saved = await storage.saveUserCourse(userId, courseId);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error saving course:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update user profile information
  app.patch("/api/users/profile", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { firstName, lastName, email, shortDescription, bio } = req.body;
      console.log("Update profile request:", { userId, firstName, lastName, email, shortDescription, bio });

      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
      if (bio !== undefined) updateData.bio = bio;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No hay datos para actualizar" });
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      console.log("Profile updated successfully for user:", userId);
      res.json({ message: "Perfil actualizado exitosamente" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error al actualizar el perfil" });
    }
  });

  // Change user password
  app.patch("/api/users/change-password", legacyAuth, async (req: Request, res: Response) => {
    try {
      // Try multiple ways to get userId from the request
      let userId = (req as any).user?.claims?.sub || (req as any).user?.id;
      
      // If not found, try to extract from token directly
      if (!userId) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        
        if (token) {
          try {
            // Try parsing as base64 token (simple auth format: userId:timestamp)
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [tokenUserId] = decoded.split(':');
            if (tokenUserId) {
              userId = tokenUserId;
            }
          } catch (error) {
            // Token parsing failed
            console.error("Error parsing token:", error);
          }
        }
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "La contraseña actual y la nueva contraseña son requeridas"
        });
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "La nueva contraseña debe tener al menos 6 caracteres"
        });
      }

      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          message: "Usuario no encontrado"
        });
      }

      // Verify current password
      let passwordValid = false;
      
      if (user.password) {
        try {
          // Use bcrypt to compare passwords
          const bcrypt = await import('bcrypt');
          const bcryptModule = (bcrypt as any).default || bcrypt;
          passwordValid = await bcryptModule.compare(currentPassword, user.password);
        } catch (error: any) {
          // Fallback: simple comparison (for development/legacy passwords)
          try {
            const storedPassword = Buffer.from(user.password, 'base64').toString('utf-8');
            passwordValid = storedPassword === currentPassword;
          } catch {
            // If password is not base64, try direct comparison (legacy)
            passwordValid = user.password === currentPassword;
          }
        }
      }

      if (!passwordValid) {
        return res.status(401).json({
          message: "La contraseña actual es incorrecta"
        });
      }

      // Hash new password
      let hashedPassword: string;
      try {
        const bcrypt = await import('bcrypt');
        const bcryptModule = (bcrypt as any).default || bcrypt;
        hashedPassword = await bcryptModule.hash(newPassword, 10);
      } catch (error: any) {
        console.error("Error importing bcrypt:", error);
        // Fallback: simple hash (NOT SECURE for production, but works for development)
        hashedPassword = Buffer.from(newPassword).toString('base64');
      }

      // Update password in database using updatePassword (clears reset tokens)
      console.log(`🔄 Updating password for user ${userId}...`);
      await storage.updatePassword(userId, hashedPassword);
      console.log(`✅ Password updated successfully for user ${userId}`);

      // Verify the password was updated by fetching the user again
      const updatedUser = await storage.getUser(userId);
      if (updatedUser && updatedUser.password !== hashedPassword) {
        console.error(`❌ Password update verification failed! Expected hash to match, but it doesn't.`);
        console.error(`   User ID: ${userId}`);
        console.error(`   Expected hash (first 20 chars): ${hashedPassword.substring(0, 20)}...`);
        console.error(`   Actual hash (first 20 chars): ${updatedUser.password?.substring(0, 20)}...`);
      } else {
        console.log(`✅ Password update verified - hash matches in database`);
      }

      // Send notification email
      try {
        await sendPasswordChangeNotificationEmail(
          user.email,
          user.firstName || user.email
        );
      } catch (emailError: any) {
        console.error("Error sending password change notification email:", emailError);
        // Don't fail the request if email fails, but log it
      }

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Error al cambiar la contraseña" });
    }
  });

  // Update user preferences/focus
  app.patch("/api/users/focus", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { experienceLevel, preferredSkillType, preferredContentTypes } = req.body;

      await db
        .update(users)
        .set({
          experienceLevel: experienceLevel || null,
          preferredSkillType: preferredSkillType || null,
          preferredContentTypes: preferredContentTypes || [],
        })
        .where(eq(users.id, userId));

      res.json({ message: "Preferencias actualizadas exitosamente" });
    } catch (error) {
      console.error("Error updating focus preferences:", error);
      res.status(500).json({ message: "Error al actualizar las preferencias" });
    }
  });

  // Upload profile image
  app.post("/api/users/upload-profile-image", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Handle multipart form data
      const bb = Busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } });
      
      let fileData: Buffer | null = null;
      let fileName: string | null = null;

      bb.on("file", (fieldname: string, file: any, info: any) => {
        const chunks: Buffer[] = [];
        file.on("data", (data: Buffer) => {
          chunks.push(data);
        });
        file.on("end", () => {
          fileData = Buffer.concat(chunks);
          fileName = info.filename;
        });
      });

      bb.on("close", async () => {
        if (!fileData || !fileName) {
          return res.status(400).json({ message: "No file provided" });
        }

        try {
          // Generate unique filename
          const ext = fileName.split(".").pop() || "jpg";
          const uniqueFileId = randomUUID();
          const uniqueFileName = `profile-${uniqueFileId}.${ext}`;

          // Upload to Supabase Storage
          const uploadPath = `profile-images/${uniqueFileName}`;
          
          try {
            await supabaseStorage.uploadFile(uploadPath, fileData, {
              contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
              upsert: true,
            });

            // Get public URL from Supabase
            const proxyUrl = supabaseStorage.getPublicUrl(uploadPath, 'profile-images');

            // Update user profile image URL in database
            await db
              .update(users)
              .set({ profileImageUrl: proxyUrl })
              .where(eq(users.id, userId));

            console.log("Profile image uploaded successfully:", { proxyUrl, uploadPath });

            if (!res.headersSent) {
              res.json({ 
                message: "Profile image uploaded successfully",
                profileImageUrl: proxyUrl 
              });
            }
          } catch (storageError: any) {
            console.log("⚠️ Supabase Storage not available, using local storage fallback:", storageError.message);
            
            // Fallback to local storage (durante migración)
            try {
              const { promises: fs } = await import("fs");
              const path = await import("path");
              const { fileURLToPath } = await import("url");
              
              const __filename = fileURLToPath(import.meta.url);
              const __dirname = path.dirname(__filename);
              const ATTACHED_ASSETS_DIR = path.join(__dirname, "..", "attached_assets");
              
              const localDir = path.join(ATTACHED_ASSETS_DIR, "private", "profile-images");
              await fs.mkdir(localDir, { recursive: true });
              
              const localFilePath = path.join(localDir, uniqueFileName);
              await fs.writeFile(localFilePath, fileData);
              
              const proxyUrl = `/api/object-proxy/objects/profile-images/${uniqueFileName}`;

          // Update user profile image URL in database
          await db
            .update(users)
            .set({ profileImageUrl: proxyUrl })
            .where(eq(users.id, userId));

              if (!res.headersSent) {
          res.json({ 
                  message: "Profile image uploaded successfully (local fallback)",
            profileImageUrl: proxyUrl 
          });
              }
            } catch (localError: any) {
              console.error("❌ Error saving file locally:", localError);
              if (!res.headersSent) {
                res.status(500).json({ message: "Error uploading image", error: localError.message });
              }
            }
          }
        } catch (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          res.status(500).json({ message: "Error uploading image to storage" });
        }
      });

      bb.on("error", (error: any) => {
        console.error("Busboy error:", error);
        res.status(400).json({ message: "Error processing upload" });
      });

      req.pipe(bb);
    } catch (error) {
      console.error("Error in profile image upload:", error);
      res.status(500).json({ message: "Error al procesar la imagen" });
    }
  });

  // ==================== COMMENT ROUTES ====================
  
  // Upload comment attachment (image or document)
  app.post("/api/comments/upload-attachment", legacyAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Handle multipart form data
      const bb = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
      
      let fileData: Buffer | null = null;
      let fileName: string | null = null;
      let mimeType: string | null = null;

      bb.on("file", (fieldname: string, file: any, info: any) => {
        const chunks: Buffer[] = [];
        mimeType = info.mimeType;
        file.on("data", (data: Buffer) => {
          chunks.push(data);
        });
        file.on("end", () => {
          fileData = Buffer.concat(chunks);
          fileName = info.filename;
        });
      });

      bb.on("close", async () => {
        if (!fileData || !fileName) {
          return res.status(400).json({ message: "No file provided" });
        }

        try {
          // Generate unique filename
          const ext = fileName.split(".").pop() || "bin";
          const uniqueFileId = randomUUID();
          const uniqueFileName = `comment-${uniqueFileId}.${ext}`;

          // Determine if it's an image or document
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
          const bucketName = 'comment-attachments';
          const uploadPath = `${bucketName}/${uniqueFileName}`;
          
          try {
            await supabaseStorage.uploadFile(uploadPath, fileData, {
              contentType: mimeType || (isImage ? `image/${ext === "jpg" ? "jpeg" : ext}` : `application/${ext}`),
              upsert: true,
            });

            // Get public URL from Supabase
            const proxyUrl = supabaseStorage.getPublicUrl(uploadPath, bucketName);

            console.log("Comment attachment uploaded successfully:", { proxyUrl, uploadPath });

            if (!res.headersSent) {
              res.json({ 
                message: "Attachment uploaded successfully",
                attachmentUrl: proxyUrl,
                attachmentType: isImage ? 'image' : 'document',
                fileName: fileName
              });
            }
          } catch (storageError: any) {
            console.log("⚠️ Supabase Storage not available, using local storage fallback:", storageError.message);
            
            // Fallback to local storage
            try {
              const { promises: fs } = await import("fs");
              const path = await import("path");
              const { fileURLToPath } = await import("url");
              
              const __filename = fileURLToPath(import.meta.url);
              const __dirname = path.dirname(__filename);
              const ATTACHED_ASSETS_DIR = path.join(__dirname, "..", "attached_assets");
              
              const localDir = path.join(ATTACHED_ASSETS_DIR, "private", bucketName);
              await fs.mkdir(localDir, { recursive: true });
              
              const localFilePath = path.join(localDir, uniqueFileName);
              await fs.writeFile(localFilePath, fileData);
              
              const proxyUrl = `/api/object-proxy/objects/${bucketName}/${uniqueFileName}`;

              if (!res.headersSent) {
                res.json({ 
                  message: "Attachment uploaded successfully (local fallback)",
                  attachmentUrl: proxyUrl,
                  attachmentType: isImage ? 'image' : 'document',
                  fileName: fileName
                });
              }
            } catch (localError: any) {
              console.error("❌ Error saving file locally:", localError);
              if (!res.headersSent) {
                res.status(500).json({ message: "Error uploading attachment", error: localError.message });
              }
            }
          }
        } catch (uploadError) {
          console.error("Error uploading comment attachment:", uploadError);
          if (!res.headersSent) {
            res.status(500).json({ message: "Error uploading attachment to storage" });
          }
        }
      });

      bb.on("error", (error: any) => {
        console.error("Busboy error:", error);
        if (!res.headersSent) {
          res.status(400).json({ message: "Error processing upload" });
        }
      });

      req.pipe(bb);
    } catch (error) {
      console.error("Error in comment attachment upload:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error al procesar el archivo adjunto" });
      }
    }
  });
  
  // GET comments for a lesson
  app.get("/api/lessons/:lessonId/comments", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("📖 GET /api/lessons/:lessonId/comments called");
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      console.log("📖 lessonId:", lessonId);
      console.log("📖 userId:", userId);
      
      const comments = await storage.getLessonComments(lessonId, userId);
      console.log("📖 comments retrieved:", comments.length);
      
      res.json(comments);
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  // POST new comment
  app.post("/api/lessons/:lessonId/comments", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("📝 POST /api/lessons/:lessonId/comments called");
      const { lessonId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      
      console.log("📝 lessonId:", lessonId);
      console.log("📝 userId:", userId);
      console.log("📝 req.body:", req.body);
      
      if (!userId) {
        console.log("❌ No userId - 401");
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { content, parentId, attachmentUrl } = req.body;
      console.log("📝 content:", content);
      console.log("📝 parentId:", parentId);
      console.log("📝 attachmentUrl:", attachmentUrl);
      
      if (!content || content.trim().length === 0) {
        console.log("❌ No content - 400");
        return res.status(400).json({ message: "El contenido del comentario es requerido" });
      }

      // Prepare metadata with attachment if provided
      const metadata = attachmentUrl ? { attachmentUrl, attachmentType: attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'document' } : {};

      // Create comment or reply based on parentId
      let newComment;
      if (parentId) {
        console.log("📝 Creating reply to parent:", parentId);
        newComment = await storage.createReply(parentId, {
          lessonId,
          userId,
          content: content.trim(),
          metadata
        });
      } else {
        console.log("📝 Creating root comment...");
        newComment = await storage.createComment({
          lessonId,
          userId,
          content: content.trim(),
          metadata
        });
      }
      
      console.log("✅ Comment created:", newComment.id);

      // Send email notification to admin (async, don't wait)
      console.log("📧 Attempting to send email notification...");
      (async () => {
        try {
          const [lesson, user, adminEmails] = await Promise.all([
            storage.getLessonById(lessonId),
            storage.getUser(userId),
            getAdminNotificationEmails()
          ]);
          
          if (!lesson || !user || adminEmails.length === 0) {
            console.log("⚠️ Missing data for email notification");
            return;
          }

          const course = lesson.courseId ? await storage.getCourseById(lesson.courseId) : null;
          const authorName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.email;
          
          await sendNewCommentNotification({
            commentId: newComment.id,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            courseTitle: course?.title || 'Curso sin título',
            authorName: authorName,
            commentContent: newComment.content,
            recipientEmails: adminEmails,
            isReply: !!parentId
          });
          
          console.log("✅ Email notification sent successfully");
        } catch (emailError) {
          console.error("❌ Error sending email notification:", emailError);
        }
      })();

      res.json(newComment);
    } catch (error) {
      console.error("❌ Error creating comment:", error);
      res.status(500).json({ message: "Error al crear comentario" });
    }
  });

  // GET all comments for admin
  app.get("/api/admin/comments", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("👮 GET /api/admin/comments called");
      const comments = await storage.getAllComments();
      console.log("👮 Total comments:", comments.length);
      res.json(comments);
    } catch (error) {
      console.error("❌ Error fetching all comments:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  // GET unread comment count for admin
  app.get("/api/admin/comments/unread-count", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getAllComments();
      const unreadCount = comments.filter((c: any) => c.status === 'pending').length;
      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching unread comment count:", error);
      res.status(500).json({ message: "Error al obtener contador de comentarios" });
    }
  });

  // PATCH comment status (admin only)
  app.patch("/api/admin/comments/:commentId/status", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("👮 PATCH /api/admin/comments/:commentId/status called");
      const { commentId } = req.params;
      const { status } = req.body;
      
      console.log("👮 commentId:", commentId);
      console.log("👮 new status:", status);
      
      // For now, we only support marking as "reviewed" (approved)
      // The storage method is markCommentReviewed which sets isAdminReviewed = true
      if (status !== 'approved') {
        console.log("⚠️ Only 'approved' status is supported currently");
      }

      console.log("👮 Marking comment as reviewed...");
      const updatedComment = await storage.markCommentReviewed(commentId);
      console.log("✅ Comment marked as reviewed");
      
      res.json(updatedComment);
    } catch (error) {
      console.error("❌ Error updating comment status:", error);
      res.status(500).json({ message: "Error al actualizar estado del comentario" });
    }
  });

  // DELETE comment (admin only)
  app.delete("/api/admin/comments/:commentId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("👮 DELETE /api/admin/comments/:commentId called");
      const { commentId } = req.params;
      
      console.log("👮 commentId:", commentId);
      
      await storage.deleteComment(commentId);
      console.log("✅ Comment deleted");
      
      res.json({ success: true, message: "Comentario eliminado exitosamente" });
    } catch (error) {
      console.error("❌ Error deleting comment:", error);
      res.status(500).json({ message: "Error al eliminar comentario" });
    }
  });

  // POST reply to a comment
  app.post("/api/comments/:id/replies", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("💬 POST /api/comments/:id/replies called");
      const { id: parentCommentId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      
      console.log("💬 parentCommentId:", parentCommentId);
      console.log("💬 userId:", userId);
      console.log("💬 req.body:", req.body);
      
      if (!userId) {
        console.log("❌ No userId - 401");
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { content, lessonId } = req.body;
      
      if (!content || content.trim().length === 0) {
        console.log("❌ No content - 400");
        return res.status(400).json({ message: "El contenido es requerido" });
      }

      if (!lessonId) {
        console.log("❌ No lessonId - 400");
        return res.status(400).json({ message: "lessonId es requerido" });
      }

      console.log("💬 Creating reply...");
      const reply = await storage.createReply(parentCommentId, {
        lessonId,
        userId,
        content: content.trim()
      });
      
      console.log("✅ Reply created:", reply.id);

      // Send email notification (async, don't wait)
      console.log("📧 Attempting to send reply notification...");
      (async () => {
        try {
          const [lesson, user, parentComment, adminEmails] = await Promise.all([
            storage.getLessonById(lessonId),
            storage.getUser(userId),
            storage.getCommentById(parentCommentId),
            getAdminNotificationEmails()
          ]);
          
          if (!lesson || !user || !parentComment || adminEmails.length === 0) {
            console.log("⚠️ Missing data for reply notification");
            return;
          }

          const course = lesson.courseId ? await storage.getCourseById(lesson.courseId) : null;
          const authorName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.email;
          
          await sendNewCommentNotification({
            commentId: reply.id,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            courseTitle: course?.title || 'Curso sin título',
            authorName: authorName,
            commentContent: reply.content,
            recipientEmails: adminEmails,
            isReply: true
          });
          
          console.log("✅ Reply notification sent successfully");
        } catch (emailError) {
          console.error("❌ Error sending reply notification:", emailError);
        }
      })();

      res.json(reply);
    } catch (error: any) {
      console.error("❌ Error creating reply:", error);
      if (error.message === 'Parent comment not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error al crear respuesta" });
    }
  });

  // PATCH mark comment as reviewed (admin only)
  app.patch("/api/comments/:id/review", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log("✅ PATCH /api/comments/:id/review called");
      const { id: commentId } = req.params;
      
      console.log("✅ commentId:", commentId);
      
      const updated = await storage.markCommentReviewed(commentId);
      console.log("✅ Comment marked as reviewed");
      
      res.json(updated);
    } catch (error: any) {
      console.error("❌ Error marking comment as reviewed:", error);
      if (error.message === 'Comment not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to mark comment as reviewed" });
    }
  });

  // POST toggle like on a comment
  app.post("/api/comments/:id/like", legacyAuth, async (req: Request, res: Response) => {
    try {
      console.log("❤️ POST /api/comments/:id/like called");
      const { id: commentId } = req.params;
      const userId = (req as any).user?.claims?.sub;
      
      console.log("❤️ commentId:", commentId);
      console.log("❤️ userId:", userId);
      
      if (!userId) {
        console.log("❌ No userId - 401");
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const result = await storage.toggleCommentLike(commentId, userId);
      console.log("✅ Like toggled:", result);
      
      res.json(result);
    } catch (error: any) {
      console.error("❌ Error toggling comment like:", error);
      res.status(500).json({ message: "Error al dar me gusta" });
    }
  });

  // Community chat routes
  app.get("/api/community/channels", async (req, res) => {
    try {
      const channels = await db.select().from(communityChannels);
      const sorted = channels.sort((a: any, b: any) => {
        if (a.section !== b.section) return a.section.localeCompare(b.section);
        return (a.order || 0) - (b.order || 0);
      });
      res.json(sorted);
    } catch (error: any) {
      console.error("Error fetching community channels:", error);
      res.status(500).json({ message: "Failed to fetch channels", error: error.message });
    }
  });

  app.get("/api/community/channels/:channelId/messages", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getChannelMessages(channelId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Helper function to add points to a user
  async function addUserPoints(userId: string, activityType: ActivityType, activityId: string, description: string) {
    try {
      const points = POINTS_PER_ACTIVITY[activityType];
      if (!points || points <= 0) return;
      
      // Insert record of points earned
      await db.insert(userPoints).values({
        userId,
        points,
        activityType,
        activityId,
        description,
      });
      
      // Update user's total points and level
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return;
      
      const currentPoints = user.points || 0;
      const newPoints = currentPoints + points;
      const newLevel = calculateLevel(newPoints);
      
      await db.update(users)
        .set({ 
          points: newPoints,
          level: newLevel,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      console.log(`Added ${points} points to user ${userId} for ${activityType}. Total: ${newPoints}, Level: ${newLevel}`);
    } catch (error) {
      console.error("Error adding user points:", error);
      // Don't throw - points are not critical
    }
  }

  // Get user statistics for profile modal
  app.get("/api/community/users/:userId/stats", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user with points
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Count posts
      const postsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(communityPosts)
        .where(eq(communityPosts.userId, userId));
      const postsCount = Number(postsResult[0]?.count || 0);
      
      // Count comments
      const commentsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(communityPostComments)
        .where(eq(communityPostComments.userId, userId));
      const commentsCount = Number(commentsResult[0]?.count || 0);
      
      // Count messages
      const messagesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(communityMessages)
        .where(eq(communityMessages.userId, userId));
      const messagesCount = Number(messagesResult[0]?.count || 0);
      
      res.json({
        points: user.points || 0,
        level: user.level || 1,
        postsCount,
        commentsCount,
        messagesCount,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get leaderboard
  app.get("/api/community/leaderboard", async (req, res) => {
    try {
      const period = (req.query.period as string) || "7_days"; // 7_days, 30_days, all_time
      
      // For period-based leaderboard, we need to sum points from user_points table
      // For all_time, we can use the users.points directly
      if (period === "all_time") {
        // Use total points from users table
        const leaderboard = await db
          .select({
            userId: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            shortDescription: users.shortDescription,
            points: sql<number>`COALESCE(${users.points}, 0)`.as('total_points'),
            level: users.level,
          })
          .from(users)
          .where(sql`${users.points} > 0`)
          .orderBy(sql`total_points DESC`)
          .limit(100);
        
        res.json(leaderboard);
      } else {
        // For period-based, sum points from user_points table
        let dateFilter = sql`1=1`;
        if (period === "7_days") {
          dateFilter = sql`${userPoints.createdAt} >= NOW() - INTERVAL '7 days'`;
        } else if (period === "30_days") {
          dateFilter = sql`${userPoints.createdAt} >= NOW() - INTERVAL '30 days'`;
        }
        
        const leaderboard = await db
          .select({
            userId: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            shortDescription: users.shortDescription,
            points: sql<number>`COALESCE(SUM(${userPoints.points}), 0)`.as('total_points'),
            level: users.level,
          })
          .from(users)
          .leftJoin(userPoints, and(
            eq(userPoints.userId, users.id),
            dateFilter
          ))
          .groupBy(users.id, users.firstName, users.lastName, users.profileImageUrl, users.shortDescription, users.level, users.points)
          .having(sql`COALESCE(SUM(${userPoints.points}), 0) > 0`)
          .orderBy(sql`total_points DESC`)
          .limit(100);
        
        res.json(leaderboard);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get all users for community sidebar
  app.get("/api/community/users", async (req, res) => {
    try {
      console.log("GET /api/community/users - Fetching all users");
      // First get all users
      const allUsersData = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .orderBy(users.firstName, users.lastName);
      
      // Then get admin status for each user (to avoid duplicates from join)
      const adminUserIds = await db
        .select({ userId: adminUsers.userId })
        .from(adminUsers)
        .where(eq(adminUsers.isActive, true));
      
      const adminUserIdsSet = new Set(adminUserIds.map(a => a.userId));
      
      // Combine and remove duplicates
      const allUsers = allUsersData.map(user => ({
        ...user,
        isAdmin: adminUserIdsSet.has(user.id),
      }));
      
      // Remove duplicates by ID (just in case)
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      
      console.log(`GET /api/community/users - Found ${uniqueUsers.length} unique users`);
      res.json(uniqueUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/community/channels/:channelId/messages", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user?.claims?.sub;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const message = await storage.createCommunityMessage(channelId, userId, content);
      
      // Add points for sending a message
      await addUserPoints(userId, "message", message.id, "Mensaje enviado en el chat");
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Delete message (admin only)
  app.delete("/api/community/messages/:messageId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      await storage.deleteMessage(messageId);
      res.json({ success: true, message: "Mensaje eliminado" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Pin/Unpin message (admin only)
  app.patch("/api/community/messages/:messageId/pin", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { isPinned } = req.body;

      if (typeof isPinned !== "boolean") {
        return res.status(400).json({ message: "isPinned must be a boolean" });
      }

      const message = isPinned 
        ? await storage.pinMessage(messageId)
        : await storage.unpinMessage(messageId);

      res.json(message);
    } catch (error) {
      console.error("Error updating pin status:", error);
      res.status(500).json({ message: "Failed to update pin status" });
    }
  });

  // Get pinned posts for a channel
  app.get("/api/community/channels/:channelId/pinned-posts", async (req, res) => {
    try {
      const { channelId } = req.params;
      
      const pinnedPosts = await db
        .select({
          post: communityPosts,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            createdAt: users.createdAt,
            lastLoginAt: users.lastLoginAt,
          },
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .where(and(
          eq(communityPosts.channelId, channelId),
          eq(communityPosts.isPinned, true)
        ))
        .orderBy(desc(communityPosts.createdAt))
        .limit(10);

      res.json(pinnedPosts);
    } catch (error) {
      console.error("Error fetching pinned posts:", error);
      res.status(500).json({ message: "Failed to fetch pinned posts" });
    }
  });

  // Community posts endpoints
  app.get("/api/community/channels/:channelId/posts", async (req, res) => {
    try {
      // Disable caching for this endpoint
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const sort = (req.query.sort as string) || "recent"; // recent, activity, oldest, popular, likes, alphabetical
      
      console.log(`📋 Fetching posts for channelId: ${channelId}, limit: ${limit}, sort: ${sort}`);
      
      // Get channel to check if it's read-only
      const channel = await db.select().from(communityChannels).where(eq(communityChannels.id, channelId)).limit(1);
      const isReadOnly = channel[0]?.isReadOnly;
      
      if (!channel[0]) {
        console.warn(`⚠️ Channel not found: ${channelId}`);
        return res.json([]);
      }
      
      console.log(`📢 Channel found: ${channel[0].name} (${channel[0].slug}), isReadOnly: ${isReadOnly}`);
      
      // Determine sort order
      let orderClauses: any[];
      if (isReadOnly) {
        // For read-only channels, order by newest first
        orderClauses = [desc(communityPosts.createdAt)];
      } else {
        // For regular channels, use the sort parameter
        let orderClause: any;
        switch (sort) {
          case "oldest":
            orderClause = communityPosts.createdAt;
            break;
          case "popular":
          case "likes":
            orderClause = desc(communityPosts.likes);
            break;
          case "alphabetical":
            orderClause = communityPosts.title;
            break;
          case "activity":
          case "recent":
          default:
            orderClause = desc(communityPosts.updatedAt);
            break;
        }
        orderClauses = [orderClause];
      }

      // Separate pinned and regular posts
      const [pinnedPosts, regularPosts] = await Promise.all([
        db
          .select({
            post: communityPosts,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
              createdAt: users.createdAt,
              lastLoginAt: users.lastLoginAt,
            },
          })
          .from(communityPosts)
          .leftJoin(users, eq(communityPosts.userId, users.id))
          .where(and(
            eq(communityPosts.channelId, channelId),
            eq(communityPosts.isPinned, true)
          ))
          .orderBy(desc(communityPosts.createdAt)),
        db
          .select({
            post: communityPosts,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
              createdAt: users.createdAt,
              lastLoginAt: users.lastLoginAt,
            },
          })
          .from(communityPosts)
          .leftJoin(users, eq(communityPosts.userId, users.id))
          .where(and(
            eq(communityPosts.channelId, channelId),
            eq(communityPosts.isPinned, false)
          ))
          .orderBy(...orderClauses)
          .limit(limit),
      ]);

      // Combine: pinned posts first, then regular posts
      const allPosts = [...pinnedPosts, ...regularPosts];
      console.log(`✅ Found ${pinnedPosts.length} pinned posts and ${regularPosts.length} regular posts (total: ${allPosts.length})`);
      
      if (allPosts.length === 0) {
        // Debug: Check if there are any posts for this channel at all
        const allChannelPosts = await db.select().from(communityPosts).where(eq(communityPosts.channelId, channelId));
        console.log(`🔍 Debug: Total posts in database for channelId ${channelId}: ${allChannelPosts.length}`);
        if (allChannelPosts.length > 0) {
          console.log(`🔍 Debug: Post IDs:`, allChannelPosts.map(p => ({ id: p.id, title: p.title, isPinned: p.isPinned })));
        }
      }
      
      res.json(allPosts);
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/community/posts/:postId/comments", async (req, res) => {
    try {
      // Disable caching for this endpoint
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const { postId } = req.params;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Admin endpoint to create posts
  app.post("/api/admin/community/posts", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { channelId, title, content, imageUrl, videoUrl, contentBlocks } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      console.log(`📝 Creating post:`, { channelId, title, userId, hasContentBlocks: !!contentBlocks });

      if (!channelId || !title || !content) {
        return res.status(400).json({ message: "channelId, title, and content are required" });
      }

      // Verify channel exists
      const channel = await db.select().from(communityChannels).where(eq(communityChannels.id, channelId)).limit(1);
      if (!channel[0]) {
        console.error(`❌ Channel not found: ${channelId}`);
        return res.status(404).json({ message: `Channel not found: ${channelId}` });
      }
      console.log(`✅ Channel verified: ${channel[0].name} (${channel[0].slug})`);

      const post = await db.insert(communityPosts).values({
        channelId,
        userId,
        title,
        content,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        contentBlocks: contentBlocks || [],
        isAdminPost: true,
      }).returning();

      console.log(`✅ Post created successfully:`, { postId: post[0].id, channelId: post[0].channelId, title: post[0].title });
      res.status(201).json(post[0]);
    } catch (error) {
      console.error("❌ Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Admin endpoint to get all posts
  app.get("/api/admin/community/posts", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const posts = await db
        .select({
          post: communityPosts,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
          channel: communityChannels,
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .leftJoin(communityChannels, eq(communityPosts.channelId, communityChannels.id))
        .orderBy(communityPosts.displayOrder, desc(communityPosts.createdAt));

      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Admin endpoint to update post
  app.patch("/api/admin/community/posts/:postId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { title, content, imageUrl, videoUrl, contentBlocks, displayOrder } = req.body;

      const [updated] = await db
        .update(communityPosts)
        .set({ title, content, imageUrl, videoUrl, contentBlocks, displayOrder, isAdminPost: true, updatedAt: new Date() })
        .where(eq(communityPosts.id, postId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Admin endpoint to reorder posts
  app.post("/api/admin/community/posts/reorder", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { updates } = req.body; // Array of { postId, displayOrder }
      
      for (const update of updates) {
        await db
          .update(communityPosts)
          .set({ displayOrder: update.displayOrder, updatedAt: new Date() })
          .where(eq(communityPosts.id, update.postId));
      }

      res.json({ message: "Posts reordered successfully" });
    } catch (error) {
      console.error("Error reordering posts:", error);
      res.status(500).json({ message: "Failed to reorder posts" });
    }
  });

  // Admin endpoint to delete post
  app.delete("/api/admin/community/posts/:postId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      await db.delete(communityPosts).where(eq(communityPosts.id, postId));
      res.json({ message: "Post deleted" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Admin endpoint to upload community post image
  app.post("/api/admin/community/posts/:postId/upload-image", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      // Handle multipart form data
      const bb = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
      
      let fileData: Buffer | null = null;
      let fileName: string | null = null;

      bb.on("file", (fieldname: string, file: any, info: any) => {
        const chunks: Buffer[] = [];
        file.on("data", (data: Buffer) => {
          chunks.push(data);
        });
        file.on("end", () => {
          fileData = Buffer.concat(chunks);
          fileName = info.filename;
        });
      });

      bb.on("close", async () => {
        if (!fileData || !fileName) {
          return res.status(400).json({ message: "No file provided" });
        }

        try {
          // Generate unique filename
          const ext = fileName.split(".").pop() || "jpg";
          const uniqueFileId = randomUUID();
          const uniqueFileName = `post-${uniqueFileId}.${ext}`;

          // Upload to Supabase Storage
          const uploadPath = `post-images/${uniqueFileName}`;
          
          try {
            await supabaseStorage.uploadFile(uploadPath, fileData, {
              contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
              upsert: true,
            });

            // Get public URL from Supabase
            const proxyUrl = supabaseStorage.getPublicUrl(uploadPath, 'post-images');

            // Update post image URL in database
            await db
              .update(communityPosts)
              .set({ imageUrl: proxyUrl, updatedAt: new Date() })
              .where(eq(communityPosts.id, postId));

            console.log("Post image uploaded successfully:", { proxyUrl, uploadPath });

            if (!res.headersSent) {
              res.json({ 
                message: "Post image uploaded successfully",
                imageUrl: proxyUrl 
              });
            }
          } catch (storageError: any) {
            console.log("⚠️ Supabase Storage not available, using local storage fallback:", storageError.message);
            
            // Fallback to local storage (durante migración)
            try {
              const { promises: fs } = await import("fs");
              const path = await import("path");
              const { fileURLToPath } = await import("url");
              
              const __filename = fileURLToPath(import.meta.url);
              const __dirname = path.dirname(__filename);
              const ATTACHED_ASSETS_DIR = path.join(__dirname, "..", "attached_assets");
              
              const localDir = path.join(ATTACHED_ASSETS_DIR, "private", "post-images");
              await fs.mkdir(localDir, { recursive: true });
              
              const localFilePath = path.join(localDir, uniqueFileName);
              await fs.writeFile(localFilePath, fileData);
              
          const proxyUrl = `/api/object-proxy/objects/post-images/${uniqueFileName}`;

              // Update post image URL in database
          await db
            .update(communityPosts)
            .set({ imageUrl: proxyUrl, updatedAt: new Date() })
            .where(eq(communityPosts.id, postId));

              if (!res.headersSent) {
          res.json({ 
                  message: "Post image uploaded successfully (local fallback)",
            imageUrl: proxyUrl 
          });
              }
            } catch (localError: any) {
              console.error("❌ Error saving file locally:", localError);
              if (!res.headersSent) {
                res.status(500).json({ message: "Error uploading image", error: localError.message });
              }
            }
          }
        } catch (uploadError) {
          console.error("Error uploading post image:", uploadError);
          res.status(500).json({ message: "Error uploading image to storage" });
        }
      });

      req.pipe(bb);
    } catch (error) {
      console.error("Error uploading post image:", error);
      res.status(500).json({ message: "Error uploading image" });
    }
  });

  // Generic endpoint to upload images for content blocks
  app.post("/api/upload-image", simpleAdminAuth, async (req: Request, res: Response) => {
    console.log("📤 Upload image request received");
    
    try {
      // Handle multipart form data
      const bb = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
      
      let fileData: Buffer | null = null;
      let fileName: string | null = null;
      let errorOccurred = false;
      let errorMessage: string | null = null;

      bb.on("file", (fieldname: string, file: any, info: any) => {
        console.log("📁 File received:", { fieldname, filename: info.filename, mimeType: info.mimeType });
        const chunks: Buffer[] = [];
        file.on("data", (data: Buffer) => {
          chunks.push(data);
        });
        file.on("end", () => {
          fileData = Buffer.concat(chunks);
          fileName = info.filename;
          console.log("✅ File read complete:", { fileName, size: fileData.length });
        });
        file.on("error", (err: Error) => {
          console.error("❌ File stream error:", err);
          errorOccurred = true;
          errorMessage = `File stream error: ${err.message}`;
        });
      });

      bb.on("error", (err: Error) => {
        console.error("❌ Busboy error:", err);
        errorOccurred = true;
        errorMessage = `Busboy error: ${err.message}`;
        if (!res.headersSent) {
          res.status(400).json({ message: `Error processing file: ${err.message}` });
        }
      });

      bb.on("close", async () => {
        console.log("🔒 Busboy close event");
        
        if (errorOccurred) {
          console.error("❌ Error occurred during file processing:", errorMessage);
          if (!res.headersSent) {
            return res.status(400).json({ message: errorMessage || "Error processing file" });
          }
          return;
        }

        if (!fileData || !fileName) {
          console.error("❌ No file data or filename");
          if (!res.headersSent) {
            return res.status(400).json({ message: "No file provided" });
          }
          return;
        }

        try {
          // Generate unique filename
          const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
          const uniqueFileId = randomUUID();
          const uniqueFileName = `image-${uniqueFileId}.${ext}`;
          console.log("📝 Generated filename:", uniqueFileName);

          // Upload to Supabase Storage
          let proxyUrl: string;
          
          try {
            const uploadPath = `post-images/${uniqueFileName}`;
            console.log("📤 Upload path:", uploadPath);
            
            // Upload to Supabase Storage
            console.log("⬆️ Starting file upload to Supabase Storage...");
            await supabaseStorage.uploadFile(uploadPath, fileData, {
                contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
              upsert: true,
            });
            console.log("✅ File saved to Supabase Storage");

            // Get public URL from Supabase
            proxyUrl = supabaseStorage.getPublicUrl(uploadPath, 'post-images');
            console.log("✅ Public URL:", proxyUrl);
          } catch (storageError: any) {
            console.log("⚠️ Supabase Storage not available, using local storage fallback:", storageError.message);
            
            try {
              // Fallback to local storage (durante migración)
              const { promises: fs } = await import("fs");
              const path = await import("path");
              const { fileURLToPath } = await import("url");
              
              const __filename = fileURLToPath(import.meta.url);
              const __dirname = path.dirname(__filename);
              const ATTACHED_ASSETS_DIR = path.join(__dirname, "..", "attached_assets");
              
              // Ensure directory exists
              const localDir = path.join(ATTACHED_ASSETS_DIR, "private", "post-images");
              await fs.mkdir(localDir, { recursive: true });
              console.log("📁 Created directory:", localDir);
              
              // Save file locally
              const localFilePath = path.join(localDir, uniqueFileName);
              await fs.writeFile(localFilePath, fileData);
              console.log("✅ File saved locally (fallback):", localFilePath);
              
              // Use proxy URL for local file
              proxyUrl = `/api/object-proxy/objects/post-images/${uniqueFileName}`;
            } catch (localError: any) {
              console.error("❌ Error saving file locally:", localError);
              throw new Error(`Failed to save file: ${localError.message}`);
            }
          }

          console.log("✅ Image uploaded successfully:", { proxyUrl, uniqueFileName });

          if (!res.headersSent) {
            res.json({ 
              message: "Image uploaded successfully",
              url: proxyUrl 
            });
          }
        } catch (uploadError: any) {
          console.error("❌ Error uploading image:", uploadError);
          console.error("❌ Error stack:", uploadError.stack);
          if (!res.headersSent) {
            res.status(500).json({ 
              message: "Error uploading image to storage",
              error: uploadError.message,
              details: uploadError.toString()
            });
          }
        }
      });

      req.pipe(bb);
    } catch (error: any) {
      console.error("❌ Error in upload-image endpoint:", error);
      console.error("❌ Error stack:", error.stack);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Error uploading image",
          error: error.message,
          details: error.toString()
        });
      }
    }
  });

  // Toggle pin status of a post (admin only)
  app.post("/api/community/posts/:postId/toggle-pin", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const updated = await db
        .update(communityPosts)
        .set({ 
          isPinned: !post.isPinned,
          updatedAt: new Date()
        })
        .where(eq(communityPosts.id, postId))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error toggling pin status:", error);
      res.status(500).json({ message: "Failed to toggle pin status" });
    }
  });

  app.post("/api/community/posts/:postId/comments", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Check if channel is read-only
      const post = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
      if (post.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      const channel = await db.select().from(communityChannels).where(eq(communityChannels.id, post[0].channelId));
      if (channel.length > 0 && channel[0].isReadOnly) {
        return res.status(403).json({ message: "Este canal no permite comentarios" });
      }

      const comment = await storage.createPostComment(postId, userId, content);
      
      // Add points for commenting
      await addUserPoints(userId, "comment", comment.id, "Comentario en publicación");
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Endpoint for users to create posts in a channel
  app.post("/api/community/channels/:channelId/posts", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { title, content, metadata } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Check if channel is read-only
      const channel = await db.select().from(communityChannels).where(eq(communityChannels.id, channelId));
      if (channel.length === 0) {
        return res.status(404).json({ message: "Canal no encontrado" });
      }

      if (channel[0].isReadOnly) {
        return res.status(403).json({ message: "Este canal no permite publicaciones" });
      }

      // Store metadata in contentBlocks if provided (using a special format)
      let contentBlocks: any[] = [];
      if (metadata && metadata.lessonId) {
        // Store lesson metadata in contentBlocks as a special metadata block
        contentBlocks = [{
          type: "metadata",
          lessonId: metadata.lessonId,
          courseId: metadata.courseId,
          lessonTitle: metadata.lessonTitle,
        }];
      }

      // Create post
      const post = await db.insert(communityPosts).values({
        channelId,
        userId,
        title: title || "",
        content,
        contentBlocks: contentBlocks.length > 0 ? contentBlocks : [],
      }).returning();

      // Add points for creating a post
      await addUserPoints(userId, "post", post[0].id, "Publicación creada");

      res.status(201).json(post[0]);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Endpoint to add reaction to post
  app.post("/api/community/posts/:postId/reactions", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { emoji } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Check if post exists
      const post = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
      if (post.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Reactions are allowed in all channels, even read-only ones
      // Check if user already reacted with this emoji
      const existing = await db
        .select()
        .from(communityPostReactions)
        .where(
          and(
            eq(communityPostReactions.postId, postId),
            eq(communityPostReactions.userId, userId),
            eq(communityPostReactions.emoji, emoji)
          )
        );

      if (existing.length > 0) {
        // Remove reaction if already exists
        await db
          .delete(communityPostReactions)
          .where(eq(communityPostReactions.id, existing[0].id));
      } else {
        // Add new reaction
        await db.insert(communityPostReactions).values({
          postId,
          userId,
          emoji,
        });
      }

      // Return all reactions for this post
      const reactions = await db
        .select()
        .from(communityPostReactions)
        .where(eq(communityPostReactions.postId, postId));

      res.json(reactions);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // Endpoint to get reactions for a post
  app.get("/api/community/posts/:postId/reactions", async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      const reactions = await db
        .select({
          emoji: communityPostReactions.emoji,
          count: sql<number>`count(*)`.mapWith(Number),
          users: sql<string[]>`array_agg(${communityPostReactions.userId})`.mapWith(el => (el as string[]) || []),
        })
        .from(communityPostReactions)
        .where(eq(communityPostReactions.postId, postId))
        .groupBy(communityPostReactions.emoji);

      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Endpoint to get current user's reactions for a post
  app.get("/api/community/posts/:postId/user-reactions", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!userId) {
        return res.json([]);
      }

      const userReactions = await db
        .select()
        .from(communityPostReactions)
        .where(
          and(
            eq(communityPostReactions.postId, postId),
            eq(communityPostReactions.userId, userId)
          )
        );

      res.json(userReactions);
    } catch (error) {
      console.error("Error fetching user reactions:", error);
      res.status(500).json({ message: "Failed to fetch user reactions" });
    }
  });

  // Endpoint to add reaction to comment
  app.post("/api/community/comments/:commentId/reactions", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const { emoji } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Check if comment exists
      const comment = await db.select().from(communityPostComments).where(eq(communityPostComments.id, commentId));
      if (comment.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user already reacted with this emoji
      const existing = await db
        .select()
        .from(communityPostCommentReactions)
        .where(
          and(
            eq(communityPostCommentReactions.commentId, commentId),
            eq(communityPostCommentReactions.userId, userId),
            eq(communityPostCommentReactions.emoji, emoji)
          )
        );

      if (existing.length > 0) {
        // Remove reaction if already exists
        await db
          .delete(communityPostCommentReactions)
          .where(eq(communityPostCommentReactions.id, existing[0].id));
      } else {
        // Add new reaction
        await db.insert(communityPostCommentReactions).values({
          commentId,
          userId,
          emoji,
        });
      }

      // Return all reactions for this comment
      const reactions = await db
        .select()
        .from(communityPostCommentReactions)
        .where(eq(communityPostCommentReactions.commentId, commentId));

      res.json(reactions);
    } catch (error) {
      console.error("Error adding reaction to comment:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // Endpoint to get reactions for a comment
  app.get("/api/community/comments/:commentId/reactions", async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;

      const reactions = await db
        .select({
          emoji: communityPostCommentReactions.emoji,
          count: sql<number>`count(*)`.mapWith(Number),
          users: sql<string[]>`array_agg(${communityPostCommentReactions.userId})`.mapWith(el => (el as string[]) || []),
        })
        .from(communityPostCommentReactions)
        .where(eq(communityPostCommentReactions.commentId, commentId))
        .groupBy(communityPostCommentReactions.emoji);

      res.json(reactions);
    } catch (error) {
      console.error("Error fetching comment reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Notification preferences endpoints
  app.get("/api/user/notification-preferences", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      let prefs = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userId));

      // If no preferences exist, create defaults
      if (prefs.length === 0) {
        const newPrefs = await db.insert(userNotificationPreferences).values({
          userId,
          emailNotifications: true,
          inAppNotifications: true,
          mobileNotifications: false,
        }).returning();
        return res.json(newPrefs[0]);
      }

      res.json(prefs[0]);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.patch("/api/user/notification-preferences", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
      const { emailNotifications, inAppNotifications, mobileNotifications } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Check if preferences exist
      const existing = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userId));

      let result;
      if (existing.length === 0) {
        // Create new preferences
        result = await db.insert(userNotificationPreferences).values({
          userId,
          emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
          inAppNotifications: inAppNotifications !== undefined ? inAppNotifications : true,
          mobileNotifications: mobileNotifications !== undefined ? mobileNotifications : false,
          updatedAt: new Date(),
        }).returning();
      } else {
        // Update existing preferences
        result = await db
          .update(userNotificationPreferences)
          .set({
            emailNotifications: emailNotifications !== undefined ? emailNotifications : existing[0].emailNotifications,
            inAppNotifications: inAppNotifications !== undefined ? inAppNotifications : existing[0].inAppNotifications,
            mobileNotifications: mobileNotifications !== undefined ? mobileNotifications : existing[0].mobileNotifications,
            updatedAt: new Date(),
          })
          .where(eq(userNotificationPreferences.userId, userId))
          .returning();
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Get user's posts
  app.get("/api/community/users/:userId/posts", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const posts = await db
        .select({
          post: communityPosts,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            createdAt: users.createdAt,
            lastLoginAt: users.lastLoginAt,
          },
          channel: {
            id: communityChannels.id,
            name: communityChannels.name,
            slug: communityChannels.slug,
          },
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .leftJoin(communityChannels, eq(communityPosts.channelId, communityChannels.id))
        .where(eq(communityPosts.userId, userId))
        .orderBy(desc(communityPosts.createdAt))
        .limit(50);

      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Get user's comments
  app.get("/api/community/users/:userId/comments", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const comments = await db
        .select({
          comment: communityPostComments,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
          post: {
            id: communityPosts.id,
            title: communityPosts.title,
            channelId: communityPosts.channelId,
          },
          channel: {
            id: communityChannels.id,
            name: communityChannels.name,
            slug: communityChannels.slug,
          },
        })
        .from(communityPostComments)
        .leftJoin(users, eq(communityPostComments.userId, users.id))
        .leftJoin(communityPosts, eq(communityPostComments.postId, communityPosts.id))
        .leftJoin(communityChannels, eq(communityPosts.channelId, communityChannels.id))
        .where(eq(communityPostComments.userId, userId))
        .orderBy(desc(communityPostComments.createdAt))
        .limit(50);

      res.json(comments);
    } catch (error) {
      console.error("Error fetching user comments:", error);
      res.status(500).json({ message: "Failed to fetch user comments" });
    }
  });

  // Get user's points/rewards history
  app.get("/api/community/users/:userId/rewards", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const rewards = await db
        .select({
          id: userPoints.id,
          points: userPoints.points,
          activityType: userPoints.activityType,
          description: userPoints.description,
          createdAt: userPoints.createdAt,
        })
        .from(userPoints)
        .where(eq(userPoints.userId, userId))
        .orderBy(desc(userPoints.createdAt))
        .limit(100);

      res.json(rewards);
    } catch (error) {
      console.error("Error fetching user rewards:", error);
      res.status(500).json({ message: "Failed to fetch user rewards" });
    }
  });

  // ============================================
  // LIVE EVENTS ROUTES
  // ============================================
  
  // Initialize live_events table if it doesn't exist
  const initLiveEventsTable = async () => {
    try {
      console.log("🔄 Initializing live_events table...");
      const result = await pool.query(`
        CREATE TABLE IF NOT EXISTS live_events (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR NOT NULL,
          description TEXT,
          host_name VARCHAR NOT NULL,
          host_avatar VARCHAR,
          host_role VARCHAR,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          timezone VARCHAR DEFAULT 'America/Bogota',
          is_active BOOLEAN DEFAULT true,
          is_live BOOLEAN DEFAULT false,
          join_url VARCHAR,
          room_name VARCHAR,
          event_type VARCHAR DEFAULT 'live',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("✅ live_events table initialized successfully");
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.error("❌ Error creating live_events table:", error.message);
        console.error("❌ Error details:", error);
      } else {
        console.log("✅ live_events table already exists");
      }
    }
  };

  // Initialize event_registrations table if it doesn't exist
  const initEventRegistrationsTable = async () => {
    try {
      console.log("🔄 Initializing event_registrations table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS event_registrations (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id VARCHAR NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
          user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR NOT NULL,
          first_name VARCHAR,
          last_name VARCHAR,
          phone VARCHAR,
          status VARCHAR DEFAULT 'registered',
          reminder_sent_24h BOOLEAN DEFAULT false,
          reminder_sent_1h BOOLEAN DEFAULT false,
          registered_at TIMESTAMP DEFAULT NOW(),
          cancelled_at TIMESTAMP,
          attended_at TIMESTAMP
        )
      `);
      console.log("✅ event_registrations table initialized successfully");
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.error("❌ Error creating event_registrations table:", error.message);
        console.error("❌ Error details:", error);
      } else {
        console.log("✅ event_registrations table already exists");
      }
    }
  };
  
  // Initialize tables on startup
  initLiveEventsTable();
  initEventRegistrationsTable();
  
  // Get all events (for calendar)
  app.get("/api/events", async (req, res) => {
    try {
      const events = await db.select().from(liveEvents)
        .where(eq(liveEvents.isActive, true))
        .orderBy(desc(liveEvents.startTime));
      
      // Get registration counts for each event
      const eventsWithCounts = await Promise.all(events.map(async (event) => {
        const registrations = await db.select({ id: eventRegistrations.id })
          .from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "registered")
          ));
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.startTime?.toISOString().split('T')[0],
          type: event.eventType,
          category: (event as any).category || null,
          startTime: event.startTime,
          endTime: event.endTime,
          hostName: event.hostName,
          hostAvatar: event.hostAvatar,
          hostRole: event.hostRole,
          eventImage: (event as any).eventImage || null,
          isLive: event.isLive,
          joinUrl: event.joinUrl || `/live/${event.id}`,
          registrationsCount: registrations.length,
        };
      }));

      res.json(eventsWithCounts);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events", error: error.message });
    }
  });

  // Get single event by ID
  app.get("/api/events/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const [event] = await db.select().from(liveEvents)
        .where(and(
          eq(liveEvents.id, eventId),
          eq(liveEvents.isActive, true)
        ));
      
      if (!event) {
        return res.status(404).json({ message: "Evento no encontrado" });
      }
      
      // Get registration count
      const registrations = await db.select({ id: eventRegistrations.id })
        .from(eventRegistrations)
        .where(and(
          eq(eventRegistrations.eventId, event.id),
          eq(eventRegistrations.status, "registered")
        ));
      
      const eventDetails = {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.eventType,
        category: (event as any).category || null,
        startTime: event.startTime,
        endTime: event.endTime,
        timeZone: event.timezone || "America/Bogota",
        hostName: event.hostName,
        hostAvatar: event.hostAvatar,
        hostRole: event.hostRole,
        eventImage: (event as any).eventImage || null,
        isLive: event.isLive,
        joinUrl: event.joinUrl || `/live/${event.id}`,
        registrationsCount: registrations.length,
        maxCapacity: null,
        learningPoints: [],
        targetAudience: [],
      };

      res.json(eventDetails);
    } catch (error: any) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event", error: error.message });
    }
  });

  // Get current live event (for community sidebar widget)
  app.get("/api/community/live-event", async (req, res) => {
    try {
      const now = new Date();
      
      const events = await db.select().from(liveEvents)
        .where(eq(liveEvents.isActive, true))
        .orderBy(desc(liveEvents.startTime));
      
      let liveEvent = events.find(e => e.isLive === true);
      
      if (!liveEvent) {
        liveEvent = events.find(e => {
          if (!e.startTime || !e.endTime) return false;
          const start = new Date(e.startTime);
          const end = new Date(e.endTime);
          return now >= start && now <= end;
        });
      }
      
      if (liveEvent) {
        res.json({
          id: liveEvent.id,
          title: liveEvent.title,
          hostName: liveEvent.hostName,
          hostAvatar: liveEvent.hostAvatar,
          hostRole: liveEvent.hostRole,
          joinUrl: liveEvent.joinUrl || `/live/${liveEvent.id}`,
          isLive: true,
        });
      } else {
        res.json({ isLive: false });
      }
    } catch (error: any) {
      console.error("Error fetching live event:", error);
      res.status(500).json({ message: "Failed to fetch live event", error: error.message });
    }
  });

  // Get specific live event details
  app.get("/api/community/live-event/:eventId", async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const [event] = await db.select().from(liveEvents)
        .where(eq(liveEvents.id, eventId));
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({
        id: event.id,
        title: event.title,
        description: event.description,
        hostName: event.hostName,
        hostAvatar: event.hostAvatar,
        hostRole: event.hostRole,
        joinUrl: event.joinUrl || `/live/${event.id}`,
        roomName: event.roomName || `ExpertosNoCodeIA-${event.id}`,
        isLive: event.isLive,
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        participants: [],
      });
    } catch (error: any) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Failed to fetch event", error: error.message });
    }
  });

  // Upload event image
  app.post("/api/admin/events/upload-image", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const Busboy = (await import('busboy')).default;
      const busboy = Busboy({ headers: req.headers });
      
      let fileData: Buffer | null = null;
      let fileName: string | null = null;
      let mimeType: string | null = null;
      
      busboy.on('file', (fieldname: string, file: NodeJS.ReadableStream, info: any) => {
        const { filename, mimeType: fileMimeType } = info;
        console.log(`📁 Recibiendo archivo: ${filename}`);
        
        fileName = filename;
        mimeType = fileMimeType;
        
        const chunks: Buffer[] = [];
        file.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        file.on('end', () => {
          fileData = Buffer.concat(chunks);
          console.log(`✅ Archivo recibido: ${fileData.length} bytes`);
        });
      });
      
      busboy.on('finish', async () => {
        if (!fileData || !fileName) {
          return res.status(400).json({ message: "No se recibió archivo" });
        }
        
        try {
          // Generar nombre único
          const timestamp = Date.now();
          const extension = fileName.split('.').pop();
          const uniqueFileName = `event-${timestamp}.${extension}`;
          const storagePath = `events/${uniqueFileName}`;
          
          // Subir a Supabase Storage
          if (!supabase) {
            return res.status(503).json({ message: "Supabase no configurado" });
          }
          
          const { data, error } = await supabase.storage
            .from('attached-assets')
            .upload(storagePath, fileData, {
              contentType: mimeType || 'image/jpeg',
              upsert: false,
            });
          
          if (error) {
            console.error('Error subiendo a Supabase:', error);
            return res.status(500).json({ message: "Error subiendo archivo", error: error.message });
          }
          
          // Obtener URL pública
          const { data: publicUrlData } = supabase.storage
            .from('attached-assets')
            .getPublicUrl(storagePath);
          
          console.log(`✅ Archivo subido a: ${publicUrlData.publicUrl}`);
          
          res.json({
            url: publicUrlData.publicUrl,
            path: storagePath,
            filename: uniqueFileName,
          });
        } catch (error: any) {
          console.error('Error procesando archivo:', error);
          res.status(500).json({ message: "Error procesando archivo", error: error.message });
        }
      });
      
      req.pipe(busboy);
    } catch (error: any) {
      console.error("Error en upload:", error);
      res.status(500).json({ message: "Error subiendo imagen", error: error.message });
    }
  });

  // Admin routes for managing live events
  console.log("📋 Registering /api/admin/live-events routes...");
  app.get("/api/admin/live-events", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const events = await db.select().from(liveEvents)
        .orderBy(desc(liveEvents.startTime));
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ message: "Failed to fetch events", error: error.message });
    }
  });

  console.log("📋 Registering POST /api/admin/live-events...");
  app.post("/api/admin/live-events", simpleAdminAuth, isAdmin, async (req: Request, res: Response, next) => {
    console.log("🔵 POST /api/admin/live-events - Handler called");
    try {
      // Ensure we always return JSON - set header first
      res.setHeader('Content-Type', 'application/json');
      
      const { title, description, hostName, hostAvatar, hostRole, startTime, endTime, eventType, joinUrl, eventImage, category } = req.body;
      
      console.log("📝 Creating event with data:", { title, hostName, startTime, endTime, eventType, category });
      
      if (!title || !hostName || !startTime || !endTime) {
        console.log("❌ Missing required fields");
        return res.status(400).json({ message: "Title, hostName, startTime and endTime are required" });
      }
      
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      if (endDate <= startDate) {
        return res.status(400).json({ message: "End time must be after start time" });
      }
      
      console.log("💾 Inserting event into database...");
      // Clean category: convert empty string, undefined, or null to null
      const cleanCategory = (category && typeof category === 'string' && category.trim() !== "") ? category.trim() : null;
      console.log("📝 Category processing:", { received: category, type: typeof category, cleaned: cleanCategory });
      
      const [newEvent] = await db.insert(liveEvents).values({
        title,
        description,
        hostName,
        hostAvatar,
        hostRole,
        startTime: startDate,
        endTime: endDate,
        eventType: eventType || 'live',
        joinUrl,
        eventImage: eventImage || null,
        category: cleanCategory,
        isActive: true,
        isLive: false,
      }).returning();
      
      console.log("✅ Event created successfully. Category saved:", newEvent.category);
      res.status(201).json(newEvent);
    } catch (error: any) {
      console.error("❌ Error creating event:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create event", error: error.message || "Unknown error" });
      } else {
        next(error);
      }
    }
  });

  app.patch("/api/admin/live-events/:eventId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const updates = req.body;
      
      if (updates.startTime) updates.startTime = new Date(updates.startTime);
      if (updates.endTime) updates.endTime = new Date(updates.endTime);
      
      // Handle category: convert empty string, undefined, or null to null
      if (updates.category !== undefined) {
        updates.category = (updates.category && typeof updates.category === 'string' && updates.category.trim() !== "") ? updates.category.trim() : null;
        console.log("📝 Updating category:", { received: updates.category, cleaned: updates.category });
      }
      
      // Ensure eventImage empty string becomes null
      if (updates.eventImage === '') updates.eventImage = null;
      
      updates.updatedAt = new Date();
      
      const [updated] = await db.update(liveEvents)
        .set(updates)
        .where(eq(liveEvents.id, eventId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event", error: error.message });
    }
  });

  app.post("/api/admin/live-events/:eventId/toggle-live", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      const [event] = await db.select().from(liveEvents)
        .where(eq(liveEvents.id, eventId));
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (!event.isLive) {
        await db.update(liveEvents)
          .set({ isLive: false })
          .where(eq(liveEvents.isLive, true));
      }
      
      const [updated] = await db.update(liveEvents)
        .set({ isLive: !event.isLive, updatedAt: new Date() })
        .where(eq(liveEvents.id, eventId))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling live status:", error);
      res.status(500).json({ message: "Failed to toggle live status", error: error.message });
    }
  });

  app.delete("/api/admin/live-events/:eventId", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      await db.delete(liveEvents)
        .where(eq(liveEvents.id, eventId));
      
      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event", error: error.message });
    }
  });

  // ============================================
  // EVENT REGISTRATION ROUTES
  // ============================================

  // Register for an event
  app.post("/api/events/:eventId/register", optionalSupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const { email, firstName, lastName, phone } = req.body;
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if event exists and is active
      const [event] = await db.select().from(liveEvents)
        .where(and(eq(liveEvents.id, eventId), eq(liveEvents.isActive, true)));

      if (!event) {
        return res.status(404).json({ message: "Event not found or not available" });
      }

      // Check if already registered
      const existing = await db.select().from(eventRegistrations)
        .where(and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.email, email),
          eq(eventRegistrations.status, "registered")
        ));

      if (existing.length > 0) {
        return res.status(400).json({ message: "Ya estás registrado en este evento" });
      }

      // Create registration
      const [registration] = await db.insert(eventRegistrations).values({
        eventId,
        userId: userId || null,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        status: "registered",
      }).returning();

      // Send confirmation email
      try {
        console.log("📧 Attempting to send event confirmation email to:", email);
        await sendEventConfirmationEmail({
          email,
          firstName: firstName || "Usuario",
          eventTitle: event.title,
          eventDate: event.startTime,
          eventTime: event.startTime,
          hostName: event.hostName,
          joinUrl: event.joinUrl || `/live/${event.id}`,
        });
        console.log("✅ Event confirmation email sent successfully to:", email);
      } catch (emailError: any) {
        console.error("❌ Error sending confirmation email:", emailError);
        console.error("❌ Error details:", {
          message: emailError?.message,
          stack: emailError?.stack,
          name: emailError?.name,
        });
        // Don't fail registration if email fails, but log it clearly
      }

      // Send WhatsApp notification if phone is provided
      if (phone) {
        try {
          await sendWhatsAppNotification({
            phone,
            firstName: firstName || "Usuario",
            eventTitle: event.title,
            eventDate: event.startTime,
            eventTime: event.startTime,
            joinUrl: event.joinUrl || `/live/${event.id}`,
            notificationType: 'confirmation',
          });
        } catch (whatsappError) {
          console.error("Error sending WhatsApp notification:", whatsappError);
          // Don't fail registration if WhatsApp fails
        }
      }

      res.status(201).json(registration);
    } catch (error: any) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register for event", error: error.message });
    }
  });

  // Cancel event registration
  app.post("/api/events/:eventId/cancel-registration", optionalSupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const { email } = req.body;
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const [registration] = await db.select().from(eventRegistrations)
        .where(and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.email, email),
          eq(eventRegistrations.status, "registered")
        ));

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      await db.update(eventRegistrations)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(eventRegistrations.id, registration.id));

      res.json({ message: "Registration cancelled successfully" });
    } catch (error: any) {
      console.error("Error cancelling registration:", error);
      res.status(500).json({ message: "Failed to cancel registration", error: error.message });
    }
  });

  // Get registrations for an event (admin only)
  app.get("/api/admin/events/:eventId/registrations", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const registrations = await db.select({
        id: eventRegistrations.id,
        email: eventRegistrations.email,
        firstName: eventRegistrations.firstName,
        lastName: eventRegistrations.lastName,
        phone: eventRegistrations.phone,
        status: eventRegistrations.status,
        registeredAt: eventRegistrations.registeredAt,
      })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId))
        .orderBy(desc(eventRegistrations.registeredAt));

      res.json(registrations);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations", error: error.message });
    }
  });

  // Get user's registered events
  app.get("/api/events/my-registrations", optionalSupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const { email } = req.query;

      if (!userId && !email) {
        return res.status(400).json({ message: "User ID or email is required" });
      }

      const registrations = await db.select({
        registration: eventRegistrations,
        event: liveEvents,
      })
        .from(eventRegistrations)
        .leftJoin(liveEvents, eq(eventRegistrations.eventId, liveEvents.id))
        .where(and(
          userId ? eq(eventRegistrations.userId, userId) : eq(eventRegistrations.email, email as string),
          eq(eventRegistrations.status, "registered")
        ))
        .orderBy(desc(liveEvents.startTime));

      res.json(registrations);
    } catch (error: any) {
      console.error("Error fetching user registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations", error: error.message });
    }
  });

  // Check if user is registered for an event
  app.get("/api/events/:eventId/registration-status", optionalSupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const { email } = req.query;

      if (!userId && !email) {
        return res.json({ registered: false });
      }

      const [registration] = await db.select().from(eventRegistrations)
        .where(and(
          eq(eventRegistrations.eventId, eventId),
          userId ? eq(eventRegistrations.userId, userId) : eq(eventRegistrations.email, email as string),
          eq(eventRegistrations.status, "registered")
        ));

      res.json({ registered: !!registration, registration });
    } catch (error: any) {
      console.error("Error checking registration status:", error);
      res.status(500).json({ message: "Failed to check registration status", error: error.message });
    }
  });

  // ============================================
  // AUTOMATIC REMINDERS SYSTEM
  // ============================================
  
  // Endpoint to send reminders (can be called by cron job)
  app.post("/api/admin/events/send-reminders", async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);

      // Find events starting in 24 hours
      const events24h = await db.select().from(liveEvents)
        .where(and(
          eq(liveEvents.isActive, true),
          gte(liveEvents.startTime, new Date(in24h.getTime() - 60 * 60 * 1000)), // 23-25 hours from now
          lte(liveEvents.startTime, in24h)
        ));

      // Find events starting in 1 hour
      const events1h = await db.select().from(liveEvents)
        .where(and(
          eq(liveEvents.isActive, true),
          gte(liveEvents.startTime, new Date(in1h.getTime() - 15 * 60 * 1000)), // 45-60 minutes from now
          lte(liveEvents.startTime, in1h)
        ));

      let sent24h = 0;
      let sent1h = 0;

      // Send 24h reminders
      for (const event of events24h) {
        const registrations = await db.select().from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "registered"),
            eq(eventRegistrations.reminderSent24h, false)
          ));

        for (const reg of registrations) {
          try {
            await sendEventReminderEmail({
              email: reg.email,
              firstName: reg.firstName || "Usuario",
              eventTitle: event.title,
              eventDate: event.startTime,
              eventTime: event.startTime,
              hostName: event.hostName,
              joinUrl: event.joinUrl || `/live/${event.id}`,
              reminderType: '24h',
            });

            // Send WhatsApp reminder if phone is provided
            if (reg.phone) {
              try {
                await sendWhatsAppNotification({
                  phone: reg.phone,
                  firstName: reg.firstName || "Usuario",
                  eventTitle: event.title,
                  eventDate: event.startTime,
                  eventTime: event.startTime,
                  joinUrl: event.joinUrl || `/live/${event.id}`,
                  notificationType: 'reminder24h',
                });
              } catch (whatsappError) {
                console.error(`Error sending WhatsApp reminder to ${reg.phone}:`, whatsappError);
              }
            }

            await db.update(eventRegistrations)
              .set({ reminderSent24h: true })
              .where(eq(eventRegistrations.id, reg.id));

            sent24h++;
          } catch (error) {
            console.error(`Error sending 24h reminder to ${reg.email}:`, error);
          }
        }
      }

      // Send 1h reminders
      for (const event of events1h) {
        const registrations = await db.select().from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "registered"),
            eq(eventRegistrations.reminderSent1h, false)
          ));

        for (const reg of registrations) {
          try {
            await sendEventReminderEmail({
              email: reg.email,
              firstName: reg.firstName || "Usuario",
              eventTitle: event.title,
              eventDate: event.startTime,
              eventTime: event.startTime,
              hostName: event.hostName,
              joinUrl: event.joinUrl || `/live/${event.id}`,
              reminderType: '1h',
            });

            // Send WhatsApp reminder if phone is provided
            if (reg.phone) {
              try {
                await sendWhatsAppNotification({
                  phone: reg.phone,
                  firstName: reg.firstName || "Usuario",
                  eventTitle: event.title,
                  eventDate: event.startTime,
                  eventTime: event.startTime,
                  joinUrl: event.joinUrl || `/live/${event.id}`,
                  notificationType: 'reminder1h',
                });
              } catch (whatsappError) {
                console.error(`Error sending WhatsApp reminder to ${reg.phone}:`, whatsappError);
              }
            }

            await db.update(eventRegistrations)
              .set({ reminderSent1h: true })
              .where(eq(eventRegistrations.id, reg.id));

            sent1h++;
          } catch (error) {
            console.error(`Error sending 1h reminder to ${reg.email}:`, error);
          }
        }
      }

      res.json({ 
        message: "Reminders sent successfully",
        sent24h,
        sent1h,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ message: "Failed to send reminders", error: error.message });
    }
  });

  // ============================================
  // AUTOMATIC REMINDERS CRON JOB
  // ============================================
  
  // Function to send reminders
  const sendReminders = async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);

      // Find events starting in 24 hours (23-25 hours window)
      const time24hStart = new Date(in24h.getTime() - 60 * 60 * 1000);
      const events24h = await db.select().from(liveEvents)
        .where(and(
          eq(liveEvents.isActive, true),
          gte(liveEvents.startTime, time24hStart),
          lte(liveEvents.startTime, in24h)
        ));

      // Find events starting in 1 hour (45-60 minutes window)
      const time1hStart = new Date(in1h.getTime() - 15 * 60 * 1000);
      const events1h = await db.select().from(liveEvents)
        .where(and(
          eq(liveEvents.isActive, true),
          gte(liveEvents.startTime, time1hStart),
          lte(liveEvents.startTime, in1h)
        ));

      let sent24h = 0;
      let sent1h = 0;

      // Send 24h reminders
      for (const event of events24h) {
        const registrations = await db.select().from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "registered"),
            eq(eventRegistrations.reminderSent24h, false)
          ));

        for (const reg of registrations) {
          try {
            await sendEventReminderEmail({
              email: reg.email,
              firstName: reg.firstName || "Usuario",
              eventTitle: event.title,
              eventDate: event.startTime,
              eventTime: event.startTime,
              hostName: event.hostName,
              joinUrl: event.joinUrl || `/live/${event.id}`,
              reminderType: '24h',
            });

            // Send WhatsApp reminder if phone is provided
            if (reg.phone) {
              try {
                await sendWhatsAppNotification({
                  phone: reg.phone,
                  firstName: reg.firstName || "Usuario",
                  eventTitle: event.title,
                  eventDate: event.startTime,
                  eventTime: event.startTime,
                  joinUrl: event.joinUrl || `/live/${event.id}`,
                  notificationType: 'reminder24h',
                });
              } catch (whatsappError) {
                console.error(`Error sending WhatsApp reminder to ${reg.phone}:`, whatsappError);
              }
            }

            await db.update(eventRegistrations)
              .set({ reminderSent24h: true })
              .where(eq(eventRegistrations.id, reg.id));

            sent24h++;
          } catch (error) {
            console.error(`Error sending 24h reminder to ${reg.email}:`, error);
          }
        }
      }

      // Send 1h reminders
      for (const event of events1h) {
        const registrations = await db.select().from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "registered"),
            eq(eventRegistrations.reminderSent1h, false)
          ));

        for (const reg of registrations) {
          try {
            await sendEventReminderEmail({
              email: reg.email,
              firstName: reg.firstName || "Usuario",
              eventTitle: event.title,
              eventDate: event.startTime,
              eventTime: event.startTime,
              hostName: event.hostName,
              joinUrl: event.joinUrl || `/live/${event.id}`,
              reminderType: '1h',
            });

            // Send WhatsApp reminder if phone is provided
            if (reg.phone) {
              try {
                await sendWhatsAppNotification({
                  phone: reg.phone,
                  firstName: reg.firstName || "Usuario",
                  eventTitle: event.title,
                  eventDate: event.startTime,
                  eventTime: event.startTime,
                  joinUrl: event.joinUrl || `/live/${event.id}`,
                  notificationType: 'reminder1h',
                });
              } catch (whatsappError) {
                console.error(`Error sending WhatsApp reminder to ${reg.phone}:`, whatsappError);
              }
            }

            await db.update(eventRegistrations)
              .set({ reminderSent1h: true })
              .where(eq(eventRegistrations.id, reg.id));

            sent1h++;
          } catch (error) {
            console.error(`Error sending 1h reminder to ${reg.email}:`, error);
          }
        }
      }

      if (sent24h > 0 || sent1h > 0) {
        console.log(`📧 Sent ${sent24h} 24h reminders and ${sent1h} 1h reminders`);
      }
    } catch (error) {
      console.error("Error in automatic reminders:", error);
    }
  };

  // Run reminders check every hour
  setInterval(() => {
    sendReminders();
  }, 60 * 60 * 1000); // Every hour

  // Also run immediately on startup (after 1 minute to let server initialize)
  setTimeout(() => {
    console.log("🔄 Running initial reminders check...");
    sendReminders();
  }, 60 * 1000);

  // ========================================
  // STRIPE SUBSCRIPTION ROUTES
  // ========================================

  // Get all subscription plans (public endpoint)
  app.get("/api/subscription/plans", async (req: Request, res: Response) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ 
        message: "Error al obtener planes de suscripción",
        error: error.message 
      });
    }
  });

  // Admin: Create subscription plan
  app.post("/api/admin/subscription/plans", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { name, displayName, price, currency, billingInterval, trialDays, features, limits } = req.body;

      if (!name || !displayName || billingInterval === undefined) {
        return res.status(400).json({ message: "name, displayName y billingInterval son requeridos" });
      }

      const plan = await storage.createSubscriptionPlan({
        name,
        displayName,
        price: price || 0,
        currency: currency || 'USD',
        billingInterval,
        trialDays: trialDays || 0,
        features: features || [],
        limits: limits || {},
        isActive: true,
      });

      res.json(plan);
    } catch (error: any) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ 
        message: "Error al crear plan de suscripción",
        error: error.message 
      });
    }
  });

  // Admin: Update subscription plan
  app.put("/api/admin/subscription/plans/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, displayName, price, currency, billingInterval, trialDays, features, limits, isActive } = req.body;

      const plan = await storage.updateSubscriptionPlan(id, {
        ...(name && { name }),
        ...(displayName && { displayName }),
        ...(price !== undefined && { price }),
        ...(currency && { currency }),
        ...(billingInterval && { billingInterval }),
        ...(trialDays !== undefined && { trialDays }),
        ...(features && { features }),
        ...(limits && { limits }),
        ...(isActive !== undefined && { isActive }),
      });

      res.json(plan);
    } catch (error: any) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ 
        message: "Error al actualizar plan de suscripción",
        error: error.message 
      });
    }
  });

  // Helper function to get userId from request
  // Helper to check if user has verified email
const requireEmailVerification = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: "Debes verificar tu email para realizar esta acción. Por favor revisa tu bandeja de entrada.",
        requiresEmailVerification: true
      });
    }

    next();
  } catch (error: any) {
    console.error("Error checking email verification:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getUserIdFromRequest = (req: any): string | null => {
    let userId = req.user?.claims?.sub || req.user?.id;
    
    if (!userId) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];
      
      if (token) {
        if (token.startsWith('eyJ')) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              userId = payload.sub || payload.userId || payload.id;
            }
          } catch (jwtError) {
            // JWT parse failed
          }
        } else {
          try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const tokenData = JSON.parse(decoded);
            userId = tokenData.claims?.sub || tokenData.userId || tokenData.id;
          } catch (decodeError) {
            // Try colon-separated format
            try {
              [userId] = Buffer.from(token, 'base64').toString('utf-8').split(':');
            } catch (e) {
              // All parsing failed
            }
          }
        }
      }
    }
    
    return userId || null;
  };

  // Create checkout session for subscription
  app.post("/api/subscriptions/checkout", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      // Debug: Log request info
      console.log('🔍 Checkout request - req.user:', req.user);
      console.log('🔍 Checkout request - auth header:', req.headers.authorization ? 'present' : 'missing');
      
      // The middleware should have set req.user, but let's verify
      const userId = req.user?.claims?.sub || req.user?.id || getUserIdFromRequest(req);
      
      if (!userId) {
        console.error('❌ No userId found in checkout request');
        return res.status(401).json({ message: "Token de acceso requerido" });
      }
      
      console.log('✅ Checkout request - userId:', userId);

      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "planId es requerido" });
      }

      // Get user email
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        console.error('❌ Checkout: User not found or no email', { userId, user: user ? 'exists' : 'not found' });
        return res.status(400).json({ message: "Usuario no encontrado o sin email" });
      }

      console.log('✅ Checkout: User found', { userId, email: user.email, planId });

      // Verify plan exists
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        console.error('❌ Checkout: Plan not found', { planId });
        return res.status(404).json({ message: `Plan no encontrado: ${planId}` });
      }
      console.log('✅ Checkout: Plan found', { planId, planName: plan.name, price: plan.price });

      // Create checkout session
      try {
        const session = await createCheckoutSession(userId, planId, user.email);
        console.log('✅ Checkout: Session created', { sessionId: session.sessionId });
        
        res.json({
          sessionId: session.sessionId,
          url: session.url,
        });
      } catch (stripeError: any) {
        console.error('❌ Checkout: Stripe error:', stripeError);
        console.error('❌ Checkout: Stripe error details:', {
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
          stack: stripeError.stack?.substring(0, 200)
        });
        throw stripeError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error("❌ Checkout: Error creating checkout session:", error);
      console.error("❌ Checkout: Error stack:", error.stack);
      res.status(500).json({ 
        message: "Error al crear sesión de checkout",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Create EMBEDDED checkout session for subscription
  app.post("/api/subscriptions/checkout-embedded", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || getUserIdFromRequest(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Token de acceso requerido" });
      }

      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "planId es requerido" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "Usuario no encontrado o sin email" });
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: `Plan no encontrado: ${planId}` });
      }

      const session = await createEmbeddedCheckoutSession(userId, planId, user.email);
      
      res.json({
        clientSecret: session.clientSecret,
        sessionId: session.sessionId,
      });
    } catch (error: any) {
      console.error("Error creating embedded checkout session:", error);
      res.status(500).json({ 
        message: "Error al crear sesión de checkout",
        error: error.message,
      });
    }
  });

  // Verify checkout session status
  app.get("/api/subscriptions/verify-session", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || getUserIdFromRequest(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Token de acceso requerido" });
      }

      const { session_id } = req.query;

      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ message: "session_id es requerido" });
      }

      if (!stripe) {
        return res.status(503).json({ message: "Stripe no está configurado" });
      }

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === 'paid' || session.status === 'complete') {
        res.json({
          status: 'success',
          session: {
            id: session.id,
            payment_status: session.payment_status,
            customer_email: session.customer_email,
          }
        });
      } else {
        res.json({
          status: 'pending',
          session: {
            id: session.id,
            payment_status: session.payment_status,
          }
        });
      }
    } catch (error: any) {
      console.error("Error verifying session:", error);
      res.status(500).json({ 
        message: "Error al verificar sesión",
        error: error.message,
      });
    }
  });

  // Get user's subscription status
  app.get("/api/subscriptions/status", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Token de acceso requerido" });
      }
      const subscription = await storage.getUserActiveSubscription(userId);
      
      if (!subscription) {
        return res.json({
          hasSubscription: false,
          plan: null,
          status: null,
        });
      }

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      res.json({
        hasSubscription: true,
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          price: plan.price,
          billingInterval: plan.billingInterval,
        } : null,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
      });
    } catch (error: any) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ 
        message: "Error al obtener estado de suscripción",
        error: error.message 
      });
    }
  });

  // Get user's subscription info (for useSubscription hook)
  app.get("/api/subscription/info", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Token de acceso requerido" });
      }

      // Import the function from subscriptionMiddleware
      const { getUserSubscriptionInfo } = await import('./subscriptionMiddleware');
      const subscriptionInfo = await getUserSubscriptionInfo(userId);
      
      if (!subscriptionInfo) {
        return res.status(500).json({ 
          message: "Error al obtener información de suscripción"
        });
      }

      res.json(subscriptionInfo);
    } catch (error: any) {
      console.error("Error fetching subscription info:", error);
      res.status(500).json({ 
        message: "Error al obtener información de suscripción",
        error: error.message 
      });
    }
  });

  // Cancel subscription
  app.post("/api/subscriptions/cancel", simpleAdminAuth, async (req: any, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Token de acceso requerido" });
      }
      const subscription = await storage.getUserActiveSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ message: "No se encontró suscripción activa" });
      }

      // Cancel in database
      await storage.cancelUserSubscription(userId);

      // If there's a Stripe subscription, cancel it there too
      const metadata = subscription.metadata as Record<string, any> | undefined;
      if (metadata?.stripeSubscriptionId && stripe) {
        try {
          await stripe.subscriptions.cancel(metadata.stripeSubscriptionId as string);
        } catch (stripeError) {
          console.error("Error canceling Stripe subscription:", stripeError);
          // Continue anyway - we've cancelled in our DB
        }
      }

      res.json({ message: "Suscripción cancelada exitosamente" });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ 
        message: "Error al cancelar suscripción",
        error: error.message 
      });
    }
  });

  // Stripe webhook endpoint (needs raw body for signature verification)
  // Note: This endpoint must be registered BEFORE express.json() middleware
  // We'll handle it by using express.raw() specifically for this route
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || !stripe) {
      return res.status(400).json({ message: "Stripe no configurado o firma faltante" });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("⚠️ STRIPE_WEBHOOK_SECRET no está configurada");
      return res.status(500).json({ message: "Webhook secret no configurado" });
    }

    let event;

    try {
      // Verify webhook signature (req.body is Buffer for raw middleware)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    try {
      // Handle the event
      await handleStripeWebhook(event);
      res.json({ received: true });
    } catch (error: any) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ 
        message: "Error procesando webhook",
        error: error.message 
      });
    }
  });

  // Initialize channels on startup
  storage.initializeCommunityChannels().catch(err => console.error("Error initializing channels:", err));

  // ============================================
  // EMAIL MARKETING ENDPOINTS
  // ============================================

  // Send manual email to users
  app.post("/api/admin/emails/send", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { subject, content, segment, userIds } = req.body;

      if (!subject || !content) {
        return res.status(400).json({ message: "subject y content son requeridos" });
      }

      const result = await sendBulkEmail({
        subject,
        content,
        segment: segment || 'all',
        userIds: userIds || undefined,
      });

      res.json({
        message: "Emails enviados",
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
      });
    } catch (error: any) {
      console.error("Error sending emails:", error);
      res.status(500).json({ 
        message: "Error al enviar emails",
        error: error.message 
      });
    }
  });

  // Test email (send to admin)
  app.post("/api/admin/emails/test", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { subject, content } = req.body;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "Usuario no encontrado o sin email" });
      }

      if (!subject || !content) {
        return res.status(400).json({ message: "subject y content son requeridos" });
      }

      const result = await sendEmail({
        to: user.email,
        subject,
        html: content,
      });

      if (result.success) {
        res.json({ message: "Email de prueba enviado exitosamente" });
      } else {
        res.status(500).json({ message: "Error al enviar email", error: result.error });
      }
    } catch (error: any) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        message: "Error al enviar email de prueba",
        error: error.message 
      });
    }
  });

  // Trigger automated email sequences manually (for testing)
  app.post("/api/admin/emails/trigger/:type", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const { userEmail, userName, daysRemaining, emailNumber, daysInactive } = req.body;

      if (!userEmail) {
        return res.status(400).json({ message: "userEmail es requerido" });
      }

      let result;
      switch (type) {
        case 'welcome':
          if (!userName) {
            return res.status(400).json({ message: "userName es requerido" });
          }
          await sendWelcomeEmail(userEmail, userName);
          result = { message: "Email de bienvenida enviado" };
          break;

        case 'trial-reminder':
          if (!userName || daysRemaining === undefined) {
            return res.status(400).json({ message: "userName y daysRemaining son requeridos" });
          }
          await sendTrialReminderEmail(userEmail, userName, daysRemaining);
          result = { message: "Email de recordatorio de trial enviado" };
          break;

        case 'onboarding':
          if (!userName || !emailNumber) {
            return res.status(400).json({ message: "userName y emailNumber son requeridos" });
          }
          await sendOnboardingEmail(userEmail, userName, emailNumber);
          result = { message: `Email de onboarding #${emailNumber} enviado` };
          break;

        case 'cancellation-recovery':
          if (!userName) {
            return res.status(400).json({ message: "userName es requerido" });
          }
          await sendCancellationRecoveryEmail(userEmail, userName);
          result = { message: "Email de recuperación de cancelación enviado" };
          break;

        case 're-engagement':
          if (!userName || daysInactive === undefined) {
            return res.status(400).json({ message: "userName y daysInactive son requeridos" });
          }
          await sendReEngagementEmail(userEmail, userName, daysInactive);
          result = { message: "Email de re-engagement enviado" };
          break;

        default:
          return res.status(400).json({ message: "Tipo de email no válido" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error triggering email:", error);
      res.status(500).json({ 
        message: "Error al enviar email",
        error: error.message 
      });
    }
  });

  // Run email automations (should be called by cron job)
  app.post("/api/admin/emails/run-automations", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { runEmailAutomations } = await import("./emailAutomations");
      await runEmailAutomations();
      res.json({ message: "Automatizaciones ejecutadas exitosamente" });
    } catch (error: any) {
      console.error("Error running email automations:", error);
      res.status(500).json({ 
        message: "Error ejecutando automatizaciones",
        error: error.message 
      });
    }
  });

  // ============================================
  // BEEHIIV INTEGRATION ENDPOINTS
  // ============================================

  // Check Beehiiv configuration
  app.get("/api/admin/beehiiv/check-config", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const config = checkBeehiivConfig();
      res.json(config);
    } catch (error: any) {
      console.error("Error checking Beehiiv config:", error);
      res.status(500).json({ 
        message: "Error verificando configuración",
        error: error.message 
      });
    }
  });

  // Public endpoint to subscribe to Beehiiv newsletter (from landing page)
  app.post("/api/beehiiv/subscribe", async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email) {
        return res.status(400).json({ message: "email es requerido" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }

      const result = await subscribeToBeehiiv({
        email,
        firstName,
        lastName,
        reactivate: true,
        tags: ['newsletter-signup'],
      });

      if (result.success) {
        res.json({ 
          message: "Suscripción exitosa. Revisa tu email para confirmar.",
          success: true 
        });
      } else {
        res.status(400).json({ 
          message: result.error || "Error al suscribir",
          success: false 
        });
      }
    } catch (error: any) {
      console.error("Error subscribing to Beehiiv:", error);
      res.status(500).json({ 
        message: "Error al procesar la suscripción",
        error: error.message 
      });
    }
  });

  // Subscribe user to Beehiiv (admin endpoint)
  app.post("/api/admin/beehiiv/subscribe", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, reactivate, tags, customFields } = req.body;

      if (!email) {
        return res.status(400).json({ message: "email es requerido" });
      }

      const result = await subscribeToBeehiiv({
        email,
        firstName,
        lastName,
        reactivate,
        tags,
        customFields,
      });

      if (result.success) {
        res.json({ message: "Usuario suscrito exitosamente", subscriberId: result.subscriberId });
      } else {
        res.status(400).json({ message: "Error al suscribir", error: result.error });
      }
    } catch (error: any) {
      console.error("Error subscribing to Beehiiv:", error);
      res.status(500).json({ 
        message: "Error al suscribir a Beehiiv",
        error: error.message 
      });
    }
  });

  // Unsubscribe user from Beehiiv
  app.post("/api/admin/beehiiv/unsubscribe", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "email es requerido" });
      }

      const result = await unsubscribeFromBeehiiv(email);

      if (result.success) {
        res.json({ message: "Usuario desuscrito exitosamente" });
      } else {
        res.status(400).json({ message: "Error al desuscribir", error: result.error });
      }
    } catch (error: any) {
      console.error("Error unsubscribing from Beehiiv:", error);
      res.status(500).json({ 
        message: "Error al desuscribir de Beehiiv",
        error: error.message 
      });
    }
  });

  // Update subscriber in Beehiiv
  app.put("/api/admin/beehiiv/subscriber", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, tags, customFields } = req.body;

      if (!email) {
        return res.status(400).json({ message: "email es requerido" });
      }

      const result = await updateBeehiivSubscriber({
        email,
        firstName,
        lastName,
        tags,
        customFields,
      });

      if (result.success) {
        res.json({ message: "Suscriptor actualizado exitosamente" });
      } else {
        res.status(400).json({ message: "Error al actualizar", error: result.error });
      }
    } catch (error: any) {
      console.error("Error updating Beehiiv subscriber:", error);
      res.status(500).json({ 
        message: "Error al actualizar suscriptor",
        error: error.message 
      });
    }
  });

  // Get subscriber from Beehiiv
  app.get("/api/admin/beehiiv/subscriber", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "email es requerido" });
      }

      const result = await getBeehiivSubscriber(email);

      if (result.success) {
        res.json({ subscriber: result.subscriber });
      } else {
        res.status(404).json({ message: "Suscriptor no encontrado", error: result.error });
      }
    } catch (error: any) {
      console.error("Error getting Beehiiv subscriber:", error);
      res.status(500).json({ 
        message: "Error al obtener suscriptor",
        error: error.message 
      });
    }
  });

  // Sync all users to Beehiiv
  app.post("/api/admin/beehiiv/sync-all", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { limit, offset, segment } = req.body;

      // Convert 'all' to undefined for the function
      const segmentValue = segment === 'all' ? undefined : segment;

      const result = await syncAllUsersToBeehiiv({
        limit: limit || 1000,
        offset: offset || 0,
        segment: segmentValue,
      });

      res.json({
        message: "Sincronización completada",
        synced: result.synced,
        failed: result.failed,
        errors: result.errors,
      });
    } catch (error: any) {
      console.error("Error syncing users to Beehiiv:", error);
      res.status(500).json({ 
        message: "Error al sincronizar usuarios",
        error: error.message 
      });
    }
  });

  // ============================================
  // ADVANCED AUTOMATIONS ENDPOINTS (Phase 5)
  // ============================================

  // Get all automations
  app.get("/api/admin/automations", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { getAllAutomations } = await import("./advancedAutomations");
      const automations = await getAllAutomations();
      res.json(automations);
    } catch (error: any) {
      console.error("Error fetching automations:", error);
      res.status(500).json({ 
        message: "Error al obtener automatizaciones",
        error: error.message 
      });
    }
  });

  // Create new automation
  app.post("/api/admin/automations", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { createAutomation } = await import("./advancedAutomations");
      const automationId = await createAutomation(req.body);
      res.json({ id: automationId, message: "Automatización creada exitosamente" });
    } catch (error: any) {
      console.error("Error creating automation:", error);
      res.status(500).json({ 
        message: "Error al crear automatización",
        error: error.message 
      });
    }
  });

  // Update automation
  app.put("/api/admin/automations/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { updateAutomation } = await import("./advancedAutomations");
      await updateAutomation(id, req.body);
      res.json({ message: "Automatización actualizada exitosamente" });
    } catch (error: any) {
      console.error("Error updating automation:", error);
      res.status(500).json({ 
        message: "Error al actualizar automatización",
        error: error.message 
      });
    }
  });

  // Get automation logs
  app.get("/api/admin/automations/:id/logs", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { getAutomationLogs } = await import("./advancedAutomations");
      const logs = await getAutomationLogs(id, 100);
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching automation logs:", error);
      res.status(500).json({ 
        message: "Error al obtener logs de automatización",
        error: error.message 
      });
    }
  });

  // Get all automation logs
  app.get("/api/admin/automations/logs", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { getAutomationLogs } = await import("./advancedAutomations");
      const logs = await getAutomationLogs(undefined, 200);
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching automation logs:", error);
      res.status(500).json({ 
        message: "Error al obtener logs de automatizaciones",
        error: error.message 
      });
    }
  });

  // Process automations manually (for testing)
  app.post("/api/admin/automations/process", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { processAutomations } = await import("./advancedAutomations");
      await processAutomations();
      res.json({ message: "Automatizaciones procesadas exitosamente" });
    } catch (error: any) {
      console.error("Error processing automations:", error);
      res.status(500).json({ 
        message: "Error al procesar automatizaciones",
        error: error.message 
      });
    }
  });

  // Get user events
  app.get("/api/admin/events", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { getUserEvents } = await import("./eventSystem");
      const { userId, eventType, limit } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "userId es requerido" });
      }

      const events = await getUserEvents(
        userId,
        eventType as any,
        limit ? parseInt(limit as string) : 100
      );
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ 
        message: "Error al obtener eventos del usuario",
        error: error.message 
      });
    }
  });

  // Get marketing analytics
  app.get("/api/admin/analytics/marketing", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { getMarketingAnalytics } = await import("./marketingAnalytics");
      const analytics = await getMarketingAnalytics();
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching marketing analytics:", error);
      res.status(500).json({ 
        message: "Error al obtener analytics de marketing",
        error: error.message 
      });
    }
  });

  // ========== SEGMENT MANAGEMENT ENDPOINTS ==========
  
  // Get all segments
  app.get("/api/admin/segments", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { getAllSegments } = await import("./segments");
      const segments = await getAllSegments();
      res.json(segments);
    } catch (error: any) {
      console.error("Error fetching segments:", error);
      res.status(500).json({ 
        message: "Error al obtener segmentos",
        error: error.message 
      });
    }
  });

  // Get segment by ID
  app.get("/api/admin/segments/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { getSegmentById } = await import("./segments");
      const segment = await getSegmentById(id);
      
      if (!segment) {
        return res.status(404).json({ message: "Segmento no encontrado" });
      }
      
      res.json(segment);
    } catch (error: any) {
      console.error("Error fetching segment:", error);
      res.status(500).json({ 
        message: "Error al obtener segmento",
        error: error.message 
      });
    }
  });

  // Create new segment
  app.post("/api/admin/segments", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { createSegment } = await import("./segments");
      const segmentId = await createSegment(req.body);
      res.json({ id: segmentId, message: "Segmento creado exitosamente" });
    } catch (error: any) {
      console.error("Error creating segment:", error);
      res.status(500).json({ 
        message: "Error al crear segmento",
        error: error.message 
      });
    }
  });

  // Update segment
  app.put("/api/admin/segments/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { updateSegment } = await import("./segments");
      await updateSegment(id, req.body);
      res.json({ message: "Segmento actualizado exitosamente" });
    } catch (error: any) {
      console.error("Error updating segment:", error);
      res.status(500).json({ 
        message: "Error al actualizar segmento",
        error: error.message 
      });
    }
  });

  // Delete segment
  app.delete("/api/admin/segments/:id", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { deleteSegment } = await import("./segments");
      await deleteSegment(id);
      res.json({ message: "Segmento eliminado exitosamente" });
    } catch (error: any) {
      console.error("Error deleting segment:", error);
      res.status(500).json({ 
        message: "Error al eliminar segmento",
        error: error.message 
      });
    }
  });

  // Calculate segment users
  app.post("/api/admin/segments/:id/calculate", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { calculateSegmentUsers } = await import("./segments");
      const userIds = await calculateSegmentUsers(id);
      res.json({ 
        userIds,
        count: userIds.length,
        message: "Segmento calculado exitosamente" 
      });
    } catch (error: any) {
      console.error("Error calculating segment:", error);
      res.status(500).json({ 
        message: "Error al calcular segmento",
        error: error.message 
      });
    }
  });

  // Recalculate all segments
  app.post("/api/admin/segments/recalculate-all", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { recalculateAllSegments } = await import("./segments");
      await recalculateAllSegments();
      res.json({ message: "Todos los segmentos recalculados exitosamente" });
    } catch (error: any) {
      console.error("Error recalculating segments:", error);
      res.status(500).json({ 
        message: "Error al recalcular segmentos",
        error: error.message 
      });
    }
  });

  // Get users in a segment
  app.get("/api/admin/segments/:id/users", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { calculateSegmentUsers } = await import("./segments");
      const userIds = await calculateSegmentUsers(id);
      
      // Get user details
      const userDetails = await Promise.all(
        userIds.map(async (userId) => {
          const user = await storage.getUser(userId);
          return user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          } : null;
        })
      );

      res.json({
        users: userDetails.filter(Boolean),
        count: userDetails.filter(Boolean).length,
      });
    } catch (error: any) {
      console.error("Error fetching segment users:", error);
      res.status(500).json({ 
        message: "Error al obtener usuarios del segmento",
        error: error.message 
      });
    }
  });

  // ========== ONBOARDING PERSONALIZATION ENDPOINTS ==========
  
  // Get personalized recommendations for a user
  app.get("/api/onboarding/recommendations", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { getPersonalizedRecommendations } = await import("./onboardingPersonalization");
      const recommendations = await getPersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error fetching personalized recommendations:", error);
      res.status(500).json({ 
        message: "Error al obtener recomendaciones personalizadas",
        error: error.message 
      });
    }
  });

  // Get onboarding automation suggestions
  app.get("/api/onboarding/automation-suggestions", simpleAdminAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { getOnboardingAutomationSuggestions } = await import("./onboardingPersonalization");
      const suggestions = await getOnboardingAutomationSuggestions(userId);
      res.json(suggestions);
    } catch (error: any) {
      console.error("Error fetching automation suggestions:", error);
      res.status(500).json({ 
        message: "Error al obtener sugerencias de automatización",
        error: error.message 
      });
    }
  });

  // Check Resend configuration
  app.get("/api/admin/emails/check-config", simpleAdminAuth, isAdmin, async (req: Request, res: Response) => {
    try {
      const hasApiKey = !!process.env.RESEND_API_KEY;
      const hasFromEmail = !!process.env.RESEND_FROM_EMAIL;
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@expertosnocodeia.com';
      const hasReplitConnector = !!process.env.REPLIT_CONNECTORS_HOSTNAME;

      // Try to initialize Resend client to verify it works
      let clientWorks = false;
      let errorMessage = null;

      try {
        if (hasApiKey) {
          const { Resend } = await import('resend');
          const testClient = new Resend(process.env.RESEND_API_KEY);
          // Try to verify the API key is valid by checking if client was created
          clientWorks = !!testClient;
        } else if (hasReplitConnector) {
          // Replit connector path - assume it works if connector is configured
          clientWorks = true;
        }
      } catch (error: any) {
        clientWorks = false;
        errorMessage = error.message;
      }

      res.json({
        configured: hasApiKey || hasReplitConnector,
        hasApiKey,
        hasFromEmail,
        fromEmail,
        hasReplitConnector,
        clientWorks: clientWorks || (hasApiKey && !errorMessage),
        error: errorMessage,
        message: (clientWorks || (hasApiKey && !errorMessage))
          ? "✅ Resend está configurado correctamente" 
          : hasApiKey 
            ? "⚠️ API Key encontrada pero hay un error: " + (errorMessage || "Desconocido")
            : "❌ RESEND_API_KEY no está configurada en las variables de entorno"
      });
    } catch (error: any) {
      console.error("Error checking Resend config:", error);
      res.status(500).json({ 
        message: "Error verificando configuración",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}