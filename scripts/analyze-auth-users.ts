#!/usr/bin/env node
/**
 * Script para analizar el estado de los usuarios y su autenticación
 * Identifica usuarios que necesitan migración a Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface UserAnalysis {
  totalUsers: number;
  usersWithPassword: number;
  usersWithoutPassword: number;
  usersByProvider: Record<string, number>;
  usersInSupabase: number;
  usersNeedingMigration: number;
  verifiedEmails: number;
  unverifiedEmails: number;
}

async function analyzeUsers(): Promise<UserAnalysis> {
  console.log('📊 Analizando usuarios en la base de datos...\n');

  // Get all users
  const allUsers = await db.select().from(users);

  const analysis: UserAnalysis = {
    totalUsers: allUsers.length,
    usersWithPassword: 0,
    usersWithoutPassword: 0,
    usersByProvider: {},
    usersInSupabase: 0,
    usersNeedingMigration: 0,
    verifiedEmails: 0,
    unverifiedEmails: 0,
  };

  // Analyze each user
  for (const user of allUsers) {
    // Password status
    if (user.password) {
      analysis.usersWithPassword++;
    } else {
      analysis.usersWithoutPassword++;
    }

    // Provider
    const provider = user.provider || 'unknown';
    analysis.usersByProvider[provider] = (analysis.usersByProvider[provider] || 0) + 1;

    // Email verification
    if (user.isEmailVerified) {
      analysis.verifiedEmails++;
    } else {
      analysis.unverifiedEmails++;
    }

    // Supabase status
    if (provider === 'supabase') {
      analysis.usersInSupabase++;
    } else {
      analysis.usersNeedingMigration++;
    }
  }

  return analysis;
}

async function checkSupabaseAuth() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️ Supabase no configurado. Saltando verificación de Supabase Auth.\n');
    return { total: 0, users: [] };
  }

  console.log('🔐 Verificando usuarios en Supabase Auth...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // List all users in Supabase Auth
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error('❌ Error obteniendo usuarios de Supabase:', error.message);
      return { total: 0, users: [] };
    }

    return {
      total: data.users.length,
      users: data.users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
      })),
    };
  } catch (error: any) {
    console.error('❌ Error conectando a Supabase Auth:', error.message);
    return { total: 0, users: [] };
  }
}

async function listUsersNeedingMigration() {
  console.log('\n📋 Usuarios que necesitan migración:\n');

  const allUsers = await db.select().from(users);
  
  const needsMigration = allUsers.filter(user => {
    const provider = user.provider || 'unknown';
    return provider !== 'supabase' && provider !== 'google';
  });

  if (needsMigration.length === 0) {
    console.log('✅ No hay usuarios que necesiten migración.');
    return [];
  }

  console.log(`Total: ${needsMigration.length} usuarios\n`);

  needsMigration.forEach((user, index) => {
    const hasPassword = user.password ? '✅' : '❌';
    const isVerified = user.isEmailVerified ? '✅' : '❌';
    const provider = user.provider || 'unknown';

    console.log(`${index + 1}. ${user.email}`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Provider: ${provider}`);
    console.log(`   - Tiene contraseña: ${hasPassword}`);
    console.log(`   - Email verificado: ${isVerified}`);
    console.log(`   - Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
    console.log('');
  });

  return needsMigration;
}

async function generateMigrationPlan(usersToMigrate: any[]) {
  console.log('\n📝 Plan de Migración:\n');

  const withPassword = usersToMigrate.filter(u => u.password);
  const withoutPassword = usersToMigrate.filter(u => !u.password);

  console.log(`1. Usuarios con contraseña (${withPassword.length}):`);
  console.log('   → Migrar a Supabase Auth preservando contraseñas (hash bcrypt)');
  console.log('   → Comando: npm run migrate:auth-with-password\n');

  console.log(`2. Usuarios sin contraseña (${withoutPassword.length}):`);
  console.log('   → Crear cuentas en Supabase con contraseña temporal');
  console.log('   → Enviar email para establecer contraseña');
  console.log('   → Comando: npm run migrate:auth-without-password\n');

  console.log('3. Limpieza post-migración:');
  console.log('   → Actualizar campo provider a "supabase"');
  console.log('   → Marcar emails como verificados');
  console.log('   → Eliminar código de auth legacy (opcional)\n');
}

async function main() {
  console.log('🚀 Análisis del Sistema de Autenticación\n');
  console.log('='.repeat(60));
  console.log('\n');

  // Analyze database users
  const analysis = await analyzeUsers();

  // Check Supabase Auth
  const supabaseStatus = await checkSupabaseAuth();

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS DEL ANÁLISIS');
  console.log('='.repeat(60));
  console.log('\n📦 Base de Datos Local:');
  console.log(`   Total de usuarios: ${analysis.totalUsers}`);
  console.log(`   Con contraseña: ${analysis.usersWithPassword}`);
  console.log(`   Sin contraseña: ${analysis.usersWithoutPassword}`);
  console.log(`   Emails verificados: ${analysis.verifiedEmails}`);
  console.log(`   Emails sin verificar: ${analysis.unverifiedEmails}`);

  console.log('\n📊 Por Provider:');
  Object.entries(analysis.usersByProvider).forEach(([provider, count]) => {
    console.log(`   ${provider}: ${count} usuario(s)`);
  });

  console.log('\n🔐 Supabase Auth:');
  console.log(`   Usuarios en Supabase Auth: ${supabaseStatus.total}`);

  console.log('\n⚠️ Estado de Migración:');
  console.log(`   Usuarios ya migrados: ${analysis.usersInSupabase}`);
  console.log(`   Usuarios pendientes de migración: ${analysis.usersNeedingMigration}`);

  // List users needing migration
  const usersToMigrate = await listUsersNeedingMigration();

  // Generate migration plan
  if (usersToMigrate.length > 0) {
    await generateMigrationPlan(usersToMigrate);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Análisis completado');
  console.log('='.repeat(60));
  console.log('\n📚 Próximos pasos:');
  console.log('   1. Revisar los usuarios que necesitan migración');
  console.log('   2. Ejecutar scripts de migración según el plan');
  console.log('   3. Verificar que todos los usuarios pueden hacer login');
  console.log('\n');
}

main().catch(console.error);

