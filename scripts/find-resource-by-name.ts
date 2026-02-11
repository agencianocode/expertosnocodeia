/**
 * Script para encontrar recursos por nombre de archivo
 */

import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurado');
  process.exit(1);
}

const isSupabase = DATABASE_URL.includes('supabase');
const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

async function findResource() {
  try {
    const searchTerm = '8.1_Plantilla_Maestra_Z_API_Desactivar';
    
    console.log(`\n🔍 Buscando recursos con nombre: "${searchTerm}"\n`);
    
    const result = await pool.query(
      `SELECT id, file_name, file_url, title, lesson_id, course_id 
       FROM lesson_resources 
       WHERE file_name ILIKE $1 OR title ILIKE $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [`%${searchTerm}%`]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ No se encontraron recursos con ese nombre`);
      
      // Buscar todos los recursos recientes
      console.log(`\n📋 Mostrando últimos 10 recursos...`);
      const allResult = await pool.query(
        `SELECT id, file_name, file_url, title FROM lesson_resources 
         ORDER BY created_at DESC LIMIT 10`
      );
      
      allResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Nombre: ${row.file_name}`);
        console.log(`   URL: ${row.file_url}`);
        console.log(`   Título: ${row.title}`);
        console.log('');
      });
    } else {
      console.log(`✅ Encontrados ${result.rows.length} recursos:\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Nombre: ${row.file_name}`);
        console.log(`   URL: ${row.file_url}`);
        console.log(`   Título: ${row.title}`);
        console.log(`   Lesson ID: ${row.lesson_id || 'N/A'}`);
        console.log(`   Course ID: ${row.course_id || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findResource();

