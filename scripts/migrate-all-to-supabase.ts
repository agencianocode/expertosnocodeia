/**
 * Script completo de migración a Supabase
 * 
 * Ejecuta todas las migraciones SQL en orden y crea todas las tablas necesarias
 * 
 * Uso: npx tsx scripts/migrate-all-to-supabase.ts
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
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
  connectionTimeoutMillis: 30000,
});

// Orden de migraciones
const migrationFiles = [
  '0000_mute_shocker.sql',
  '0001_smiling_talkback.sql',
  '0002_fresh_nick_fury.sql',
  '0003_add_display_order.sql',
  '0003_add_is_admin_post.sql',
  '0004_add_points_and_profile_fields.sql',
  '0005_remove_general_channel.sql',
  '0006_update_presentante_name.sql',
  '0007_add_is_pinned_to_posts.sql',
];

async function executeSQL(sql: string, description: string) {
  try {
    // Dividir por statement-breakpoint y ejecutar cada statement
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== ';')
      .map(s => {
        // Limpiar comentarios de una línea
        return s.split('\n')
          .filter(line => !line.trim().startsWith('--') || line.trim() === '')
          .join('\n')
          .trim();
      })
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        await pool.query(statement);
      } catch (error: any) {
        // Si el error es "already exists", continuar
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('IF NOT EXISTS')) {
          console.log(`  ⚠️  Ya existe: ${error.message.split('\n')[0]}`);
          continue;
        }
        // Si es otro error, lanzarlo
        throw error;
      }
    }
    
    console.log(`✅ ${description}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error en ${description}:`, error.message);
    return false;
  }
}

async function createCommunityPostsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS community_posts (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id VARCHAR NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
      user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      title VARCHAR NOT NULL,
      content TEXT NOT NULL,
      image_url VARCHAR,
      video_url VARCHAR,
      content_blocks JSONB DEFAULT '[]'::jsonb,
      display_order INTEGER DEFAULT 0,
      is_pinned BOOLEAN DEFAULT false,
      is_admin_post BOOLEAN DEFAULT false,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_posts_channel ON community_posts(channel_id);
    CREATE INDEX IF NOT EXISTS idx_posts_user ON community_posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_pinned ON community_posts(channel_id, is_pinned) WHERE is_pinned = true;
  `;
  
  return executeSQL(sql, 'Tabla community_posts');
}

async function createPostReactionsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS post_reactions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id VARCHAR NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(post_id, user_id, emoji)
    );

    CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
  `;
  
  return executeSQL(sql, 'Tabla post_reactions');
}

async function createPostCommentsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS post_comments (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id VARCHAR NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(created_at);
  `;
  
  return executeSQL(sql, 'Tabla post_comments');
}

async function createCommentReactionsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS comment_reactions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      comment_id VARCHAR NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(comment_id, user_id, emoji)
    );

    CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
    CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);
  `;
  
  return executeSQL(sql, 'Tabla comment_reactions');
}

async function createLiveEventsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS live_events (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR NOT NULL,
      description TEXT,
      host_name VARCHAR NOT NULL,
      host_avatar VARCHAR,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      join_url VARCHAR NOT NULL,
      is_live BOOLEAN DEFAULT false,
      recording_url VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_live_events_start ON live_events(start_time);
    CREATE INDEX IF NOT EXISTS idx_live_events_live ON live_events(is_live) WHERE is_live = true;
  `;
  
  return executeSQL(sql, 'Tabla live_events');
}

async function createEventRegistrationsTable() {
  const sql = `
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
    );

    CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
    CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
    CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);
  `;
  
  return executeSQL(sql, 'Tabla event_registrations');
}

async function createUserNotificationPreferencesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_notification_preferences (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      email_notifications BOOLEAN DEFAULT true,
      in_app_notifications BOOLEAN DEFAULT true,
      mobile_notifications BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON user_notification_preferences(user_id);
  `;
  
  return executeSQL(sql, 'Tabla user_notification_preferences');
}

async function migrateAll() {
  try {
    console.log('🔄 Conectando a Supabase...');
    await pool.query('SELECT 1');
    console.log('✅ Conexión exitosa\n');

    // Ejecutar migraciones SQL en orden
    console.log('📋 Ejecutando migraciones SQL...\n');
    for (const migrationFile of migrationFiles) {
      const filePath = join(process.cwd(), 'migrations', migrationFile);
      try {
        const sql = readFileSync(filePath, 'utf-8');
        await executeSQL(sql, `Migración ${migrationFile}`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log(`⚠️  Archivo no encontrado: ${migrationFile} (continuando...)`);
        } else {
          console.error(`❌ Error leyendo ${migrationFile}:`, error.message);
        }
      }
    }

    console.log('\n📋 Creando tablas adicionales...\n');
    
    // Crear tablas que no están en las migraciones SQL
    await createCommunityPostsTable();
    await createPostReactionsTable();
    await createPostCommentsTable();
    await createCommentReactionsTable();
    await createLiveEventsTable();
    await createEventRegistrationsTable();
    await createUserNotificationPreferencesTable();

    // Verificar tablas creadas
    console.log('\n📊 Verificando tablas creadas...\n');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`✅ Total de tablas: ${result.rows.length}\n`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    console.log('\n✅ ¡Migración completada exitosamente!');
    
  } catch (error: any) {
    console.error('❌ Error durante la migración:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateAll();
