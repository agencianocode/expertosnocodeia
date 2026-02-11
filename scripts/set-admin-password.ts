#!/usr/bin/env node
/**
 * Script para establecer contraseña a un usuario específico
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setPassword() {
  const email = 'fabianseguraconsultor@gmail.com';
  const newPassword = 'Admin123!';
  
  console.log(`🔐 Estableciendo contraseña para: ${email}\n`);
  
  try {
    // Buscar usuario en Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
      process.exit(1);
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ Usuario ${email} no encontrado en Supabase Auth`);
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado: ${user.id}`);
    
    // Actualizar contraseña
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    
    if (error) {
      console.error('❌ Error actualizando contraseña:', error);
      process.exit(1);
    }
    
    console.log('\n✅ ¡Contraseña actualizada exitosamente!\n');
    console.log('═'.repeat(50));
    console.log('📧 Email:', email);
    console.log('🔑 Nueva contraseña:', newPassword);
    console.log('═'.repeat(50));
    console.log('\nAhora puedes hacer login con estas credenciales.\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setPassword();

