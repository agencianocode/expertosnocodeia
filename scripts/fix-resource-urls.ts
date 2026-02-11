/**
 * Script para corregir URLs de recursos de lecciones
 * 
 * Convierte URLs directas de Supabase a rutas relativas del servidor
 * para evitar problemas de CORS.
 * 
 * Uso: npx tsx scripts/fix-resource-urls.ts
 */

import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurado en .env');
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
    console.log('🔄 Conectando a la base de datos...');
    await pool.query('SELECT 1');
    console.log('✅ Conexión exitosa');
    
    // Get all lesson resources with Supabase URLs
    console.log('\n📋 Buscando recursos con URLs de Supabase...');
    const result = await pool.query(`
      SELECT id, file_url, file_name
      FROM lesson_resources
      WHERE file_url LIKE '%supabase.co/storage%'
    `);
    
    console.log(`📊 Encontrados ${result.rows.length} recursos con URLs de Supabase`);
    
    if (result.rows.length === 0) {
      console.log('✅ No hay URLs que corregir');
      await pool.end();
      return;
    }
    
    let updated = 0;
    let errors = 0;
    
    for (const row of result.rows) {
      try {
        // Extract resourceId and fileName from Supabase URL
        // Format: https://...supabase.co/storage/v1/object/public/lesson-resources/resourceId/fileName
        const urlMatch = row.file_url.match(/lesson-resources\/([^\/]+)\/(.+)$/);
        
        if (urlMatch) {
          const [, resourceId, fileName] = urlMatch;
          const newUrl = `/lesson-resources/${resourceId}/${fileName}`;
          
          // Update the URL
          await pool.query(
            `UPDATE lesson_resources SET file_url = $1 WHERE id = $2`,
            [newUrl, row.id]
          );
          
          console.log(`✅ Actualizado: ${row.file_name} -> ${newUrl}`);
          updated++;
        } else {
          console.log(`⚠️ No se pudo extraer path de: ${row.file_url}`);
          errors++;
        }
      } catch (error: any) {
        console.error(`❌ Error actualizando ${row.id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`✅ Actualizados: ${updated}`);
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

