/**
 * Script para listar todos los archivos en Supabase Storage
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listAllFiles() {
  try {
    console.log('📦 Listando todos los archivos en lesson-resources...\n');
    
    // Listar todos los directorios (resourceIds)
    const { data: folders, error: foldersError } = await supabase.storage
      .from('lesson-resources')
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (foldersError) {
      console.error('❌ Error listando carpetas:', foldersError.message);
      return;
    }
    
    if (!folders || folders.length === 0) {
      console.log('❌ No hay carpetas en lesson-resources');
      return;
    }
    
    console.log(`✅ Encontradas ${folders.length} carpetas\n`);
    
    let totalFiles = 0;
    
    for (const folder of folders) {
      // Verificar si es carpeta (tiene id) o archivo
      if (folder.id === null) {
        // Es un archivo en la raíz
        console.log(`📄 ${folder.name} (${(folder.metadata?.size || 0).toLocaleString()} bytes)`);
        totalFiles++;
      } else {
        // Es una carpeta
        const { data: files, error: filesError } = await supabase.storage
          .from('lesson-resources')
          .list(folder.name, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (filesError) {
          console.log(`⚠️ Error listando ${folder.name}: ${filesError.message}`);
          continue;
        }
        
        if (files && files.length > 0) {
          console.log(`📁 ${folder.name} (${files.length} archivos):`);
          files.forEach(file => {
            const size = file.metadata?.size || file.metadata?.size || 0;
            console.log(`   - ${file.name} (${size.toLocaleString()} bytes)`);
            totalFiles++;
          });
          console.log('');
        } else {
          // Carpeta vacía
          console.log(`📁 ${folder.name} (vacía)`);
        }
      }
    }
    
    console.log(`\n📊 Total de archivos: ${totalFiles}`);
    
    // Buscar específicamente el archivo que falta
    console.log(`\n🔍 Buscando archivo específico: 8.1_Plantilla_Maestra_Z_API_Desactivar.json\n`);
    
    for (const folder of folders) {
      if (folder.id) {
        const { data: files } = await supabase.storage
          .from('lesson-resources')
          .list(folder.name, { limit: 100 });
        
        if (files) {
          const matchingFile = files.find(f => 
            f.name.includes('8.1_Plantilla_Maestra_Z_API_Desactivar') ||
            f.name.includes('Desactivar')
          );
          
          if (matchingFile) {
            console.log(`✅ Encontrado en carpeta ${folder.name}:`);
            console.log(`   - ${matchingFile.name}`);
            console.log(`   - Tamaño: ${(matchingFile.metadata?.size || 0).toLocaleString()} bytes`);
          }
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllFiles();

