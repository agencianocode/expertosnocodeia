// Script de migración para restaurar imágenes al Object Storage
// Migra todas las imágenes desde attached_assets/ al Object Storage de Replit

import { ObjectStorageService, objectStorageClient } from '../server/objectStorage';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as mime from 'mime-types';

const PUBLIC_BUCKET_ID = 'replit-objstore-94ddb783-0633-4b25-9219-1d299fa82923';
const PUBLIC_DIR = 'public';

async function getAllImageFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = await fs.stat(fullPath);
    
    if (stat.isFile() && isImageFile(item)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
}

async function uploadFileToStorage(filePath: string): Promise<void> {
  try {
    const fileName = filePath.split('/').pop() || '';
    console.log(`📤 Subiendo: ${fileName}`);
    
    // Leer el archivo
    const fileBuffer = await fs.readFile(filePath);
    
    // Determinar el tipo MIME
    const mimeType = mime.lookup(filePath) || 'image/png';
    
    // Crear referencia al bucket y archivo
    const bucket = objectStorageClient.bucket(PUBLIC_BUCKET_ID);
    const file = bucket.file(`${PUBLIC_DIR}/${fileName}`);
    
    // Subir el archivo
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
      },
    });
    
    console.log(`✅ Subido exitosamente: ${fileName}`);
  } catch (error) {
    console.error(`❌ Error subiendo ${filePath}:`, error);
  }
}

async function migrateImages() {
  console.log('🚀 Iniciando migración de imágenes a Object Storage...');
  
  try {
    // Obtener todas las imágenes desde attached_assets (ruta desde el directorio raíz)
    const imageFiles = await getAllImageFiles('../attached_assets');
    console.log(`📊 Encontradas ${imageFiles.length} imágenes para migrar`);
    
    // Verificar conectividad con Object Storage
    const bucket = objectStorageClient.bucket(PUBLIC_BUCKET_ID);
    const [exists] = await bucket.exists();
    
    if (!exists) {
      throw new Error(`Bucket ${PUBLIC_BUCKET_ID} no existe`);
    }
    
    console.log(`🔗 Conectado al bucket: ${PUBLIC_BUCKET_ID}`);
    
    // Migrar archivos de a 5 por vez para evitar saturar la conexión
    const batchSize = 5;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      console.log(`\n📦 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}`);
      
      await Promise.all(batch.map(uploadFileToStorage));
      
      // Pausa pequeña entre lotes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Migración completada exitosamente!');
    console.log(`📈 Total de imágenes migradas: ${imageFiles.length}`);
    
  } catch (error) {
    console.error('💥 Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateImages().then(() => {
  console.log('🏁 Proceso finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});