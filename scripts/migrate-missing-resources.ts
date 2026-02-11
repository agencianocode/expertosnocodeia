/**
 * Script para migrar archivos de recursos que faltan en Supabase Storage
 * 
 * Busca archivos en local y los migra a Supabase Storage con el resourceId correcto
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ATTACHED_ASSETS_DIR = path.join(__dirname, "..", "attached_assets");

const isSupabase = DATABASE_URL.includes('supabase');
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

async function migrateMissingResources() {
  try {
    console.log('🔄 Buscando recursos que faltan en Supabase Storage...\n');
    
    // Obtener todos los recursos
    const result = await pool.query(
      `SELECT id, file_name, file_url FROM lesson_resources`
    );
    
    console.log(`📊 Total de recursos: ${result.rows.length}\n`);
    
    let migrated = 0;
    let notFound = 0;
    let errors = 0;
    
    for (const resource of result.rows) {
      // Extraer resourceId de la URL
      const urlMatch = resource.file_url.match(/lesson-resources\/([^\/]+)\/(.+)$/);
      
      if (!urlMatch) {
        console.log(`⚠️ URL inválida para recurso ${resource.id}: ${resource.file_url}`);
        continue;
      }
      
      const [, resourceId, fileName] = urlMatch;
      
      // Verificar si el archivo existe en Supabase Storage
      const filePath = `${resourceId}/${resource.file_name}`;
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('lesson-resources')
        .download(filePath);
      
      if (!downloadError && fileData) {
        console.log(`✅ Archivo ya existe: ${filePath}`);
        continue;
      }
      
      console.log(`\n🔍 Archivo no encontrado: ${filePath}`);
      console.log(`   Buscando en local...`);
      
      // Buscar en local con diferentes resourceIds
      const possiblePaths = [
        `private/lesson-resources/${resourceId}/${resource.file_name}`,
        `private/lesson-resources/${resourceId}/${fileName}`,
        `private/lesson-resources/${resource.id}/${resource.file_name}`,
        `lesson-resources/${resourceId}/${resource.file_name}`,
        `lesson-resources/${resourceId}/${fileName}`,
        `lesson-resources/${resource.id}/${resource.file_name}`,
      ];
      
      let localFile: Buffer | null = null;
      let foundPath: string | null = null;
      
      for (const localPath of possiblePaths) {
        try {
          const fullPath = path.join(ATTACHED_ASSETS_DIR, localPath);
          await fs.access(fullPath);
          localFile = await fs.readFile(fullPath);
          foundPath = localPath;
          console.log(`   ✅ Encontrado en: ${localPath}`);
          break;
        } catch {
          // Continuar buscando
        }
      }
      
      if (!localFile) {
        console.log(`   ❌ No encontrado en local`);
        notFound++;
        continue;
      }
      
      // Subir a Supabase Storage con el resourceId correcto
      try {
        const storagePath = `${resource.id}/${resource.file_name}`;
        const { error: uploadError } = await supabase.storage
          .from('lesson-resources')
          .upload(storagePath, localFile, {
            contentType: 'application/octet-stream',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`   ❌ Error subiendo: ${uploadError.message}`);
          errors++;
        } else {
          console.log(`   ✅ Subido a: ${storagePath}`);
          migrated++;
        }
      } catch (uploadError: any) {
        console.error(`   ❌ Error: ${uploadError.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`✅ Migrados: ${migrated}`);
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

migrateMissingResources();

