#!/usr/bin/env node
/**
 * Script para diagnosticar y arreglar el usuario admin
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

async function fixAdminUser() {
  const targetEmail = 'fabianseguraconsultor@gmail.com';
  
  try {
    console.log('\n🔍 DIAGNÓSTICO DEL PROBLEMA\n');
    console.log('═'.repeat(60));
    
    // 1. Buscar usuario en la base de datos local por email
    console.log(`\n1️⃣ Buscando usuario en DB local con email: ${targetEmail}...`);
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, targetEmail));
    
    if (!dbUser) {
      console.error(`❌ Usuario ${targetEmail} no encontrado en la base de datos local`);
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado en DB:`);
    console.log(`   Email: ${dbUser.email}`);
    console.log(`   ID: ${dbUser.id}`);
    console.log(`   Role: ${dbUser.role}`);
    
    const userId = dbUser.id;
    
    // 2. Verificar usuario en Supabase Auth
    console.log('\n2️⃣ Verificando usuario en Supabase Auth...');
    const { data: { users: supabaseUsers }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios de Supabase:', listError);
      process.exit(1);
    }
    
    let supabaseUser = supabaseUsers.find(u => u.email === targetEmail);
    
    if (!supabaseUser) {
      console.log(`⚠️  Usuario no encontrado en Supabase Auth, pero está en DB local`);
      console.log(`   Esto puede indicar que el usuario usa el sistema legacy`);
    } else {
      console.log(`✅ Usuario encontrado en Supabase:`);
      console.log(`   Email: ${supabaseUser.email}`);
      console.log(`   ID: ${supabaseUser.id}`);
      
      // Verificar si los IDs coinciden
      if (supabaseUser.id !== userId) {
        console.log(`⚠️  ADVERTENCIA: Los IDs no coinciden:`);
        console.log(`   ID en DB: ${userId}`);
        console.log(`   ID en Supabase: ${supabaseUser.id}`);
      }
    }
    
    // 3. Verificar usuario en tabla adminUsers con ID local
    console.log('\n3️⃣ Verificando usuario en tabla adminUsers con ID local...');
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.userId, userId));
    
    if (!adminUser) {
      console.log('⚠️  Usuario no encontrado en tabla adminUsers, creándolo...');
      const [newAdmin] = await db.insert(adminUsers).values({
        userId: userId,
        role: 'super_admin',
        permissions: ['*'],
        isActive: true,
      }).returning();
      console.log(`✅ Admin creado con rol: ${newAdmin.role}`);
    } else {
      console.log(`✅ Usuario encontrado en tabla adminUsers:`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.isActive}`);
      console.log(`   Permissions: ${JSON.stringify(adminUser.permissions)}`);
      
      if (!adminUser.isActive) {
        console.log('⚠️  Usuario inactivo, activándolo...');
        await db
          .update(adminUsers)
          .set({ isActive: true })
          .where(eq(adminUsers.userId, userId));
        console.log('✅ Usuario activado');
      }
    }
    
    // 4. Si hay un ID de Supabase diferente, agregar también ese registro
    if (supabaseUser && supabaseUser.id !== userId) {
      console.log('\n4️⃣ Verificando registro con ID de Supabase...');
      const [supabaseAdminUser] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.userId, supabaseUser.id));
      
      if (!supabaseAdminUser) {
        console.log('⚠️  Creando registro adicional con ID de Supabase...');
        const [newAdmin] = await db.insert(adminUsers).values({
          userId: supabaseUser.id,
          role: 'super_admin',
          permissions: ['*'],
          isActive: true,
        }).returning();
        console.log(`✅ Registro adicional creado para ID de Supabase: ${newAdmin.userId}`);
      } else {
        console.log(`✅ Registro con ID de Supabase ya existe`);
        
        if (!supabaseAdminUser.isActive) {
          console.log('⚠️  Registro inactivo, activándolo...');
          await db
            .update(adminUsers)
            .set({ isActive: true })
            .where(eq(adminUsers.userId, supabaseUser.id));
          console.log('✅ Registro activado');
        }
      }
    }
    
    console.log('\n═'.repeat(60));
    console.log('\n✅ ¡PROBLEMA RESUELTO!');
    console.log('\n📝 Ahora puedes:');
    console.log(`   1. Hacer login con: ${targetEmail}`);
    console.log(`   2. Contraseña: Admin123! (si se estableció antes)`);
    console.log(`   3. Acceder a todas las rutas de admin`);
    console.log(`\n⚠️  IMPORTANTE: Si sigue fallando, limpia el localStorage del navegador\n`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixAdminUser();

