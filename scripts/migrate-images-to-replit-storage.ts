// Script de migración corregido para Replit Object Storage
// Usa URLs firmadas para subir imágenes desde attached_assets/

import { promises as fs } from 'fs';
import { join } from 'path';
import * as mime from 'mime-types';

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const PUBLIC_BUCKET_ID = 'replit-objstore-94ddb783-0633-4b25-9219-1d299fa82923';
const PUBLIC_DIR = 'public';

async function getSignedUploadURL(bucketName: string, objectName: string): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method: 'PUT',
    expires_at: new Date(Date.now() + 900 * 1000).toISOString(), // 15 minutos
  };
  
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

async function uploadFileToStorage(filePath: string): Promise<void> {
  try {
    const fileName = filePath.split('/').pop() || '';
    console.log(`📤 Subiendo: ${fileName}`);
    
    // Leer el archivo
    const fileBuffer = await fs.readFile(filePath);
    
    // Determinar el tipo MIME
    const mimeType = mime.lookup(filePath) || 'image/png';
    
    // Generar URL firmada
    const objectName = `${PUBLIC_DIR}/${fileName}`;
    const signedURL = await getSignedUploadURL(PUBLIC_BUCKET_ID, objectName);
    
    // Subir usando PUT con la URL firmada
    const uploadResponse = await fetch(signedURL, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
      },
      body: fileBuffer,
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`);
    }
    
    console.log(`✅ Subido exitosamente: ${fileName}`);
  } catch (error) {
    console.error(`❌ Error subiendo ${filePath}:`, error);
  }
}

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

async function migrateImages() {
  console.log('🚀 Iniciando migración de imágenes a Replit Object Storage...');
  
  try {
    // Obtener todas las imágenes desde attached_assets
    const imageFiles = await getAllImageFiles('../attached_assets');
    console.log(`📊 Encontradas ${imageFiles.length} imágenes para migrar`);
    
    // Migrar archivos de a 3 por vez para evitar saturar el sidecar
    const batchSize = 3;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      console.log(`\n📦 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}`);
      
      await Promise.all(batch.map(uploadFileToStorage));
      
      // Pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 2000));
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