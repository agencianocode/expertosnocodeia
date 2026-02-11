// Script para codificar la contraseña correctamente para PostgreSQL connection string

const password = 'Fabian.Segura2025'; // Reemplaza con tu contraseña real

// Codificar solo los caracteres especiales que necesitan encoding en URLs
const encodedPassword = encodeURIComponent(password);

console.log('📋 Codificación de contraseña para PostgreSQL:\n');
console.log(`   Contraseña original: ${password}`);
console.log(`   Contraseña codificada: ${encodedPassword}\n`);
console.log('💡 Caracteres que se codifican:');
console.log('   @ → %40');
console.log('   # → %23');
console.log('   % → %25');
console.log('   / → %2F');
console.log('   : → %3A');
console.log('   + → %2B');
console.log('   = → %3D');
console.log('   & → %26');
console.log('   ? → %3F');
console.log('   espacio → %20\n');
console.log('✅ Usa la contraseña codificada en tu DATABASE_URL');
console.log(`   Ejemplo: postgresql://postgres.ehmihfufuufthefwrnrb:${encodedPassword}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`);

