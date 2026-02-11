#!/usr/bin/env node
import * as dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

async function addCategoryColumn() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL no está configurada.');
    process.exit(1);
  }

  const isSupabase = connectionString.includes('supabase');
  const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

  const pool = new Pool({
    connectionString,
    ssl: sslConfig,
  });

  try {
    console.log('\n📝 Agregando columna category a live_events...\n');
    
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'live_events'
        AND column_name = 'category';
    `;
    const checkResult = await pool.query(checkColumnQuery);

    if (checkResult.rows.length > 0) {
      console.log('✅ Columna category ya existe. Saltando.');
    } else {
      const alterTableQuery = `
        ALTER TABLE live_events
        ADD COLUMN category VARCHAR;
      `;
      await pool.query(alterTableQuery);
      console.log('✅ Columna category agregada exitosamente\n');
    }

    // Verify column creation
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'live_events'
        AND column_name = 'category';
    `;
    const verifyResult = await pool.query(verifyQuery);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Verificación exitosa:');
      console.log(verifyResult.rows[0]);
    } else {
      console.error('❌ Error: La columna category no se encontró después de la operación.');
      process.exit(1);
    }
    
    console.log('\n🎉 ¡Listo! Ahora puedes agregar categorías a los eventos.');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end(); // Close the connection pool
  }
}

addCategoryColumn();

