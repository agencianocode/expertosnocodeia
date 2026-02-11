#!/usr/bin/env node
/**
 * Script para crear un usuario admin directamente en Supabase y la BD
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users, adminUsers } from '../shared/schema';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  // Datos del usuario admin
  const email = 'fabianseguraconsultor@gmail.com';
  const password = 'Admin123!'; // Cambiar después del primer login
  const firstName = 'Fabian';
  const lastName = 'Segura';
  
  try {
    console.log('\n👤 CREANDO USUARIO ADMIN\n');
    console.log('═'.repeat(70));
    
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔒 Password: ${password}`);
    console.log(`\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer login\n`);
    
    // 1. Crear usuario en Supabase Auth
    console.log('1️⃣ Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });
    
    if (authError || !authData.user) {
      console.error('❌ Error creando usuario en Supabase:', authError?.message);
      process.exit(1);
    }
    
    console.log(`✅ Usuario creado en Supabase Auth`);
    console.log(`   ID: ${authData.user.id}`);
    
    // 2. Crear usuario en la base de datos
    console.log('\n2️⃣ Creando usuario en la base de datos...');
    await db.insert(users).values({
      id: authData.user.id,
      email: email,
      firstName: firstName,
      lastName: lastName,
      profileImageUrl: '',
      provider: 'supabase',
      isEmailVerified: true,
      role: 'user',
    });
    console.log(`✅ Usuario creado en la base de datos`);
    
    // 3. Crear registro de admin
    console.log('\n3️⃣ Convirtiendo usuario en super_admin...');
    await db.insert(adminUsers).values({
      userId: authData.user.id,
      role: 'super_admin',
      permissions: ['*'],
      isActive: true,
    });
    console.log(`✅ Usuario es ahora super_admin`);
    
    console.log('\n═'.repeat(70));
    console.log('\n🎉 ¡USUARIO ADMIN CREADO EXITOSAMENTE!\n');
    console.log('📝 Credenciales de acceso:\n');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🔗 Próximos pasos:\n`);
    console.log('   1. Ve a: http://localhost:5000/clear-cache');
    console.log('   2. Haz clic en "Limpiar Caché"');
    console.log('   3. Haz login con las credenciales de arriba');
    console.log('   4. ⚠️  IMPORTANTE: Cambia la contraseña después del primer login\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();

