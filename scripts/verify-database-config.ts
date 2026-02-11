import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada en .env');
  process.exit(1);
}

console.log('🔍 Verificando configuración de DATABASE_URL...\n');

// Ocultar la contraseña para mostrar
const maskedUrl = DATABASE_URL.replace(/:([^:@]+)@/, ':***@');

console.log('📋 Configuración actual:');
console.log(`   URL: ${maskedUrl}\n`);

// Verificar si usa pooler
const usesPooler = DATABASE_URL.includes('pooler.supabase.com');
const usesDirect = DATABASE_URL.includes('db.') && DATABASE_URL.includes('.supabase.co') && !DATABASE_URL.includes('pooler');

console.log('✅ Verificaciones:');
console.log(`   - ¿Usa pooler? ${usesPooler ? '✅ SÍ' : '❌ NO'}`);
console.log(`   - ¿Usa conexión directa? ${usesDirect ? '⚠️  SÍ (puede causar problemas)' : '✅ NO'}`);
console.log(`   - ¿Es Supabase? ${DATABASE_URL.includes('supabase') ? '✅ SÍ' : '❌ NO'}\n`);

if (usesDirect) {
  console.log('⚠️  ADVERTENCIA: Estás usando conexión directa.');
  console.log('   Esto puede causar errores "getaddrinfo ENOTFOUND" en redes IPv4.');
  console.log('   Debes cambiar a usar el pooler de Supabase.\n');
  console.log('   Solución:');
  console.log('   1. Ve a Supabase Dashboard > Settings > Database');
  console.log('   2. Cambia "Method" de "Direct connection" a "Session pooler"');
  console.log('   3. Copia la nueva connection string');
  console.log('   4. Actualiza DATABASE_URL en tu archivo .env\n');
  process.exit(1);
}

if (usesPooler) {
  console.log('✅ Configuración correcta: Estás usando el pooler de Supabase.');
  console.log('   Esto debería resolver los problemas de conexión.\n');
  
  // Verificar formato
  const poolerMatch = DATABASE_URL.match(/@([^.]+)\.pooler\.supabase\.com/);
  if (poolerMatch) {
    console.log(`   Pooler detectado: ${poolerMatch[1]}`);
  }
  
  console.log('\n✅ La configuración parece correcta. Prueba ejecutar el servidor ahora.');
}

