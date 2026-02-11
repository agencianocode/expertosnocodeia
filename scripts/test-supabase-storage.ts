#!/usr/bin/env node
/**
 * Script para probar Supabase Storage
 * Verifica que los buckets y políticas están configurados correctamente
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testBuckets = ['attached-assets', 'lesson-resources', 'post-images', 'profile-images'];

async function testBucketAccess(bucketName: string) {
  console.log(`\n🧪 Probando bucket: ${bucketName}`);
  
  try {
    // 1. Verificar que el bucket existe
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
    
    if (bucketError) {
      console.error(`   ❌ Error obteniendo bucket: ${bucketError.message}`);
      return false;
    }
    
    console.log(`   ✅ Bucket existe`);
    console.log(`      - Público: ${bucket.public ? 'Sí' : 'No'}`);
    console.log(`      - ID: ${bucket.id}`);
    
    // 2. Intentar listar archivos
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 5 });
    
    if (listError) {
      console.error(`   ❌ Error listando archivos: ${listError.message}`);
      return false;
    }
    
    console.log(`   ✅ Puede listar archivos (${files?.length || 0} encontrados)`);
    
    if (files && files.length > 0) {
      console.log(`   📁 Primeros archivos:`);
      files.slice(0, 3).forEach(file => {
        const size = file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(2)} KB` : 'N/A';
        console.log(`      - ${file.name} (${size})`);
      });
    }
    
    // 3. Crear archivo de prueba
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent);
    
    console.log(`   🔄 Intentando subir archivo de prueba: ${testFileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testBuffer, {
        contentType: 'text/plain',
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`   ❌ Error subiendo archivo: ${uploadError.message}`);
      return false;
    }
    
    console.log(`   ✅ Archivo subido exitosamente`);
    
    // 4. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName);
    
    console.log(`   ✅ URL pública generada:`);
    console.log(`      ${urlData.publicUrl}`);
    
    // 5. Descargar archivo de prueba
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(testFileName);
    
    if (downloadError) {
      console.error(`   ❌ Error descargando archivo: ${downloadError.message}`);
      return false;
    }
    
    const downloadedContent = await downloadData.text();
    if (downloadedContent === testContent) {
      console.log(`   ✅ Archivo descargado y verificado correctamente`);
    } else {
      console.error(`   ❌ El contenido descargado no coincide`);
      return false;
    }
    
    // 6. Eliminar archivo de prueba
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);
    
    if (deleteError) {
      console.error(`   ⚠️ No se pudo eliminar archivo de prueba: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Archivo de prueba eliminado`);
    }
    
    console.log(`   ✅ Todas las pruebas pasaron para ${bucketName}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function checkPolicies(bucketName: string) {
  console.log(`\n🔐 Verificando políticas para ${bucketName}...`);
  
  // Nota: No hay una API directa para listar políticas de storage en Supabase JS client
  // Las políticas deben verificarse en el Dashboard o mediante SQL
  
  console.log(`   ℹ️ Las políticas deben verificarse manualmente en:`);
  const projectId = supabaseUrl ? supabaseUrl.split('.')[0].split('//')[1] : 'your-project';
  console.log(`   https://supabase.com/dashboard/project/${projectId}/storage/policies`);
  console.log(`\n   Políticas requeridas:`);
  console.log(`   1. Public Read Access (SELECT para public)`);
  console.log(`   2. Authenticated Upload (INSERT para authenticated)`);
  console.log(`   3. Authenticated Update (UPDATE para authenticated)`);
  console.log(`   4. Authenticated Delete (DELETE para authenticated)`);
}

async function testExistingFiles() {
  console.log('\n🔍 Buscando archivos existentes en buckets...');
  
  for (const bucket of testBuckets) {
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    
    if (!error && files && files.length > 0) {
      console.log(`\n📦 ${bucket}: ${files.length} archivo(s)`);
      
      // Probar descargar el primer archivo
      const firstFile = files[0];
      console.log(`   🧪 Probando descarga de: ${firstFile.name}`);
      
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(firstFile.name);
      
      if (downloadError) {
        console.error(`   ❌ Error descargando: ${downloadError.message}`);
      } else {
        const size = downloadData.size;
        console.log(`   ✅ Descargado exitosamente (${(size / 1024).toFixed(2)} KB)`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de Supabase Storage...\n');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'N/A'}`);
  
  let passedTests = 0;
  let totalTests = testBuckets.length;
  
  // Probar cada bucket
  for (const bucket of testBuckets) {
    const passed = await testBucketAccess(bucket);
    if (passed) passedTests++;
    
    // Mostrar información sobre políticas
    await checkPolicies(bucket);
  }
  
  // Probar archivos existentes
  await testExistingFiles();
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! Supabase Storage está configurado correctamente.');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Verifica las políticas de acceso en el Dashboard de Supabase');
    console.log('   2. Migra archivos existentes si los hay: npm run migrate:storage');
    console.log('   3. Reinicia el servidor: npm run dev');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa los errores arriba.');
    console.log('\n🔧 Pasos para solucionar:');
    console.log('   1. Ejecuta: npm run setup:storage');
    console.log('   2. Configura las políticas de acceso (ver documentación)');
    console.log('   3. Vuelve a ejecutar este script');
  }
  
  console.log('\n📚 Documentación: docs/SUPABASE_STORAGE_SETUP.md\n');
}

main().catch(console.error);

