#!/usr/bin/env node
/**
 * Script para crear un nuevo usuario en Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para leer input del usuario
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createUser() {
  try {
    console.log('\n👤 CREAR NUEVO USUARIO EN SUPABASE\n');
    console.log('═'.repeat(70));
    
    // Solicitar datos del usuario
    const email = await prompt('\n📧 Email: ');
    const password = await prompt('🔒 Password (mínimo 6 caracteres): ');
    const firstName = await prompt('👤 Nombre: ');
    const lastName = await prompt('👤 Apellido: ');
    
    if (!email || !password || password.length < 6) {
      console.error('\n❌ Email y password (mínimo 6 caracteres) son requeridos');
      process.exit(1);
    }
    
    console.log('\n🔄 Creando usuario...\n');
    
    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || '',
      },
    });
    
    if (error) {
      console.error('❌ Error creando usuario:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Usuario creado exitosamente en Supabase Auth!\n');
    console.log('═'.repeat(70));
    console.log('\n📋 DATOS DEL USUARIO:\n');
    console.log(`   Email: ${data.user.email}`);
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Verificado: ${!!data.user.email_confirmed_at}`);
    console.log('\n═'.repeat(70));
    
    // Preguntar si quiere hacerlo admin
    const makeAdmin = await prompt('\n¿Quieres hacer este usuario ADMIN? (s/n): ');
    
    if (makeAdmin.toLowerCase() === 's' || makeAdmin.toLowerCase() === 'si') {
      console.log('\n✅ Para hacer este usuario admin, ejecuta:\n');
      console.log('   npm run create:admin\n');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createUser();

