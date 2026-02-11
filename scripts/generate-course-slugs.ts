import dotenv from 'dotenv';
import { storage } from '../server/storage';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

// Función para convertir título a slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres especiales (á → a)
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .replace(/[^a-z0-9]+/g, '-') // Reemplaza espacios y caracteres especiales con guiones
    .replace(/^-+|-+$/g, '') // Elimina guiones al inicio y final
    .substring(0, 100); // Limita la longitud
}

async function generateCourseSlugs() {
  console.log('🚀 Generando slugs para cursos...\n');
  
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurada');
    process.exit(1);
  }

  const isSupabase = DATABASE_URL.includes('supabase');
  const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: sslConfig,
    connectionTimeoutMillis: 30000,
  });

  try {
    // Obtener todos los cursos sin slug
    console.log('📋 Obteniendo cursos sin slug...');
    const result = await pool.query(`
      SELECT id, title, slug 
      FROM courses 
      WHERE slug IS NULL OR slug = ''
      ORDER BY title
    `);

    console.log(`✅ Encontrados ${result.rows.length} cursos sin slug\n`);

    if (result.rows.length === 0) {
      console.log('✅ Todos los cursos ya tienen slug asignado');
      await pool.end();
      return;
    }

    let updated = 0;
    let skipped = 0;
    const slugCounts: Record<string, number> = {};

    for (const course of result.rows) {
      let baseSlug = generateSlug(course.title);
      
      // Si el slug ya existe, agregar número
      let finalSlug = baseSlug;
      let counter = 1;
      
      while (slugCounts[finalSlug] || await slugExists(pool, finalSlug, course.id)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      slugCounts[finalSlug] = 1;

      // Actualizar el curso con el slug
      try {
        await pool.query(
          'UPDATE courses SET slug = $1 WHERE id = $2',
          [finalSlug, course.id]
        );
        console.log(`✅ ${course.title}`);
        console.log(`   Slug: ${finalSlug}\n`);
        updated++;
      } catch (error: any) {
        console.error(`❌ Error actualizando curso "${course.title}":`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   📝 Total: ${result.rows.length}\n`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

async function slugExists(pool: Pool, slug: string, excludeId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT id FROM courses WHERE slug = $1 AND id != $2 LIMIT 1',
    [slug, excludeId]
  );
  return result.rows.length > 0;
}

generateCourseSlugs()
  .then(() => {
    console.log('✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

