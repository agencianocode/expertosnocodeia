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
  ssl: process.env.DATABASE_URL?.includes('supabase') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

async function createTables() {
  try {
    console.log('📋 Leyendo archivo de migración...');
    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/0008_add_automations_tables.sql'),
      'utf8'
    );
    
    console.log('🔄 Ejecutando migración SQL...');
    console.log('📝 SQL a ejecutar (primeras 200 caracteres):', sql.substring(0, 200));
    
    const result = await pool.query(sql);
    
    console.log('✅ Tablas de automatizaciones creadas exitosamente');
    console.log('📊 Filas afectadas:', result.rowCount || 'N/A');
    
    // Verificar que las tablas se crearon
    const tables = ['user_events', 'automations', 'automation_logs', 'user_segments', 'marketing_analytics'];
    console.log('\n🔍 Verificando tablas creadas:');
    
    for (const table of tables) {
      const checkResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (checkResult.rows[0].exists) {
        console.log(`  ✅ Tabla ${table} existe`);
      } else {
        console.log(`  ❌ Tabla ${table} NO existe`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();

