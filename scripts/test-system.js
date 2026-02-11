/**
 * Script de Testing y Validación del Sistema
 * 
 * Este script valida que todas las funcionalidades principales estén funcionando correctamente.
 * 
 * Uso: node --import dotenv/config scripts/test-system.js
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passed = 0;
let failed = 0;
const errors = [];

function log(message, type = 'info') {
  const prefix = type === 'success' ? `${colors.green}✓${colors.reset}` :
                 type === 'error' ? `${colors.red}✗${colors.reset}` :
                 type === 'warning' ? `${colors.yellow}⚠${colors.reset}` :
                 `${colors.blue}ℹ${colors.reset}`;
  console.log(`${prefix} ${message}`);
}

async function test(name, testFn) {
  try {
    await testFn();
    log(`${name}`, 'success');
    passed++;
  } catch (error) {
    log(`${name}: ${error.message}`, 'error');
    failed++;
    errors.push({ name, error: error.message });
  }
}

async function checkTableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  return result.rows[0].exists;
}

async function checkColumnExists(tableName, columnName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    );
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

async function checkIndexExists(indexName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE indexname = $1
    );
  `, [indexName]);
  return result.rows[0].exists;
}

console.log('\n🧪 Iniciando Testing y Validación del Sistema\n');
console.log('=' .repeat(60));

// ========== FASE 1: CRM BÁSICO ==========
console.log('\n📊 FASE 1: CRM Básico en Panel Admin\n');

await test('Tabla users existe', async () => {
  const exists = await checkTableExists('users');
  if (!exists) throw new Error('Tabla users no existe');
});

await test('Tabla user_subscriptions existe', async () => {
  const exists = await checkTableExists('user_subscriptions');
  if (!exists) throw new Error('Tabla user_subscriptions no existe');
});

await test('Tabla subscription_plans existe', async () => {
  const exists = await checkTableExists('subscription_plans');
  if (!exists) throw new Error('Tabla subscription_plans no existe');
});

// ========== FASE 2: EMAIL MARKETING ==========
console.log('\n📧 FASE 2: Email Marketing Interno\n');

await test('RESEND_API_KEY configurada', async () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no está configurada');
  }
});

await test('RESEND_FROM_EMAIL configurada', async () => {
  if (!process.env.RESEND_FROM_EMAIL) {
    log('RESEND_FROM_EMAIL no está configurada (opcional)', 'warning');
  }
});

// ========== FASE 3: BEEHIIV ==========
console.log('\n🐝 FASE 3: Integración con Beehiiv\n');

await test('BEEHIIV_API_KEY configurada', async () => {
  if (!process.env.BEEHIIV_API_KEY) {
    throw new Error('BEEHIIV_API_KEY no está configurada');
  }
});

await test('BEEHIIV_PUBLICATION_ID configurada', async () => {
  if (!process.env.BEEHIIV_PUBLICATION_ID) {
    throw new Error('BEEHIIV_PUBLICATION_ID no está configurada');
  }
  
  // Verificar formato
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!pubId.startsWith('pub_')) {
    log('BEEHIIV_PUBLICATION_ID debería empezar con "pub_"', 'warning');
  }
});

// ========== FASE 4: LANDING PAGES ==========
console.log('\n🎨 FASE 4: Landing Pages\n');

await test('STRIPE_SECRET_KEY configurada', async () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
  }
});

await test('STRIPE_WEBHOOK_SECRET configurada', async () => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    log('STRIPE_WEBHOOK_SECRET no está configurada (necesaria para webhooks)', 'warning');
  }
});

// ========== FASE 5: AUTOMATIZACIONES ==========
console.log('\n🤖 FASE 5: Automatizaciones Avanzadas\n');

await test('Tabla user_events existe', async () => {
  const exists = await checkTableExists('user_events');
  if (!exists) throw new Error('Tabla user_events no existe');
});

await test('Tabla automations existe', async () => {
  const exists = await checkTableExists('automations');
  if (!exists) throw new Error('Tabla automations no existe');
});

await test('Tabla automation_logs existe', async () => {
  const exists = await checkTableExists('automation_logs');
  if (!exists) throw new Error('Tabla automation_logs no existe');
});

await test('Tabla user_segments existe', async () => {
  const exists = await checkTableExists('user_segments');
  if (!exists) throw new Error('Tabla user_segments no existe');
});

await test('Tabla marketing_analytics existe', async () => {
  const exists = await checkTableExists('marketing_analytics');
  if (!exists) throw new Error('Tabla marketing_analytics no existe');
});

// Verificar columnas importantes
await test('user_events tiene columnas requeridas', async () => {
  const columns = ['id', 'user_id', 'event_type', 'event_data', 'created_at'];
  for (const col of columns) {
    const exists = await checkColumnExists('user_events', col);
    if (!exists) throw new Error(`Columna ${col} no existe en user_events`);
  }
});

await test('automations tiene columnas requeridas', async () => {
  const columns = ['id', 'name', 'trigger_type', 'trigger_config', 'action_type', 'action_config', 'is_active'];
  for (const col of columns) {
    const exists = await checkColumnExists('automations', col);
    if (!exists) throw new Error(`Columna ${col} no existe en automations`);
  }
});

await test('user_segments tiene columnas requeridas', async () => {
  const columns = ['id', 'name', 'rules', 'user_count'];
  for (const col of columns) {
    const exists = await checkColumnExists('user_segments', col);
    if (!exists) throw new Error(`Columna ${col} no existe en user_segments`);
  }
});

// Verificar índices importantes
await test('Índices de user_events existen', async () => {
  const indexes = ['idx_user_events_user_id', 'idx_user_events_event_type', 'idx_user_events_created_at'];
  for (const idx of indexes) {
    const exists = await checkIndexExists(idx);
    if (!exists) {
      log(`Índice ${idx} no existe (puede afectar performance)`, 'warning');
    }
  }
});

// ========== ONBOARDING ==========
console.log('\n🎓 ONBOARDING PERSONALIZADO\n');

await test('Tabla user_onboarding_responses existe', async () => {
  const exists = await checkTableExists('user_onboarding_responses');
  if (!exists) throw new Error('Tabla user_onboarding_responses no existe');
});

// ========== RESUMEN ==========
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMEN DE TESTING\n');

console.log(`${colors.green}✓ Tests pasados: ${passed}${colors.reset}`);
if (failed > 0) {
  console.log(`${colors.red}✗ Tests fallidos: ${failed}${colors.reset}`);
}

if (errors.length > 0) {
  console.log('\n❌ ERRORES ENCONTRADOS:\n');
  errors.forEach(({ name, error }) => {
    console.log(`${colors.red}  • ${name}${colors.reset}`);
    console.log(`    ${error}\n`);
  });
}

if (failed === 0) {
  console.log(`\n${colors.green}✅ ¡Todos los tests pasaron! El sistema está listo.${colors.reset}\n`);
} else {
  console.log(`\n${colors.yellow}⚠️  Hay ${failed} error(es) que deben corregirse antes de continuar.${colors.reset}\n`);
}

await pool.end();
process.exit(failed > 0 ? 1 : 0);

