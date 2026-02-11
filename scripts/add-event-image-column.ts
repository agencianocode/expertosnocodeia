#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { pool } from '../server/db';

dotenv.config();

async function addEventImageColumn() {
  try {
    console.log('\n📝 Agregando columna event_image a live_events...\n');
    
    // Agregar columna si no existe
    await pool.query(`
      ALTER TABLE live_events 
      ADD COLUMN IF NOT EXISTS event_image VARCHAR;
    `);
    
    console.log('✅ Columna event_image agregada exitosamente\n');
    
    // Verificar que se agregó
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'live_events' AND column_name = 'event_image';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verificación exitosa:');
      console.log(result.rows[0]);
    } else {
      console.log('⚠️  No se pudo verificar la columna');
    }
    
    console.log('\n🎉 ¡Listo! Ahora puedes crear eventos con imágenes.\n');
    
    // Cerrar conexión
    await pool.end();
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

addEventImageColumn();

