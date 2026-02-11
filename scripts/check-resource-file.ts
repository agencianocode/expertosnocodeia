/**
 * Script para verificar archivos de recursos en Supabase
 * 
 * Verifica qué archivos existen en Storage y qué dice la base de datos
 * 
 * Uso: npx tsx scripts/check-resource-file.ts <resourceId>
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

async function checkResource(resourceId: string) {
  try {
    console.log(`\n🔍 Verificando recurso: ${resourceId}\n`);
    
    // 1. Consultar base de datos
    console.log('📊 Consultando base de datos...');
    const dbResult = await pool.query(
      `SELECT id, file_name, file_url, title FROM lesson_resources WHERE id = $1`,
      [resourceId]
    );
    
    if (dbResult.rows.length === 0) {
      console.log(`❌ No se encontró el recurso en la base de datos`);
      return;
    }
    
    const resource = dbResult.rows[0];
    console.log(`✅ Recurso encontrado en BD:`);
    console.log(`   - ID: ${resource.id}`);
    console.log(`   - Título: ${resource.title}`);
    console.log(`   - Nombre archivo (BD): ${resource.file_name}`);
    console.log(`   - URL archivo (BD): ${resource.file_url}`);
    
    // 2. Listar archivos en Supabase Storage
    console.log(`\n📦 Listando archivos en Supabase Storage...`);
    const { data: files, error: listError } = await supabase.storage
      .from('lesson-resources')
      .list(resourceId, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (listError) {
      console.error(`❌ Error listando archivos:`, listError.message);
      return;
    }
    
    if (!files || files.length === 0) {
      console.log(`❌ No hay archivos en el directorio ${resourceId} en Supabase Storage`);
      console.log(`\n💡 Posibles causas:`);
      console.log(`   1. El archivo no se migró a Supabase Storage`);
      console.log(`   2. El resourceId en la BD no coincide con el directorio en Storage`);
      console.log(`   3. El archivo está en otro bucket o ubicación`);
      return;
    }
    
    console.log(`✅ Archivos encontrados en Storage (${files.length}):`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${(file.metadata?.size || 0).toLocaleString()} bytes)`);
    });
    
    // 3. Verificar si el nombre coincide
    console.log(`\n🔍 Comparando nombres...`);
    const dbFileName = resource.file_name;
    const matchingFile = files.find(f => 
      f.name === dbFileName || 
      f.name.toLowerCase() === dbFileName.toLowerCase() ||
      f.name.replace(/\.[^/.]+$/, '') === dbFileName.replace(/\.[^/.]+$/, '')
    );
    
    if (matchingFile) {
      console.log(`✅ Archivo encontrado: ${matchingFile.name}`);
      console.log(`   - Tamaño: ${(matchingFile.metadata?.size || 0).toLocaleString()} bytes`);
      console.log(`   - Última modificación: ${matchingFile.updated_at || 'N/A'}`);
    } else {
      console.log(`❌ No se encontró un archivo que coincida con "${dbFileName}"`);
      console.log(`\n💡 Archivos disponibles:`);
      files.forEach(f => console.log(`   - ${f.name}`));
    }
    
    // 4. Intentar descargar el archivo
    if (matchingFile) {
      console.log(`\n📥 Intentando descargar archivo...`);
      const filePath = `${resourceId}/${matchingFile.name}`;
      const { data, error: downloadError } = await supabase.storage
        .from('lesson-resources')
        .download(filePath);
      
      if (downloadError) {
        console.error(`❌ Error descargando:`, downloadError.message);
      } else {
        console.log(`✅ Archivo descargado exitosamente (${data.size} bytes)`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Obtener resourceId del argumento o usar el del error
const resourceId = process.argv[2] || 'e217a726-500e-4843-b65f-f7ab7250883b';

checkResource(resourceId);

