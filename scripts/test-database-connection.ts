import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada');
  process.exit(1);
}

console.log('🔍 Probando conexión a la base de datos...\n');

// Extraer componentes de la URL para diagnóstico
try {
  const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@(.+)/);
  if (urlMatch) {
    const [, user, password, host] = urlMatch;
    console.log('📋 Componentes de la conexión:');
    console.log(`   Usuario: ${user}`);
    console.log(`   Contraseña: ${password.substring(0, 5)}... (oculta)`);
    console.log(`   Host: ${host.substring(0, 50)}...`);
    console.log('');
  }
} catch (e) {
  console.log('⚠️  No se pudo parsear la URL para diagnóstico\n');
}

const isSupabase = DATABASE_URL.includes('supabase');
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('🔄 Intentando conectar...');
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ ¡Conexión exitosa!');
    console.log(`   Hora del servidor: ${result.rows[0].current_time}`);
    console.log(`   Versión: ${result.rows[0].version.substring(0, 50)}...\n`);
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n💡 El error "password authentication failed" puede deberse a:');
      console.log('   1. La contraseña es incorrecta');
      console.log('   2. La contraseña contiene caracteres especiales que necesitan codificación URL');
      console.log('   3. El usuario "postgres" no tiene permisos\n');
      console.log('🔧 Soluciones:');
      console.log('   1. Ve a Supabase Dashboard > Settings > Database');
      console.log('   2. Resetea la contraseña de la base de datos');
      console.log('   3. Copia la connection string COMPLETA de Supabase (ya incluye la contraseña codificada)');
      console.log('   4. Si tienes caracteres especiales (@, #, %, etc.) en la contraseña, usa encodeURIComponent()\n');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

