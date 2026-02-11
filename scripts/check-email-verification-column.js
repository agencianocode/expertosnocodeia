import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false } 
    : undefined,
});

async function checkColumn() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 VERIFICANDO COLUMNA email_verification_expires');
    console.log('═══════════════════════════════════════════════════════\n');

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada en .env');
      process.exit(1);
    }
    console.log('✅ DATABASE_URL encontrada\n');

    // Check if column exists
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'email_verification_expires';
    `);

    if (result.rows.length === 0) {
      console.log('❌ La columna email_verification_expires NO existe');
      console.log('   Por favor ejecuta la migración primero.\n');
      process.exit(1);
    }

    const column = result.rows[0];
    console.log('✅ Columna encontrada:');
    console.log(`   Nombre: ${column.column_name}`);
    console.log(`   Tipo: ${column.data_type}`);
    console.log(`   Nullable: ${column.is_nullable}`);
    console.log(`   Default: ${column.column_default || 'NULL'}\n`);

    // Check if there are any users with verification tokens
    const usersWithTokens = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE email_verification_token IS NOT NULL;
    `);

    console.log(`📊 Usuarios con tokens de verificación: ${usersWithTokens.rows[0].count}`);

    // Check if any tokens have expiration dates
    const tokensWithExpiration = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE email_verification_expires IS NOT NULL;
    `);

    console.log(`📊 Tokens con fecha de expiración: ${tokensWithExpiration.rows[0].count}\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ VERIFICACIÓN COMPLETADA - Columna existe correctamente');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error verificando columna:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkColumn();

