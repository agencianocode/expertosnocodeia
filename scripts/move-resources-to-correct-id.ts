/**
 * Script para mover archivos de recursos al resourceId correcto en Supabase Storage
 * 
 * Busca archivos con el resourceId antiguo y los mueve al nuevo resourceId (que es el ID del recurso)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DATABASE_URL) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const isSupabase = DATABASE_URL.includes('supabase');
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

async function moveResources() {
  try {
    console.log('🔄 Buscando archivos para mover al resourceId correcto...\n');
    
    // Obtener todos los recursos
    const result = await pool.query(
      `SELECT id, file_name, file_url FROM lesson_resources WHERE file_url LIKE '/lesson-resources/%'`
    );
    
    console.log(`📊 Total de recursos: ${result.rows.length}\n`);
    
    let moved = 0;
    let notFound = 0;
    let errors = 0;
    
    for (const resource of result.rows) {
      // Extraer resourceId de la URL
      const urlMatch = resource.file_url.match(/lesson-resources\/([^\/]+)\/(.+)$/);
      
      if (!urlMatch) continue;
      
      const [, urlResourceId, fileName] = urlMatch;
      const correctResourceId = resource.id;
      
      // Si ya coincide, no hacer nada
      if (urlResourceId === correctResourceId) {
        continue;
      }
      
      console.log(`\n🔍 Recurso: ${resource.id}`);
      console.log(`   ResourceId en URL: ${urlResourceId}`);
      console.log(`   ResourceId correcto: ${correctResourceId}`);
      console.log(`   Nombre archivo: ${resource.file_name}`);
      
      // Buscar archivo con el resourceId antiguo
      const oldPath = `${urlResourceId}/${resource.file_name}`;
      const { data: oldFile, error: downloadError } = await supabase.storage
        .from('lesson-resources')
        .download(oldPath);
      
      if (downloadError || !oldFile) {
        // Intentar con el nombre de la URL
        const oldPathAlt = `${urlResourceId}/${fileName}`;
        const { data: oldFileAlt, error: downloadErrorAlt } = await supabase.storage
          .from('lesson-resources')
          .download(oldPathAlt);
        
        if (downloadErrorAlt || !oldFileAlt) {
          console.log(`   ❌ Archivo no encontrado con resourceId antiguo`);
          notFound++;
          continue;
        }
        
        // Usar el archivo alternativo
        const arrayBuffer = await oldFileAlt.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Subir al resourceId correcto
        const newPath = `${correctResourceId}/${resource.file_name}`;
        const { error: uploadError } = await supabase.storage
          .from('lesson-resources')
          .upload(newPath, buffer, {
            contentType: 'application/octet-stream',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`   ❌ Error subiendo: ${uploadError.message}`);
          errors++;
        } else {
          console.log(`   ✅ Movido a: ${newPath}`);
          
          // Eliminar el archivo antiguo
          const { error: deleteError } = await supabase.storage
            .from('lesson-resources')
            .remove([oldPathAlt]);
          
          if (deleteError) {
            console.log(`   ⚠️ No se pudo eliminar archivo antiguo: ${deleteError.message}`);
          }
          
          moved++;
        }
      } else {
        // Archivo encontrado con el nombre correcto
        const arrayBuffer = await oldFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Subir al resourceId correcto
        const newPath = `${correctResourceId}/${resource.file_name}`;
        const { error: uploadError } = await supabase.storage
          .from('lesson-resources')
          .upload(newPath, buffer, {
            contentType: 'application/octet-stream',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`   ❌ Error subiendo: ${uploadError.message}`);
          errors++;
        } else {
          console.log(`   ✅ Movido a: ${newPath}`);
          
          // Eliminar el archivo antiguo
          const { error: deleteError } = await supabase.storage
            .from('lesson-resources')
            .remove([oldPath]);
          
          if (deleteError) {
            console.log(`   ⚠️ No se pudo eliminar archivo antiguo: ${deleteError.message}`);
          }
          
          moved++;
        }
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`✅ Movidos: ${moved}`);
    console.log(`❌ No encontrados: ${notFound}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`\n✅ ¡Proceso completado!`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

moveResources();

