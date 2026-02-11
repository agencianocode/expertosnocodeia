// Script de prueba para verificar la conexión a la base de datos
import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

console.log('\n🔍 Verificando configuración de base de datos...\n');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL no está definida en el archivo .env');
  process.exit(1);
}

console.log('📋 Información de conexión:');
console.log('   - URL (primeros 70 caracteres):', dbUrl.substring(0, 70) + '...');
console.log('   - ¿Contiene "supabase"?', dbUrl.includes('supabase'));
console.log('   - ¿Contiene "neon"?', dbUrl.includes('neon'));
console.log('   - ¿Contiene "neon.tech"?', dbUrl.includes('neon.tech'));

if (dbUrl.includes('neon.tech') || dbUrl.includes('neon')) {
  console.error('\n⚠️  ADVERTENCIA: Estás usando Neon, pero deberías usar Supabase!');
  console.error('   Comenta la línea de Neon en tu .env y deja solo la de Supabase.\n');
}

if (!dbUrl.includes('supabase')) {
  console.warn('\n⚠️  ADVERTENCIA: No se detectó Supabase en DATABASE_URL');
  console.warn('   Asegúrate de que tu DATABASE_URL apunte a Supabase.\n');
}

// Configurar SSL para Supabase
const isSupabase = dbUrl.includes('supabase');
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

console.log('\n🔌 Intentando conectar a la base de datos...\n');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
  connectionTimeoutMillis: 10000,
});

pool.query('SELECT NOW() as current_time, version() as postgres_version', (err, res) => {
  if (err) {
    console.error('❌ Error de conexión:', err.message);
    console.error('   - Código de error:', err.code);
    console.error('   - Detalles:', err);
    
    if (err.message.includes('Neon') || err.message.includes('endpoint') || err.message.includes('disabled')) {
      console.error('\n⚠️  El error sugiere que estás intentando conectar a Neon (suspendido).');
      console.error('   Solución: Verifica que DATABASE_URL en tu .env apunte a Supabase, no a Neon.');
    }
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  La conexión fue rechazada.');
      console.error('   Verifica que:');
      console.error('   1. El proyecto de Supabase está activo (no pausado)');
      console.error('   2. La URL de conexión es correcta');
      console.error('   3. La contraseña es correcta');
    }
    
    process.exit(1);
  } else {
    console.log('✅ Conexión exitosa!');
    console.log('   - Hora del servidor:', res.rows[0].current_time);
    console.log('   - Versión de PostgreSQL:', res.rows[0].postgres_version.split(' ')[0] + ' ' + res.rows[0].postgres_version.split(' ')[1]);
    console.log('\n🎉 La base de datos está configurada correctamente!\n');
    pool.end();
    process.exit(0);
  }
});

