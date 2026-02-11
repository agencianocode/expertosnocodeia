import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

async function verifySchema() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 VERIFICACIÓN DE ESQUEMA DE BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada en .env');
      process.exit(1);
    }
    console.log('✅ DATABASE_URL encontrada\n');

    // Check if users table exists
    const usersTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!usersTableCheck.rows[0].exists) {
      console.error('❌ La tabla "users" no existe');
      process.exit(1);
    }
    console.log('✅ Tabla "users" existe');

    // Check required columns in users table
    const requiredColumns = [
      'id',
      'email',
      'password',
      'is_email_verified',
      'email_verification_token',
      'email_verification_expires',
      'password_reset_token',
      'password_reset_expires',
      'created_at',
      'updated_at'
    ];

    console.log('\n📋 Verificando columnas en tabla "users":');
    for (const column of requiredColumns) {
      const columnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = $1
        );
      `, [column]);
      
      if (columnCheck.rows[0].exists) {
        console.log(`  ✅ ${column}`);
      } else {
        console.log(`  ❌ ${column} - FALTA`);
      }
    }

    // Check automation tables
    const automationTables = [
      'user_events',
      'automations',
      'automation_logs',
      'user_segments',
      'marketing_analytics'
    ];

    console.log('\n📋 Verificando tablas de automatizaciones:');
    for (const table of automationTables) {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (tableCheck.rows[0].exists) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ⚠️  ${table} - No existe (opcional)`);
      }
    }

    // Check indexes
    console.log('\n📋 Verificando índices importantes:');
    const indexesCheck = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname LIKE '%email%' OR indexname LIKE '%unique%';
    `);
    
    if (indexesCheck.rows.length > 0) {
      indexesCheck.rows.forEach(row => {
        console.log(`  ✅ ${row.indexname}`);
      });
    } else {
      console.log('  ⚠️  No se encontraron índices relacionados con email');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error verificando esquema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();

