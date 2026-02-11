#!/usr/bin/env node
/**
 * Script para sincronizar los IDs de usuarios entre Supabase Auth y la tabla users
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users, adminUsers } from '../shared/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncIds() {
  try {
    console.log('\n🔄 SINCRONIZANDO IDS ENTRE SUPABASE AUTH Y DATABASE\n');
    console.log('═'.repeat(70));
    
    // 1. Obtener todos los usuarios de Supabase Auth
    console.log('\n1️⃣ Obteniendo usuarios de Supabase Auth...');
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
      process.exit(1);
    }
    
    console.log(`✅ Encontrados ${authUsers.length} usuarios en Supabase Auth`);
    
    // 2. Para cada usuario de Auth, verificar y sincronizar con la tabla users
    console.log('\n2️⃣ Sincronizando IDs...\n');
    
    let synced = 0;
    let created = 0;
    let skipped = 0;
    
    for (const authUser of authUsers) {
      const email = authUser.email;
      const authId = authUser.id;
      
      if (!email) {
        console.log(`⚠️  Usuario ${authId} sin email, saltando...`);
        skipped++;
        continue;
      }
      
      // Buscar usuario en la tabla por email
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!dbUser) {
        // Usuario no existe en la tabla, crearlo con el ID de Auth
        console.log(`➕ Creando usuario: ${email} con ID: ${authId}`);
        await db.insert(users).values({
          id: authId,
          email: email,
          firstName: authUser.user_metadata?.first_name || '',
          lastName: authUser.user_metadata?.last_name || '',
          profileImageUrl: authUser.user_metadata?.avatar_url || '',
          provider: 'supabase',
          isEmailVerified: !!authUser.email_confirmed_at,
          role: 'user',
        });
        created++;
      } else if (dbUser.id !== authId) {
        // Usuario existe pero con ID diferente - actualizar
        console.log(`🔄 Sincronizando: ${email}`);
        console.log(`   ID antiguo: ${dbUser.id}`);
        console.log(`   ID nuevo (Auth): ${authId}`);
        
        // Guardar datos del adminUser si existe
        const [adminUser] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.userId, dbUser.id));
        
        let adminData = null;
        if (adminUser) {
          console.log(`   📋 Guardando datos de admin...`);
          adminData = {
            role: adminUser.role,
            permissions: adminUser.permissions,
            isActive: adminUser.isActive,
          };
          
          // Eliminar el registro de adminUsers temporalmente
          await db
            .delete(adminUsers)
            .where(eq(adminUsers.userId, dbUser.id));
        }
        
        // Ahora actualizar el ID del usuario
        console.log(`   🔄 Actualizando ID en users...`);
        await db
          .update(users)
          .set({ id: authId })
          .where(eq(users.email, email));
        
        // Recrear el registro de adminUsers con el nuevo ID
        if (adminData) {
          console.log(`   📋 Recreando registro en adminUsers con nuevo ID...`);
          await db.insert(adminUsers).values({
            userId: authId,
            ...adminData,
          });
        }
        
        console.log(`   ✅ ID sincronizado correctamente`);
        synced++;
      } else {
        // IDs ya coinciden
        skipped++;
      }
    }
    
    console.log('\n═'.repeat(70));
    console.log('\n✅ SINCRONIZACIÓN COMPLETADA\n');
    console.log(`   📊 Usuarios sincronizados: ${synced}`);
    console.log(`   ➕ Usuarios creados: ${created}`);
    console.log(`   ⏭️  Usuarios sin cambios: ${skipped}`);
    console.log(`   📝 Total procesados: ${authUsers.length}\n`);
    
    console.log('🎉 Ahora puedes hacer login sin problemas de IDs!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncIds();

