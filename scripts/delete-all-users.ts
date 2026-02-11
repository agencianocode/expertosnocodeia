#!/usr/bin/env node
/**
 * Script para borrar TODOS los usuarios de Supabase Auth y la base de datos
 * ⚠️ CUIDADO: Esta acción es IRREVERSIBLE
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users, adminUsers } from '../shared/schema';
import { sql } from 'drizzle-orm';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllUsers() {
  try {
    console.log('\n⚠️  BORRAR TODOS LOS USUARIOS ⚠️\n');
    console.log('═'.repeat(70));
    console.log('\n🚨 Esta acción borrará TODOS los usuarios de:');
    console.log('   - Supabase Auth');
    console.log('   - Tabla users');
    console.log('   - Tabla admin_users');
    console.log('\n⚠️  ESTA ACCIÓN ES IRREVERSIBLE\n');
    console.log('═'.repeat(70));
    
    // 1. Obtener todos los usuarios de Supabase Auth
    console.log('\n1️⃣ Obteniendo usuarios de Supabase Auth...');
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
      process.exit(1);
    }
    
    console.log(`✅ Encontrados ${authUsers.length} usuarios en Supabase Auth`);
    
    if (authUsers.length === 0) {
      console.log('\n✅ No hay usuarios para borrar en Supabase Auth');
    } else {
      // 2. Borrar usuarios de Supabase Auth
      console.log('\n2️⃣ Borrando usuarios de Supabase Auth...\n');
      
      let deletedAuth = 0;
      let failedAuth = 0;
      
      for (const authUser of authUsers) {
        try {
          console.log(`   🗑️  Borrando: ${authUser.email} (${authUser.id})`);
          const { error } = await supabase.auth.admin.deleteUser(authUser.id);
          
          if (error) {
            console.error(`   ❌ Error: ${error.message}`);
            failedAuth++;
          } else {
            console.log(`   ✅ Borrado de Auth`);
            deletedAuth++;
          }
        } catch (err: any) {
          console.error(`   ❌ Error: ${err.message}`);
          failedAuth++;
        }
      }
      
      console.log(`\n   📊 Borrados de Auth: ${deletedAuth}`);
      console.log(`   ❌ Fallidos: ${failedAuth}`);
    }
    
    // 3. Borrar registros relacionados (en orden de dependencias)
    console.log('\n3️⃣ Borrando registros relacionados...');
    
    // Borrar en orden: primero las tablas que dependen de users
    const tablesToClear = [
      'user_lesson_progress',
      'user_progress',
      'user_recent_activity',
      'user_saved_courses',
      'user_saved_guides',
      'user_saved_workshops',
      'user_activity',
      'comments',
      'onboarding_responses',
      'user_subscriptions',
      'admin_users',
      'user_onboarding_responses'
    ];
    
    for (const table of tablesToClear) {
      try {
        const result = await db.execute(sql.raw(`DELETE FROM ${table}`));
        console.log(`   ✅ ${table}: ${result.rowCount || 0} registros borrados`);
      } catch (err: any) {
        // Ignorar si la tabla no existe
        if (!err.message.includes('does not exist')) {
          console.log(`   ⚠️  ${table}: ${err.message}`);
        }
      }
    }
    
    // 4. Borrar registros de users
    console.log('\n4️⃣ Borrando registros de users...');
    const usersResult = await db.execute(sql`DELETE FROM users`);
    console.log(`✅ ${usersResult.rowCount || 0} registros borrados de users`);
    
    console.log('\n═'.repeat(70));
    console.log('\n✅ TODOS LOS USUARIOS HAN SIDO BORRADOS\n');
    console.log('📝 Para crear un usuario admin nuevo, sigue estos pasos:\n');
    console.log('   1. Crea un usuario en Supabase Dashboard');
    console.log('   2. Ejecuta: npm run create:admin\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

deleteAllUsers();

