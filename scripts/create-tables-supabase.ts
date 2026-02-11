/**
 * Script para crear las tablas faltantes en Supabase
 * 
 * Este script crea las tablas live_events y event_registrations
 * que pueden no existir en Supabase.
 * 
 * Uso: npx tsx scripts/create-tables-supabase.ts
 */

import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurado en .env');
  process.exit(1);
}

const isSupabase = DATABASE_URL.includes('supabase');
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // 30 seconds for Supabase
});

async function createTables() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Create live_events table
    console.log('🔄 Creando tabla live_events...');
    await pool.query(`
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
    console.log('✅ Tabla live_events creada o ya existe');
    
    // Create event_registrations table
    console.log('🔄 Creando tabla event_registrations...');
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
    console.log('✅ Tabla event_registrations creada o ya existe');
    
    // List all tables to verify
    console.log('\n📋 Verificando tablas existentes...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n✅ Total de tablas: ${result.rows.length}`);
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    console.log('\n✅ ¡Proceso completado exitosamente!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('❌ Detalles:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();

