/**
 * Script para corregir URLs de recursos donde el resourceId no coincide con el ID del recurso
 */

import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurado');
  process.exit(1);
}

const isSupabase = DATABASE_URL.includes('supabase');
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

async function fixResourceUrls() {
  try {
    console.log('🔄 Buscando recursos con URLs incorrectas...\n');
    
    // Obtener todos los recursos
    const result = await pool.query(
      `SELECT id, file_name, file_url FROM lesson_resources`
    );
    
    console.log(`📊 Total de recursos: ${result.rows.length}\n`);
    
    let fixed = 0;
    let errors = 0;
    
    for (const resource of result.rows) {
      // Extraer resourceId de la URL
      const urlMatch = resource.file_url.match(/lesson-resources\/([^\/]+)\/(.+)$/);
      
      if (urlMatch) {
        const [, urlResourceId, fileName] = urlMatch;
        
        // Si el resourceId en la URL no coincide con el ID del recurso, corregirlo
        if (urlResourceId !== resource.id) {
          const correctUrl = `/lesson-resources/${resource.id}/${resource.file_name}`;
          
          console.log(`🔧 Corrigiendo recurso ${resource.id}:`);
          console.log(`   URL anterior: ${resource.file_url}`);
          console.log(`   URL nueva: ${correctUrl}`);
          
          try {
            await pool.query(
              `UPDATE lesson_resources SET file_url = $1 WHERE id = $2`,
              [correctUrl, resource.id]
            );
            
            console.log(`   ✅ Actualizado\n`);
            fixed++;
          } catch (error: any) {
            console.error(`   ❌ Error: ${error.message}\n`);
            errors++;
          }
        }
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`✅ Corregidos: ${fixed}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`\n✅ ¡Proceso completado!`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixResourceUrls();

