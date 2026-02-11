#!/usr/bin/env node
/**
 * Script para verificar el email del usuario admin
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAdminEmail() {
  const email = 'fabianseguraconsultor@gmail.com';
  const userId = '6c471ce8-9618-42e6-b39c-23ffa7214bcb';
  
  try {
    console.log('\n📧 VERIFICANDO EMAIL DEL ADMIN\n');
    console.log('═'.repeat(70));
    
    // 1. Verificar estado en Supabase Auth
    console.log('\n1️⃣ Verificando estado en Supabase Auth...');
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !user) {
      console.error('❌ Usuario no encontrado en Supabase Auth');
      process.exit(1);
    }
    
    console.log(`✅ Usuario en Supabase:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email confirmado: ${!!user.email_confirmed_at}`);
    console.log(`   Fecha confirmación: ${user.email_confirmed_at || 'N/A'}`);
    
    // 2. Verificar estado en la base de datos
    console.log('\n2️⃣ Verificando estado en la base de datos...');
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!dbUser) {
      console.error('❌ Usuario no encontrado en la base de datos');
      process.exit(1);
    }
    
    console.log(`✅ Usuario en BD:`);
    console.log(`   Email: ${dbUser.email}`);
    console.log(`   Email verificado: ${dbUser.isEmailVerified}`);
    
    // 3. Actualizar si es necesario
    if (!dbUser.isEmailVerified) {
      console.log('\n3️⃣ Actualizando estado en la base de datos...');
      await db
        .update(users)
        .set({ 
          isEmailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      console.log(`✅ Email verificado en la base de datos`);
    } else {
      console.log('\n✅ El email ya está verificado en la base de datos');
    }
    
    // 4. Confirmar email en Supabase si no está confirmado
    if (!user.email_confirmed_at) {
      console.log('\n4️⃣ Confirmando email en Supabase Auth...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error('❌ Error confirmando email:', updateError.message);
      } else {
        console.log(`✅ Email confirmado en Supabase Auth`);
      }
    } else {
      console.log('\n✅ El email ya está confirmado en Supabase Auth');
    }
    
    console.log('\n═'.repeat(70));
    console.log('\n🎉 ¡EMAIL VERIFICADO CORRECTAMENTE!\n');
    console.log('📝 Próximos pasos:\n');
    console.log('   1. Refresca la página de perfil (F5)');
    console.log('   2. El mensaje de "Email no verificado" debería desaparecer');
    console.log('   3. Ya puedes acceder a todas las funcionalidades\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyAdminEmail();

