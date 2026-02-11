#!/usr/bin/env node
/**
 * Script para arreglar el usuario actual que existe en Supabase pero no en la BD
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

async function fixCurrentUser() {
  const userId = '927aaacc-4b24-4de2-a996-6bd2a7c9ea6c';
  
  try {
    console.log(`\n🔧 ARREGLANDO USUARIO ACTUAL\n`);
    console.log('═'.repeat(70));
    
    // Get user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !user) {
      console.error('\n❌ Usuario no encontrado en Supabase Auth');
      console.error('   Este usuario no existe o fue eliminado');
      process.exit(1);
    }
    
    console.log(`\n✅ Usuario encontrado en Supabase Auth:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Verificado: ${!!user.email_confirmed_at}`);
    
    // Check if user exists in DB by ID
    const [existingUserById] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    // Check if user exists in DB by email
    const [existingUserByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!));
    
    if (existingUserById) {
      console.log(`\n✅ Usuario ya existe en la base de datos con el ID correcto`);
      console.log(`   Email: ${existingUserById.email}`);
      console.log(`   Nombre: ${existingUserById.firstName} ${existingUserById.lastName}`);
    } else if (existingUserByEmail) {
      console.log(`\n⚠️  Usuario existe pero con ID diferente:`);
      console.log(`   ID en BD: ${existingUserByEmail.id}`);
      console.log(`   ID en Supabase: ${userId}`);
      console.log(`\n🔄 Actualizando ID en la base de datos...`);
      
      // First, handle admin_users if exists
      const [existingAdmin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.userId, existingUserByEmail.id));
      
      if (existingAdmin) {
        console.log(`   📋 Migrando datos de admin...`);
        // Delete old admin record
        await db
          .delete(adminUsers)
          .where(eq(adminUsers.userId, existingUserByEmail.id));
        console.log(`   ✅ Datos de admin guardados`);
      }
      
      // Update user ID
      await db
        .update(users)
        .set({ 
          id: userId,
          provider: 'supabase',
          isEmailVerified: true
        })
        .where(eq(users.email, user.email!));
      
      console.log(`✅ ID actualizado exitosamente`);
      
      // Recreate admin if existed
      if (existingAdmin) {
        await db.insert(adminUsers).values({
          userId: userId,
          role: existingAdmin.role,
          permissions: existingAdmin.permissions,
          isActive: existingAdmin.isActive,
        });
        console.log(`   ✅ Datos de admin restaurados con nuevo ID`);
      }
    } else {
      console.log(`\n➕ Creando usuario en la base de datos...`);
      await db.insert(users).values({
        id: userId,
        email: user.email!,
        firstName: user.user_metadata?.first_name || 'Usuario',
        lastName: user.user_metadata?.last_name || 'Admin',
        profileImageUrl: user.user_metadata?.avatar_url || '',
        provider: 'supabase',
        isEmailVerified: !!user.email_confirmed_at,
        role: 'user',
      });
      console.log(`✅ Usuario creado en la base de datos`);
    }
    
    // Check admin status
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.userId, userId));
    
    if (adminUser) {
      console.log(`\n✅ Usuario ya es admin`);
      console.log(`   Rol: ${adminUser.role}`);
      console.log(`   Activo: ${adminUser.isActive}`);
      
      if (!adminUser.isActive) {
        console.log(`\n🔄 Activando usuario admin...`);
        await db
          .update(adminUsers)
          .set({ isActive: true })
          .where(eq(adminUsers.userId, userId));
        console.log(`✅ Usuario admin activado`);
      }
    } else {
      console.log(`\n➕ Convirtiendo usuario en super_admin...`);
      await db.insert(adminUsers).values({
        userId: userId,
        role: 'super_admin',
        permissions: ['*'],
        isActive: true,
      });
      console.log(`✅ Usuario es ahora super_admin`);
    }
    
    console.log('\n═'.repeat(70));
    console.log('\n🎉 ¡USUARIO ARREGLADO CORRECTAMENTE!\n');
    console.log('📝 Próximos pasos:\n');
    console.log('   1. Ve a: http://localhost:5000/clear-cache');
    console.log('   2. Haz clic en "Limpiar Caché"');
    console.log('   3. Haz login nuevamente');
    console.log(`   4. Email: ${user.email}`);
    console.log(`   5. Password: (tu contraseña de Supabase)\n`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixCurrentUser();

