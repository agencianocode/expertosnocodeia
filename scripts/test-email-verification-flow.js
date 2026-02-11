import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false } 
    : undefined,
});

async function testEmailVerificationFlow() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TESTING: Flujo de Verificación de Email');
    console.log('═══════════════════════════════════════════════════════\n');

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada');
      process.exit(1);
    }

    // Test 1: Verificar que la columna existe
    console.log('📋 Test 1: Verificar columna email_verification_expires');
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'email_verification_expires';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('  ❌ Columna NO existe - Ejecuta la migración primero\n');
      process.exit(1);
    }
    console.log('  ✅ Columna existe');
    console.log(`     Tipo: ${columnCheck.rows[0].data_type}`);
    console.log(`     Nullable: ${columnCheck.rows[0].is_nullable}\n`);

    // Test 2: Verificar usuarios con tokens
    console.log('📋 Test 2: Verificar usuarios con tokens de verificación');
    const usersWithTokens = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(email_verification_token) as with_token,
        COUNT(email_verification_expires) as with_expiration,
        COUNT(CASE WHEN is_email_verified = false AND email_verification_token IS NOT NULL THEN 1 END) as unverified_with_token
      FROM users;
    `);

    const stats = usersWithTokens.rows[0];
    console.log(`  📊 Total usuarios: ${stats.total}`);
    console.log(`  📊 Con token: ${stats.with_token}`);
    console.log(`  📊 Con expiración: ${stats.with_expiration}`);
    console.log(`  📊 No verificados con token: ${stats.unverified_with_token}\n`);

    // Test 3: Verificar tokens expirados
    console.log('📋 Test 3: Verificar tokens expirados');
    const expiredTokens = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE email_verification_token IS NOT NULL
      AND email_verification_expires IS NOT NULL
      AND email_verification_expires < NOW();
    `);
    console.log(`  📊 Tokens expirados: ${expiredTokens.rows[0].count}\n`);

    // Test 4: Verificar tokens válidos (no expirados)
    console.log('📋 Test 4: Verificar tokens válidos');
    const validTokens = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE email_verification_token IS NOT NULL
      AND email_verification_expires IS NOT NULL
      AND email_verification_expires >= NOW();
    `);
    console.log(`  📊 Tokens válidos: ${validTokens.rows[0].count}\n`);

    // Test 5: Verificar usuarios no verificados
    console.log('📋 Test 5: Verificar usuarios no verificados');
    const unverifiedUsers = await pool.query(`
      SELECT 
        email,
        is_email_verified,
        email_verification_token IS NOT NULL as has_token,
        email_verification_expires IS NOT NULL as has_expiration,
        CASE 
          WHEN email_verification_expires < NOW() THEN 'expired'
          WHEN email_verification_expires >= NOW() THEN 'valid'
          ELSE 'no_expiration'
        END as token_status
      FROM users
      WHERE is_email_verified = false
      LIMIT 5;
    `);

    if (unverifiedUsers.rows.length > 0) {
      console.log(`  📊 Encontrados ${unverifiedUsers.rows.length} usuarios no verificados (mostrando primeros 5):`);
      unverifiedUsers.rows.forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.email}`);
        console.log(`        Token: ${user.has_token ? 'Sí' : 'No'}`);
        console.log(`        Expiración: ${user.has_expiration ? 'Sí' : 'No'}`);
        console.log(`        Estado: ${user.token_status}`);
      });
    } else {
      console.log('  ✅ No hay usuarios no verificados');
    }
    console.log('');

    // Test 6: Verificar integridad de datos
    console.log('📋 Test 6: Verificar integridad de datos');
    const integrityCheck = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_email_verified = true AND email_verification_token IS NOT NULL THEN 1 END) as verified_with_token,
        COUNT(CASE WHEN is_email_verified = false AND email_verification_token IS NULL THEN 1 END) as unverified_no_token
      FROM users;
    `);

    const integrity = integrityCheck.rows[0];
    console.log(`  📊 Total usuarios: ${integrity.total}`);
    
    if (integrity.verified_with_token > 0) {
      console.log(`  ⚠️  Usuarios verificados con token (deberían estar limpios): ${integrity.verified_with_token}`);
    } else {
      console.log(`  ✅ No hay usuarios verificados con tokens (correcto)`);
    }

    if (integrity.unverified_no_token > 0) {
      console.log(`  ⚠️  Usuarios no verificados sin token: ${integrity.unverified_no_token}`);
    } else {
      console.log(`  ✅ Todos los usuarios no verificados tienen token`);
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TESTING COMPLETADO');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 Próximos pasos:');
    console.log('   1. Ejecuta el testing manual siguiendo TESTING_EMAIL_VERIFICATION.md');
    console.log('   2. Prueba el flujo completo de registro y verificación');
    console.log('   3. Verifica las restricciones de comentarios\n');

  } catch (error) {
    console.error('❌ Error en testing:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testEmailVerificationFlow();

