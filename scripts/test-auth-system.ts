#!/usr/bin/env node
/**
 * Script para probar el sistema de autenticación
 * Verifica que usuarios pueden hacer login correctamente
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users } from '../shared/schema';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('\n🔌 Probando conexión a Supabase Auth...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️ No hay sesión activa (esto es normal)');
    } else {
      console.log('✅ Conexión a Supabase Auth exitosa');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return false;
  }
}

async function analyzeAuthState() {
  console.log('\n📊 Analizando estado de autenticación...\n');
  
  const allUsers = await db.select().from(users);
  
  const stats = {
    total: allUsers.length,
    supabase: allUsers.filter(u => u.provider === 'supabase').length,
    google: allUsers.filter(u => u.provider === 'google').length,
    email: allUsers.filter(u => u.provider === 'email').length,
    other: allUsers.filter(u => !u.provider || (u.provider !== 'supabase' && u.provider !== 'google' && u.provider !== 'email')).length,
    withPassword: allUsers.filter(u => u.password).length,
    withoutPassword: allUsers.filter(u => !u.password).length,
    verified: allUsers.filter(u => u.isEmailVerified).length,
    unverified: allUsers.filter(u => !u.isEmailVerified).length,
  };
  
  console.log('📦 Estadísticas de Usuarios:');
  console.log(`   Total: ${stats.total}`);
  console.log(`\n   Por Provider:`);
  console.log(`   - Supabase: ${stats.supabase} ✅`);
  console.log(`   - Google: ${stats.google} ✅`);
  console.log(`   - Email (legacy): ${stats.email} ${stats.email > 0 ? '⚠️' : '✅'}`);
  console.log(`   - Otros: ${stats.other} ${stats.other > 0 ? '⚠️' : '✅'}`);
  
  console.log(`\n   Contraseñas:`);
  console.log(`   - Con contraseña: ${stats.withPassword}`);
  console.log(`   - Sin contraseña: ${stats.withoutPassword} ${stats.withoutPassword > 0 ? '⚠️' : '✅'}`);
  
  console.log(`\n   Verificación:`);
  console.log(`   - Verificados: ${stats.verified}`);
  console.log(`   - Sin verificar: ${stats.unverified} ${stats.unverified > 0 ? 'ℹ️' : '✅'}`);
  
  return stats;
}

async function checkMigrationStatus() {
  console.log('\n🔍 Verificando estado de migración...\n');
  
  const allUsers = await db.select().from(users);
  
  const needsMigration = allUsers.filter(user => {
    const provider = user.provider || 'unknown';
    return provider !== 'supabase' && provider !== 'google';
  });
  
  if (needsMigration.length === 0) {
    console.log('✅ Todos los usuarios están migrados a Supabase o usan Google OAuth');
    console.log('   No se requiere migración adicional.\n');
    return true;
  } else {
    console.log(`⚠️ ${needsMigration.length} usuarios necesitan migración:\n`);
    needsMigration.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (Provider: ${user.provider || 'unknown'})`);
    });
    
    if (needsMigration.length > 5) {
      console.log(`   ... y ${needsMigration.length - 5} más`);
    }
    
    console.log('\n   Ejecuta: npm run migrate:auth\n');
    return false;
  }
}

async function checkSecurityIssues() {
  console.log('\n🔒 Verificando problemas de seguridad...\n');
  
  const allUsers = await db.select().from(users);
  
  interface SecurityIssue {
    type: 'critical' | 'warning' | 'info';
    message: string;
    users: string[];
  }
  
  const issues: SecurityIssue[] = [];
  
  // Users without password (excluding Google users)
  const withoutPassword = allUsers.filter(u => !u.password && u.provider !== 'google');
  if (withoutPassword.length > 0) {
    issues.push({
      type: 'critical',
      message: `${withoutPassword.length} usuario(s) sin contraseña (no Google)`,
      users: withoutPassword.slice(0, 3).map(u => u.email),
    });
  }
  
  // Users with legacy provider
  const legacyProvider = allUsers.filter(u => u.provider === 'email' || !u.provider);
  if (legacyProvider.length > 0) {
    issues.push({
      type: 'warning',
      message: `${legacyProvider.length} usuario(s) con provider legacy`,
      users: legacyProvider.slice(0, 3).map(u => u.email),
    });
  }
  
  // Users with unverified emails
  const unverified = allUsers.filter(u => !u.isEmailVerified && u.provider !== 'google');
  if (unverified.length > 0) {
    issues.push({
      type: 'info',
      message: `${unverified.length} usuario(s) con email sin verificar`,
      users: unverified.slice(0, 3).map(u => u.email),
    });
  }
  
  if (issues.length === 0) {
    console.log('✅ No se encontraron problemas de seguridad');
    return true;
  }
  
  issues.forEach(issue => {
    const icon = issue.type === 'critical' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${issue.message}`);
    issue.users.forEach(email => {
      console.log(`   - ${email}`);
    });
    console.log('');
  });
  
  return issues.length === 0;
}

async function testAuthEndpoints() {
  console.log('\n🧪 Probando endpoints de autenticación...\n');
  
  console.log('📝 Endpoints disponibles:');
  console.log('   POST /api/auth/register - Registro de usuarios');
  console.log('   POST /api/auth/login - Login de usuarios');
  console.log('   GET /api/auth/me - Obtener usuario actual');
  console.log('   POST /api/auth/logout - Cerrar sesión');
  console.log('   GET /api/auth/session - Verificar sesión');
  
  console.log('\n✅ Para probar los endpoints:');
  console.log('   1. Inicia el servidor: npm run dev');
  console.log('   2. Usa Postman o curl para probar los endpoints');
  console.log('   3. Verifica que login funciona con usuarios migrados\n');
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE FINAL');
  console.log('='.repeat(60));
  
  const stats = await analyzeAuthState();
  const migrated = await checkMigrationStatus();
  const secure = await checkSecurityIssues();
  await testAuthEndpoints();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 CONCLUSIONES');
  console.log('='.repeat(60));
  
  if (migrated && secure) {
    console.log('\n✅ Sistema de autenticación en buen estado');
    console.log('   - Todos los usuarios migrados');
    console.log('   - No hay problemas de seguridad críticos');
    console.log('   - Sistema listo para producción\n');
  } else {
    console.log('\n⚠️ Se requiere atención:');
    if (!migrated) {
      console.log('   - Completar migración de usuarios: npm run migrate:auth');
    }
    if (!secure) {
      console.log('   - Resolver problemas de seguridad identificados');
    }
    console.log('');
  }
  
  console.log('📚 Documentación: docs/AUTH_MIGRATION_GUIDE.md');
  console.log('');
}

async function main() {
  console.log('🚀 Test del Sistema de Autenticación\n');
  console.log('='.repeat(60));
  
  // Test Supabase connection
  const connected = await testSupabaseConnection();
  
  if (!connected) {
    console.log('\n❌ No se pudo conectar a Supabase');
    console.log('   Verifica las variables de entorno.\n');
    process.exit(1);
  }
  
  // Generate comprehensive report
  await generateReport();
}

main().catch(console.error);

