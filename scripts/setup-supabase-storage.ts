#!/usr/bin/env node
/**
 * Script para configurar Supabase Storage
 * Este script crea los buckets necesarios y configura las políticas de acceso
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuración de buckets
const bucketsConfig = [
  {
    name: 'attached-assets',
    public: true,
    fileSizeLimit: 52428800, // 50 MB
    allowedMimeTypes: null, // Todos los tipos
  },
  {
    name: 'lesson-resources',
    public: true,
    fileSizeLimit: 52428800, // 50 MB
    allowedMimeTypes: null,
  },
  {
    name: 'post-images',
    public: true,
    fileSizeLimit: 10485760, // 10 MB
    allowedMimeTypes: ['image/*'],
  },
  {
    name: 'profile-images',
    public: true,
    fileSizeLimit: 5242880, // 5 MB
    allowedMimeTypes: ['image/*'],
  },
];

async function createBucket(config: typeof bucketsConfig[0]) {
  console.log(`\n📦 Configurando bucket: ${config.name}`);
  
  try {
    // Intentar obtener el bucket primero
    const { data: existingBucket, error: getError } = await supabase.storage.getBucket(config.name);
    
    if (existingBucket) {
      console.log(`✅ Bucket '${config.name}' ya existe`);
      
      // Actualizar configuración si es necesario
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket(
        config.name,
        {
          public: config.public,
          fileSizeLimit: config.fileSizeLimit,
          allowedMimeTypes: config.allowedMimeTypes,
        }
      );
      
      if (updateError) {
        console.warn(`⚠️ No se pudo actualizar bucket '${config.name}':`, updateError.message);
      } else {
        console.log(`✅ Bucket '${config.name}' actualizado correctamente`);
      }
    } else {
      // Crear el bucket
      const { data, error } = await supabase.storage.createBucket(config.name, {
        public: config.public,
        fileSizeLimit: config.fileSizeLimit,
        allowedMimeTypes: config.allowedMimeTypes,
      });
      
      if (error) {
        console.error(`❌ Error creando bucket '${config.name}':`, error.message);
        return false;
      }
      
      console.log(`✅ Bucket '${config.name}' creado exitosamente`);
    }
    
    return true;
  } catch (error: any) {
    console.error(`❌ Error procesando bucket '${config.name}':`, error.message);
    return false;
  }
}

async function createStoragePolicies() {
  console.log('\n🔐 Configurando políticas de acceso (RLS)...');
  console.log('⚠️ IMPORTANTE: Las políticas deben configurarse manualmente en el Dashboard de Supabase');
  console.log('\n📝 Instrucciones:');
  const projectId = supabaseUrl ? supabaseUrl.split('.')[0].split('//')[1] : 'your-project';
  console.log('1. Ve a: https://supabase.com/dashboard/project/' + projectId + '/storage/policies');
  console.log('2. Para cada bucket, crea las siguientes políticas:\n');
  
  bucketsConfig.forEach(bucket => {
    console.log(`\n📦 Bucket: ${bucket.name}`);
    console.log('   Política 1: "Public Read Access"');
    console.log('   - Operaciones: SELECT');
    console.log('   - Target roles: public');
    console.log('   - Policy definition: true');
    console.log('   - SQL: CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = \'' + bucket.name + '\');');
    
    console.log('\n   Política 2: "Authenticated Upload"');
    console.log('   - Operaciones: INSERT');
    console.log('   - Target roles: authenticated');
    console.log('   - Policy definition: true');
    console.log('   - SQL: CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = \'' + bucket.name + '\');');
    
    console.log('\n   Política 3: "Authenticated Update"');
    console.log('   - Operaciones: UPDATE');
    console.log('   - Target roles: authenticated');
    console.log('   - Policy definition: true');
    console.log('   - SQL: CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = \'' + bucket.name + '\');');
    
    console.log('\n   Política 4: "Authenticated Delete"');
    console.log('   - Operaciones: DELETE');
    console.log('   - Target roles: authenticated');
    console.log('   - Policy definition: true');
    console.log('   - SQL: CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = \'' + bucket.name + '\');');
  });
  
  console.log('\n\n💡 Alternativamente, puedes ejecutar estos comandos SQL directamente:');
  console.log('\n```sql');
  bucketsConfig.forEach(bucket => {
    console.log(`-- Políticas para ${bucket.name}`);
    console.log(`CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = '${bucket.name}');`);
    console.log(`CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${bucket.name}');`);
    console.log(`CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '${bucket.name}');`);
    console.log(`CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '${bucket.name}');`);
    console.log('');
  });
  console.log('```\n');
}

async function listBuckets() {
  console.log('\n📋 Listando buckets existentes...');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listando buckets:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No hay buckets creados');
      return;
    }
    
    console.log(`\n✅ Encontrados ${data.length} bucket(s):\n`);
    data.forEach(bucket => {
      console.log(`📦 ${bucket.name}`);
      console.log(`   - ID: ${bucket.id}`);
      console.log(`   - Público: ${bucket.public ? '✅ Sí' : '❌ No'}`);
      console.log(`   - Creado: ${new Date(bucket.created_at).toLocaleString()}`);
      console.log(`   - Actualizado: ${new Date(bucket.updated_at).toLocaleString()}`);
      console.log('');
    });
  } catch (error: any) {
    console.error('❌ Error listando buckets:', error.message);
  }
}

async function testStorageAccess() {
  console.log('\n🧪 Probando acceso a Storage...');
  
  for (const bucket of bucketsConfig) {
    try {
      console.log(`\n📦 Probando bucket: ${bucket.name}`);
      
      // Intentar listar archivos
      const { data, error } = await supabase.storage
        .from(bucket.name)
        .list('', {
          limit: 5,
        });
      
      if (error) {
        console.error(`   ❌ Error accediendo: ${error.message}`);
      } else {
        console.log(`   ✅ Acceso correcto`);
        if (data && data.length > 0) {
          console.log(`   📁 Archivos encontrados: ${data.length}`);
          data.slice(0, 3).forEach(file => {
            console.log(`      - ${file.name} (${(file.metadata?.size || 0) / 1024} KB)`);
          });
        } else {
          console.log(`   📁 Bucket vacío`);
        }
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando configuración de Supabase Storage...\n');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'N/A'}`);
  
  // Listar buckets existentes
  await listBuckets();
  
  // Crear/actualizar buckets
  console.log('\n📦 Creando/actualizando buckets...');
  let successCount = 0;
  for (const config of bucketsConfig) {
    const success = await createBucket(config);
    if (success) successCount++;
  }
  
  console.log(`\n✅ ${successCount}/${bucketsConfig.length} buckets configurados correctamente`);
  
  // Probar acceso
  await testStorageAccess();
  
  // Mostrar instrucciones para políticas
  await createStoragePolicies();
  
  console.log('\n✅ Configuración de Supabase Storage completada!');
  console.log('\n⚠️ IMPORTANTE: No olvides configurar las políticas de acceso (RLS) en el Dashboard de Supabase');
  console.log('   Ver instrucciones arriba ⬆️\n');
}

main().catch(console.error);

