/**
 * Script para corregir recursos faltantes
 * 
 * Busca recursos por lessonId y los corrige si faltan archivos
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
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

async function fixMissingResource() {
  try {
    // Buscar el recurso por nombre de archivo
    const fileName = '8.1_Plantilla_Maestra_Z_API_Desactivar.json';
    
    console.log(`🔍 Buscando recursos con nombre: ${fileName}\n`);
    
    const result = await pool.query(
      `SELECT id, lesson_id, file_name, file_url, title 
       FROM lesson_resources 
       WHERE file_name LIKE $1 OR file_name LIKE $2`,
      [`%Desactivar%`, `%8.1%`]
    );
    
    console.log(`📊 Encontrados ${result.rows.length} recursos:\n`);
    
    for (const resource of result.rows) {
      console.log(`ID: ${resource.id}`);
      console.log(`  - Título: ${resource.title}`);
      console.log(`  - Nombre: ${resource.file_name}`);
      console.log(`  - URL: ${resource.file_url}`);
      console.log(`  - Lesson ID: ${resource.lesson_id || 'N/A'}`);
      
      // Verificar si existe en Storage
      const urlMatch = resource.file_url.match(/lesson-resources\/([^\/]+)\/(.+)$/);
      if (urlMatch) {
        const [, resourceId, fileName] = urlMatch;
        const filePath = `${resourceId}/${resource.file_name}`;
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('lesson-resources')
          .download(filePath);
        
        if (downloadError || !fileData) {
          console.log(`  ❌ NO existe en Storage: ${filePath}`);
        } else {
          console.log(`  ✅ Existe en Storage: ${filePath} (${fileData.size} bytes)`);
        }
      }
      console.log('');
    }
    
    // Buscar en todos los directorios de Storage por nombre similar
    console.log(`\n🔍 Buscando archivo en Storage por nombre...\n`);
    
    const { data: folders } = await supabase.storage
      .from('lesson-resources')
      .list('', { limit: 1000 });
    
    if (folders) {
      for (const folder of folders) {
        if (folder.id === null) continue;
        
        const { data: files } = await supabase.storage
          .from('lesson-resources')
          .list(folder.name, { limit: 100 });
        
        if (files) {
          const matching = files.find(f => 
            f.name.toLowerCase().includes('desactivar') ||
            f.name.toLowerCase().includes('8.1')
          );
          
          if (matching) {
            console.log(`✅ Archivo encontrado en Storage:`);
            console.log(`   - Carpeta: ${folder.name}`);
            console.log(`   - Nombre: ${matching.name}`);
            console.log(`   - Tamaño: ${(matching.metadata?.size || 0).toLocaleString()} bytes`);
            console.log(`   - Ruta: lesson-resources/${folder.name}/${matching.name}`);
            
            // Verificar si algún recurso en BD apunta a esta carpeta
            const matchingResource = result.rows.find(r => {
              const match = r.file_url.match(/lesson-resources\/([^\/]+)\//);
              return match && match[1] === folder.name;
            });
            
            if (!matchingResource) {
              console.log(`   ⚠️  Ningún recurso en BD apunta a esta carpeta`);
            } else {
              console.log(`   ✅ Recurso en BD: ${matchingResource.id}`);
            }
          }
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

fixMissingResource();

