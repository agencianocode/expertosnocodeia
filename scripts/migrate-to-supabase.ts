/**
 * Script de Migración Completa a Supabase
 * 
 * Este script migra:
 * 1. Archivos locales (attached_assets) a Supabase Storage
 * 2. Actualiza URLs en la base de datos
 * 
 * Uso:
 * 1. Configurar variables de entorno en .env
 * 2. Ejecutar: npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL debe estar configurado en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const ATTACHED_ASSETS_DIR = path.join(__dirname, "..", "attached_assets");

// Buckets a crear
const BUCKETS = [
  { name: 'lesson-resources', public: true },
  { name: 'post-images', public: true },
  { name: 'attached-assets', public: true },
  { name: 'profile-images', public: true },
];

/**
 * Crea los buckets necesarios en Supabase Storage
 */
async function createBuckets() {
  console.log('📦 Creando buckets en Supabase Storage...\n');
  
  for (const bucket of BUCKETS) {
    try {
      // Verificar si el bucket ya existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === bucket.name);
      
      if (exists) {
        console.log(`ℹ️  Bucket "${bucket.name}" ya existe, omitiendo...`);
        continue;
      }

      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: bucket.public ? null : ['image/*', 'video/*', 'application/pdf', 'application/zip'],
      });
      
      if (error) {
        console.error(`❌ Error creando bucket ${bucket.name}:`, error.message);
      } else {
        console.log(`✅ Bucket "${bucket.name}" creado exitosamente`);
      }
    } catch (error: any) {
      console.error(`❌ Error con bucket ${bucket.name}:`, error.message);
    }
  }
  
  console.log('');
}

/**
 * Obtiene el tipo MIME de un archivo
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Obtiene todos los archivos recursivamente de un directorio
 */
async function getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
  } catch (error) {
    // Ignorar errores de directorios que no existen
  }
  
  return fileList;
}

/**
 * Migra archivos locales a Supabase Storage
 */
