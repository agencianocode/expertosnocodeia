import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Debug de variables de entorno...\n');

const envPath = join(process.cwd(), '.env');
console.log(`Ruta del .env: ${envPath}`);
console.log(`¿Existe?: ${existsSync(envPath) ? 'Sí' : 'No'}\n`);

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  console.log('📄 Contenido del .env (primeras 500 caracteres):');
  console.log(content.substring(0, 500));
  console.log('\n---\n');
  
  // Buscar líneas con BEEHIIV
  const lines = content.split('\n');
  const beehiivLines = lines.filter((line, idx) => {
    const trimmed = line.trim();
    return trimmed.includes('BEEHIIV') || (idx >= 57 && idx <= 62);
  });
  
  console.log('📝 Líneas relevantes (58-62 y con BEEHIIV):');
  lines.forEach((line, idx) => {
    if ((idx >= 57 && idx <= 61) || line.includes('BEEHIIV')) {
      // Mostrar sin valores sensibles
      const masked = line.replace(/(BEEHIIV_\w+=)(.*)/, (match, key, value) => {
        if (value && value.trim().length > 0) {
          return key + value.trim().substring(0, 5) + '...';
        }
        return key + '(vacío)';
      });
      console.log(`   Línea ${idx + 1}: ${masked}`);
      console.log(`   Longitud: ${line.length}, Trimmed: ${line.trim().length}`);
      console.log(`   Tiene espacios al inicio: ${line !== line.trimStart()}`);
      console.log(`   Tiene espacios al final: ${line !== line.trimEnd()}`);
    }
  });
}

console.log('\n🔑 Variables después de dotenv.config():');
const result = dotenv.config();
console.log(`Resultado: ${result.error ? 'ERROR: ' + result.error.message : 'OK'}`);
console.log(`Variables parseadas: ${result.parsed ? Object.keys(result.parsed).length : 0}`);

console.log('\n🔍 Variables en process.env:');
console.log('BEEHIIV_API_KEY:', process.env.BEEHIIV_API_KEY ? `✅ (${process.env.BEEHIIV_API_KEY.substring(0, 10)}...)` : '❌ NO existe');
console.log('BEEHIIV_PUBLICATION_ID:', process.env.BEEHIIV_PUBLICATION_ID ? `✅ (${process.env.BEEHIIV_PUBLICATION_ID})` : '❌ NO existe');

