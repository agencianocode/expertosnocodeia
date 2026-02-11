#!/usr/bin/env node
/**
 * Script para migrar usuarios a Supabase Auth
 * Migra usuarios con contraseña bcrypt a Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as readline from 'readline';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ email: string; error: string }>;
}

async function migrateUser(user: any): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`\n  🔄 Migrando: ${user.email}`);

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existsInSupabase = existingUsers?.users.some(u => u.email === user.email);

    if (existsInSupabase) {
      console.log(`  ⚠️ Usuario ya existe en Supabase Auth, actualizando metadata...`);
      
      // Update user metadata
      const supabaseUser = existingUsers?.users.find(u => u.email === user.email);
      if (supabaseUser) {
        await supabase.auth.admin.updateUserById(supabaseUser.id, {
          user_metadata: {
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            migrated: true,
            migrated_at: new Date().toISOString(),
          },
        });
      }

      // Update provider in our database
      await db
        .update(users)
        .set({
          provider: 'supabase',
          isEmailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      console.log(`  ✅ Metadata actualizada`);
      return { success: true };
    }

    // Create new user in Supabase Auth
    if (user.password) {
      // User has a password - try to migrate with it
      console.log(`  📝 Usuario tiene contraseña, creando en Supabase...`);

      // Check if password is bcrypt hash (starts with $2b$ or $2a$)
      const isBcrypt = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');

      if (isBcrypt) {
        // Supabase doesn't support importing bcrypt hashes directly
        // We need to create a user and ask them to reset their password
        console.log(`  ⚠️ Contraseña bcrypt detectada - se creará cuenta con contraseña temporal`);
        
        const tempPassword = `Temp${Math.random().toString(36).slice(2)}!`;
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            migrated: true,
            needs_password_reset: true,
            migrated_at: new Date().toISOString(),
          },
        });

        if (authError) {
          throw new Error(authError.message);
        }

        console.log(`  ✅ Usuario creado en Supabase (contraseña temporal asignada)`);
        console.log(`  ⚠️ El usuario debe usar "Olvidé mi contraseña" en su primer login`);
      } else {
        // Plain text or base64 password - decode and use
        let plainPassword;
        try {
          plainPassword = Buffer.from(user.password, 'base64').toString('utf-8');
        } catch {
          plainPassword = user.password; // Already plain text
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: plainPassword,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            migrated: true,
            migrated_at: new Date().toISOString(),
          },
        });

        if (authError) {
          throw new Error(authError.message);
        }

        console.log(`  ✅ Usuario creado en Supabase con contraseña preservada`);
      }
    } else {
      // User has no password - create with temporary password
      console.log(`  ⚠️ Usuario sin contraseña, creando con contraseña temporal...`);
      
      const tempPassword = `Temp${Math.random().toString(36).slice(2)}!`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          migrated: true,
          needs_password_setup: true,
          migrated_at: new Date().toISOString(),
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      console.log(`  ✅ Usuario creado en Supabase (contraseña temporal asignada)`);
      console.log(`  ⚠️ El usuario debe configurar su contraseña en el primer login`);
    }

    // Update provider in our database
    await db
      .update(users)
      .set({
        provider: 'supabase',
        isEmailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`  ✅ Base de datos local actualizada`);
    return { success: true };

  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Migración de Usuarios a Supabase Auth\n');
  console.log('='.repeat(60));

  // Get users that need migration
  const allUsers = await db.select().from(users);
  const usersToMigrate = allUsers.filter(user => {
    const provider = user.provider || 'unknown';
    return provider !== 'supabase' && provider !== 'google';
  });

  if (usersToMigrate.length === 0) {
    console.log('\n✅ No hay usuarios que migrar.');
    console.log('Todos los usuarios ya están en Supabase Auth o usan Google OAuth.\n');
    rl.close();
    return;
  }

  console.log(`\n📊 Usuarios a migrar: ${usersToMigrate.length}`);
  console.log('\n📋 Lista de usuarios:');
  usersToMigrate.forEach((user, index) => {
    const hasPassword = user.password ? '✅' : '❌';
    console.log(`   ${index + 1}. ${user.email} (Contraseña: ${hasPassword})`);
  });

  console.log('\n⚠️ IMPORTANTE:');
  console.log('   - Los usuarios con contraseñas bcrypt necesitarán resetear su contraseña');
  console.log('   - Los usuarios sin contraseña recibirán una temporal');
  console.log('   - Todos los usuarios quedarán con email verificado');
  console.log('   - El campo "provider" se actualizará a "supabase" en la BD local\n');

  const answer = await question('¿Deseas continuar con la migración? (sí/no): ');

  if (answer.toLowerCase() !== 'sí' && answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 's') {
    console.log('\n❌ Migración cancelada por el usuario.\n');
    rl.close();
    return;
  }

  console.log('\n🔄 Iniciando migración...\n');

  const result: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const user of usersToMigrate) {
    const migrationResult = await migrateUser(user);
    
    if (migrationResult.success) {
      result.success++;
    } else {
      result.failed++;
      result.errors.push({
        email: user.email,
        error: migrationResult.error || 'Unknown error',
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`\n✅ Exitosas: ${result.success}`);
  console.log(`❌ Fallidas: ${result.failed}`);
  console.log(`⚠️ Omitidas: ${result.skipped}`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errores encontrados:');
    result.errors.forEach(error => {
      console.log(`   - ${error.email}: ${error.error}`);
    });
  }

  console.log('\n📝 Próximos pasos:');
  console.log('   1. Notificar a usuarios que necesitan resetear contraseña');
  console.log('   2. Probar login con diferentes usuarios');
  console.log('   3. Verificar que todos pueden acceder a la aplicación');
  console.log('   4. Considerar eliminar código de auth legacy');
  console.log('\n✅ Migración completada!\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  rl.close();
  process.exit(1);
});

