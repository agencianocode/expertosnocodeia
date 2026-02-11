import dotenv from "dotenv";
dotenv.config();

// Support both Neon and Supabase PostgreSQL
// Supabase uses standard PostgreSQL, so we use pg for compatibility
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Debug: Verificar qué DATABASE_URL se está usando
const dbUrl = process.env.DATABASE_URL;
const isNeon = dbUrl?.includes('neon.tech') || dbUrl?.includes('neon.tech');
const isSupabase = dbUrl?.includes('supabase');

console.log('🔍 Configuración de Base de Datos:');
console.log('   - URL (primeros 60 caracteres):', dbUrl?.substring(0, 60) + '...');
console.log('   - ¿Es Neon?', isNeon);
console.log('   - ¿Es Supabase?', isSupabase);

if (isNeon) {
  console.warn('⚠️  ADVERTENCIA: Estás usando Neon. Si migraste a Supabase, verifica tu archivo .env');
}

if (!isSupabase && !isNeon) {
  console.warn('⚠️  ADVERTENCIA: No se detectó ni Supabase ni Neon en DATABASE_URL');
}

// Configure SSL for Supabase (required for production)
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 30, // Connection pool size (increased for better concurrency)
  min: 5, // Minimum connections to keep alive
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 30000, // Increased to 30 seconds for Supabase pooler
  statement_timeout: 30000, // Query timeout: 30 seconds
  query_timeout: 30000, // Alternative query timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Conexión a la base de datos establecida');
});

pool.on('error', (err) => {
  console.error('❌ Error en el pool de conexiones:', err.message);
  if (err.message.includes('Neon') || err.message.includes('endpoint') || err.message.includes('disabled')) {
    console.error('⚠️  El error sugiere que estás intentando conectar a Neon (suspendido).');
    console.error('   Verifica que DATABASE_URL en tu .env apunte a Supabase, no a Neon.');
  }
});

export const db = drizzle({ client: pool, schema });