async function migrateFiles() {
  console.log('📤 Migrando archivos a Supabase Storage...\n');
  
  // Verificar si el directorio existe
  try {
    await fs.access(ATTACHED_ASSETS_DIR);
  } catch {
    console.log('ℹ️  Directorio attached_assets no existe, omitiendo migración de archivos...\n');
    return;
  }

  const allFiles = await getAllFiles(ATTACHED_ASSETS_DIR);
  console.log(`📁 Encontrados ${allFiles.length} archivos para migrar\n`);

  if (allFiles.length === 0) {
    console.log('ℹ️  No hay archivos para migrar\n');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const urlMappings: Array<{ oldPath: string; newUrl: string }> = [];

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const progress = `[${i + 1}/${allFiles.length}]`;
    
    try {
      // Obtener ruta relativa desde attached_assets
      const relativePath = path.relative(ATTACHED_ASSETS_DIR, filePath);
      const pathParts = relativePath.split(path.sep);
      
      // Determinar bucket según la estructura
      let bucketName = 'attached-assets';
      let storagePath = relativePath.replace(/\\/g, '/');
      
      if (pathParts[0] === 'public') {
        bucketName = 'attached-assets';
        storagePath = pathParts.slice(1).join('/');
      } else if (pathParts.includes('post-images')) {
        bucketName = 'post-images';
        const postImagesIndex = pathParts.indexOf('post-images');
        storagePath = pathParts.slice(postImagesIndex + 1).join('/');
      } else if (pathParts.includes('lesson-resources')) {
        bucketName = 'lesson-resources';
        const lessonIndex = pathParts.indexOf('lesson-resources');
        storagePath = pathParts.slice(lessonIndex + 1).join('/');
      } else if (pathParts.includes('profile') || pathParts.includes('profiles')) {
        bucketName = 'profile-images';
        const profileIndex = pathParts.findIndex(p => p.includes('profile'));
        storagePath = pathParts.slice(profileIndex + 1).join('/');
      }

      // Leer archivo
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const mimeType = getMimeType(fileName);
      
      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true, // Sobrescribir si existe
        });

      if (error) {
        console.error(`${progress} ❌ Error subiendo ${fileName}:`, error.message);
        errorCount++;
      } else {
        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storagePath);
        
        const publicUrl = urlData.publicUrl;
        urlMappings.push({
          oldPath: `/attached_assets/${relativePath.replace(/\\/g, '/')}`,
          newUrl: publicUrl,
        });
        
        console.log(`${progress} ✅ ${bucketName}/${storagePath}`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`${progress} ❌ Error procesando ${filePath}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Resumen de migración de archivos:`);
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📝 Mapeos de URLs: ${urlMappings.length}\n`);

  return urlMappings;
}

/**
 * Actualiza URLs en la base de datos
 */
async function updateFileUrls(urlMappings: Array<{ oldPath: string; newUrl: string }>) {
  if (urlMappings.length === 0) {
    console.log('ℹ️  No hay URLs para actualizar\n');
    return;
  }

  console.log('🔄 Actualizando URLs en la base de datos...\n');
  
  const pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined
  });
  
  try {
    let updatedCount = 0;

    // Actualizar URLs de media_files
    console.log('📝 Actualizando tabla media_files...');
    for (const mapping of urlMappings) {
      try {
        const result = await pool.query(
          `UPDATE media_files 
           SET url = $1, updated_at = NOW()
           WHERE url LIKE $2 OR url = $3`,
          [mapping.newUrl, `%${mapping.oldPath}%`, mapping.oldPath]
        );
        if (result.rowCount && result.rowCount > 0) {
          updatedCount += result.rowCount;
        }
      } catch (error: any) {
        console.error(`  ⚠️  Error actualizando ${mapping.oldPath}:`, error.message);
      }
    }

    // Actualizar URLs de lesson_resources
    console.log('📝 Actualizando tabla lesson_resources...');
    for (const mapping of urlMappings) {
      try {
        const result = await pool.query(
          `UPDATE lesson_resources 
           SET file_url = $1, updated_at = NOW()
           WHERE file_url LIKE $2 OR file_url = $3`,
          [mapping.newUrl, `%${mapping.oldPath}%`, mapping.oldPath]
        );
        if (result.rowCount && result.rowCount > 0) {
          updatedCount += result.rowCount;
        }
      } catch (error: any) {
        // Ignorar si la tabla no existe
      }
    }

    // Actualizar URLs de community_posts (imageUrl)
    console.log('📝 Actualizando tabla community_posts...');
    for (const mapping of urlMappings) {
      try {
        const result = await pool.query(
          `UPDATE community_posts 
           SET image_url = $1, updated_at = NOW()
           WHERE image_url LIKE $2 OR image_url = $3`,
          [mapping.newUrl, `%${mapping.oldPath}%`, mapping.oldPath]
        );
        if (result.rowCount && result.rowCount > 0) {
          updatedCount += result.rowCount;
        }
      } catch (error: any) {
        console.error(`  ⚠️  Error actualizando posts:`, error.message);
      }
    }

    // Actualizar URLs de users (profileImageUrl)
    console.log('📝 Actualizando tabla users...');
    for (const mapping of urlMappings) {
      try {
        const result = await pool.query(
          `UPDATE users 
           SET profile_image_url = $1, updated_at = NOW()
           WHERE profile_image_url LIKE $2 OR profile_image_url = $3`,
          [mapping.newUrl, `%${mapping.oldPath}%`, mapping.oldPath]
        );
        if (result.rowCount && result.rowCount > 0) {
          updatedCount += result.rowCount;
        }
      } catch (error: any) {
        // Ignorar errores
      }
    }

    // Actualizar URLs genéricas (cualquier campo que contenga /attached_assets/)
    console.log('📝 Actualizando URLs genéricas...');
    const genericUpdate = await pool.query(
      `UPDATE media_files 
       SET url = REPLACE(url, '/attached_assets/', '${SUPABASE_URL}/storage/v1/object/public/attached-assets/'),
           updated_at = NOW()
       WHERE url LIKE '%/attached_assets/%'`
    );
    if (genericUpdate.rowCount) {
      updatedCount += genericUpdate.rowCount;
    }

    console.log(`\n✅ Total de registros actualizados: ${updatedCount}\n`);
  } catch (error: any) {
    console.error('❌ Error actualizando URLs:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando migración completa a Supabase...\n');
  console.log('=' .repeat(60));
  console.log('');
  
  try {
    // 1. Crear buckets
    await createBuckets();
    
    // 2. Migrar archivos
    const urlMappings = await migrateFiles();
    
    // 3. Actualizar URLs en BD
    if (urlMappings && urlMappings.length > 0) {
      await updateFileUrls(urlMappings);
    }
    
    console.log('=' .repeat(60));
    console.log('✅ Migración completada exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Actualizar DATABASE_URL en .env con la connection string de Supabase');
    console.log('2. Reiniciar el servidor');
    console.log('3. Verificar que todo funciona correctamente');
    console.log('');
  } catch (error: any) {
    console.error('\n❌ Error en migración:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar migración
main();

