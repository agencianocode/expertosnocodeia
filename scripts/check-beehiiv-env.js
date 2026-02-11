import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verificando variables de entorno de Beehiiv...\n');

// Check if .env file exists
const envPath = join(process.cwd(), '.env');
const envExists = existsSync(envPath);

console.log(`Archivo .env: ${envExists ? '✅ Existe' : '❌ NO existe'}`);

if (envExists) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const beehiivLines = envContent.split('\n').filter(line => line.includes('BEEHIIV'));
    
    if (beehiivLines.length > 0) {
      console.log('\n📝 Líneas encontradas en .env:');
      beehiivLines.forEach((line, idx) => {
        // Mask sensitive data
        const masked = line.replace(/(BEEHIIV_\w+=)(.+)/, (match, key, value) => {
          if (value.trim().length > 0) {
            return key + value.trim().substring(0, 10) + '...';
          }
          return key + '(vacío)';
        });
        console.log(`   ${idx + 1}. ${masked}`);
      });
    } else {
      console.log('\n⚠️ No se encontraron líneas con BEEHIIV en .env');
    }
  } catch (error) {
    console.log(`\n❌ Error leyendo .env: ${error.message}`);
  }
}

console.log('\n🔑 Variables cargadas en process.env:');
const apiKey = process.env.BEEHIIV_API_KEY;
const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

console.log('BEEHIIV_API_KEY:', apiKey ? `✅ Configurada (${apiKey.substring(0, 10)}...)` : '❌ NO configurada');
console.log('BEEHIIV_PUBLICATION_ID:', publicationId ? `✅ Configurada (${publicationId})` : '❌ NO configurada');

if (apiKey && publicationId) {
  console.log('\n✅ Todas las variables están configuradas correctamente!');
  console.log('\n💡 Si el servidor sigue mostrando errores, reinícialo con: npm run dev');
} else {
  console.log('\n⚠️ Faltan variables de entorno. Asegúrate de:');
  console.log('   1. Crear/editar el archivo .env en la raíz del proyecto');
  console.log('   2. Agregar las variables en este formato (sin espacios alrededor del =):');
  console.log('      BEEHIIV_API_KEY=tu_api_key_aqui');
  console.log('      BEEHIIV_PUBLICATION_ID=tu_publication_id_aqui');
  console.log('   3. Reiniciar el servidor después de agregar las variables');
  console.log('   4. Verificar que no haya comillas alrededor de los valores');
}
