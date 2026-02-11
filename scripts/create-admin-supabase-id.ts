#!/usr/bin/env node
/**
 * Script para crear registro de admin con ID de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { adminUsers } from '../shared/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminWithSupabaseId() {
  const email = 'fabianseguraconsultor@gmail.com';
  
  try {
    console.log(`\n🔐 Configurando admin para: ${email}\n`);
    
    // 1. Buscar usuario en Supabase Auth
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
      process.exit(1);
    }
    
    const authUser = authUsers.find(u => u.email === email);
    
    if (!authUser) {
      console.error(`❌ Usuario ${email} no encontrado en Supabase Auth`);
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado en Supabase Auth:`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   ID: ${authUser.id}`);
    
    // 2. Verificar si ya existe registro de admin con este ID
    const [existing] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.userId, authUser.id));
    
    if (existing) {
      console.log(`\n✅ Ya existe registro de admin con ID de Supabase`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Active: ${existing.isActive}`);
      
      if (!existing.isActive) {
        console.log(`\n🔄 Activando usuario...`);
        await db
          .update(adminUsers)
          .set({ isActive: true })
          .where(eq(adminUsers.userId, authUser.id));
        console.log(`✅ Usuario activado`);
      }
    } else {
      console.log(`\n➕ Creando nuevo registro de admin con ID de Supabase...`);
      await db.insert(adminUsers).values({
        userId: authUser.id,
        role: 'super_admin',
        permissions: ['*'],
        isActive: true,
      });
      console.log(`✅ Admin creado exitosamente`);
    }
    
    console.log('\n═'.repeat(70));
    console.log('\n✅ ¡CONFIGURACIÓN COMPLETADA!\n');
    console.log('📝 Ahora puedes hacer login con:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: Admin123!\n`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdminWithSupabaseId();

