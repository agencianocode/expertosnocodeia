import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false } 
    : undefined,
});

async function runMigration() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔄 EJECUTANDO MIGRACIÓN: Agregar campo role a users');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada en .env');
      process.exit(1);
    }
    console.log('✅ DATABASE_URL encontrada\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '0010_add_user_role.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Archivo de migración no encontrado: ${migrationPath}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`📝 Contenido del archivo leído (${migrationSQL.length} caracteres)\n`);
    
    // Execute the migration
    console.log('🔄 Ejecutando migración...\n');
    try {
      const result = await pool.query(migrationSQL);
      console.log('✅ Migración ejecutada exitosamente');
      if (result.rows && result.rows.length > 0) {
        console.log(`📊 Filas afectadas: ${result.rowCount || 0}`);
      }
    } catch (error) {
      // Some errors are expected (like IF NOT EXISTS)
      if (error.message?.includes("already exists") || 
          error.message?.includes("duplicate") ||
          (error.message?.includes("does not exist") && error.message?.includes("IF NOT EXISTS")) ||
          error.message?.includes("already exists")) {
        console.log(`⚠️  La migración ya fue aplicada o no aplica (esto es normal)`);
        console.log(`   Mensaje: ${error.message.split('\n')[0]}`);
      } else {
        console.error(`❌ Error ejecutando migración:`);
        console.error(`   ${error.message}`);
        throw error;
      }
    }
    
    // Update existing users based on their subscription status
    console.log('\n🔄 Actualizando roles de usuarios existentes basados en suscripciones...\n');
    try {
      // Get all users with active subscriptions
      const usersWithSubscriptions = await pool.query(`
        SELECT DISTINCT us.user_id
        FROM user_subscriptions us
        WHERE us.status = 'active'
      `);
      
      if (usersWithSubscriptions.rows.length > 0) {
        const userIds = usersWithSubscriptions.rows.map(r => r.user_id);
        await pool.query(`
          UPDATE users 
          SET role = 'paid_user', updated_at = NOW()
          WHERE id = ANY($1::text[])
        `, [userIds]);
        console.log(`✅ ${userIds.length} usuarios actualizados a 'paid_user'`);
      } else {
        console.log('ℹ️  No se encontraron usuarios con suscripciones activas');
      }
      
      // Ensure all other users have role 'user'
      const updateResult = await pool.query(`
        UPDATE users 
        SET role = 'user', updated_at = NOW()
        WHERE role IS NULL OR role NOT IN ('paid_user', 'instructor', 'moderator')
      `);
      console.log(`✅ ${updateResult.rowCount || 0} usuarios actualizados a 'user'`);
      
    } catch (error) {
      console.error('⚠️  Error actualizando roles de usuarios existentes:', error.message);
      // Don't fail the migration if this fails
    }
    
    console.log('\n✅ Migración completada exitosamente!');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Error ejecutando migración:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

