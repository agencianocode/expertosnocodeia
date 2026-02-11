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
    const migrationFile = process.argv[2] || "0009_add_email_verification_expires.sql";
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔄 EJECUTANDO MIGRACIÓN DE BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`📄 Archivo: ${migrationFile}\n`);
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada en .env');
      process.exit(1);
    }
    console.log('✅ DATABASE_URL encontrada\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    
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

