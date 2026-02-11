/**
 * Script para buscar un archivo específico en Supabase Storage
 * 
 * Busca recursivamente en todos los directorios
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

async function findFile(fileName: string) {
  try {
    console.log(`🔍 Buscando archivo: ${fileName}\n`);
    
    // Listar todos los directorios
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
    
    console.log(`📁 Buscando en ${folders.length} carpetas...\n`);
    
    let found = false;
    
    for (const folder of folders) {
      if (folder.id === null) continue; // Skip files in root
      
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from('lesson-resources')
          .list(folder.name, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (filesError) continue;
        
        if (files && files.length > 0) {
          const matchingFile = files.find(f => 
            f.name.toLowerCase().includes(fileName.toLowerCase()) ||
            fileName.toLowerCase().includes(f.name.toLowerCase().replace(/\.[^/.]+$/, ''))
          );
          
          if (matchingFile) {
            console.log(`✅ Archivo encontrado:`);
            console.log(`   - Carpeta: ${folder.name}`);
            console.log(`   - Nombre: ${matchingFile.name}`);
            console.log(`   - Tamaño: ${(matchingFile.metadata?.size || 0).toLocaleString()} bytes`);
            console.log(`   - Ruta completa: lesson-resources/${folder.name}/${matchingFile.name}`);
            found = true;
          }
        }
      } catch (error) {
        // Continuar con siguiente carpeta
      }
    }
    
    if (!found) {
      console.log(`❌ Archivo no encontrado en Supabase Storage`);
      console.log(`\n💡 El archivo puede estar:`);
      console.log(`   1. En local pero no migrado`);
      console.log(`   2. Con un nombre diferente`);
      console.log(`   3. En otro bucket`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const fileName = process.argv[2] || '8.1_Plantilla_Maestra_Z_API_Desactivar';
findFile(fileName);

