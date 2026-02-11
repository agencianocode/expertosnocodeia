/**
 * Script para migrar archivos de lesson-resources desde local a Supabase Storage
 * 
 * Busca archivos en attached_assets/private/lesson-resources y los sube a Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LESSON_RESOURCES_DIR = path.join(__dirname, "..", "attached_assets", "private", "lesson-resources");

async function getAllFiles(dir: string): Promise<Array<{ resourceId: string; fileName: string; fullPath: string }>> {
  const files: Array<{ resourceId: string; fileName: string; fullPath: string }> = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Es un resourceId, buscar archivos dentro
        const resourceId = entry.name;
        try {
          const fileEntries = await fs.readdir(fullPath, { withFileTypes: true });
          for (const fileEntry of fileEntries) {
            if (fileEntry.isFile()) {
              files.push({
                resourceId,
                fileName: fileEntry.name,
                fullPath: path.join(fullPath, fileEntry.name)
              });
            }
          }
        } catch (error) {
          // Ignorar errores de lectura
        }
      }
    }
  } catch (error) {
    // Directorio no existe o no se puede leer
  }
  
  return files;
}

async function migrateLessonResources() {
  try {
    console.log('🔄 Migrando archivos de lesson-resources a Supabase Storage...\n');
    
    // Verificar si el directorio existe
    try {
      await fs.access(LESSON_RESOURCES_DIR);
    } catch {
      console.log('ℹ️  Directorio lesson-resources no existe en local');
      return;
    }
    
    const files = await getAllFiles(LESSON_RESOURCES_DIR);
    console.log(`📁 Encontrados ${files.length} archivos para migrar\n`);
    
    if (files.length === 0) {
      console.log('ℹ️  No hay archivos para migrar');
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const file of files) {
      try {
        // Verificar si ya existe en Supabase
        const storagePath = `${file.resourceId}/${file.fileName}`;
        const { data: existingFile, error: checkError } = await supabase.storage
          .from('lesson-resources')
          .download(storagePath);
        
        if (!checkError && existingFile) {
          console.log(`⏭️  Ya existe: ${storagePath}`);
          skipped++;
          continue;
        }
        
        // Leer archivo local
        const fileBuffer = await fs.readFile(file.fullPath);
        
        // Determinar content type
        const ext = path.extname(file.fileName).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.json': 'application/json',
          '.txt': 'text/plain',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lesson-resources')
          .upload(storagePath, fileBuffer, {
            contentType,
            upsert: true
          });
        
        if (uploadError) {
          console.error(`❌ Error subiendo ${storagePath}:`, uploadError.message);
          errors++;
        } else {
          console.log(`✅ Subido: ${storagePath} (${fileBuffer.length.toLocaleString()} bytes)`);
          migrated++;
        }
      } catch (error: any) {
        console.error(`❌ Error procesando ${file.fullPath}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`✅ Migrados: ${migrated}`);
    console.log(`⏭️  Omitidos (ya existen): ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`\n✅ ¡Proceso completado!`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrateLessonResources();

