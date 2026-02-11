#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { users, adminUsers } from '../shared/schema';
import { sql } from 'drizzle-orm';

dotenv.config();

async function fixNow() {
  try {
    console.log('\n🔧 ARREGLANDO USUARIO ADMIN AHORA...\n');
    
    // Primero verificar si existe el usuario con ese ID
    const checkUser = await db.execute(sql`
      SELECT * FROM users WHERE id = 'cafe5e08-8581-4726-801b-4daa01e20610'
    `);
    
    if (checkUser.rows.length === 0) {
      console.log('➕ Insertando usuario con ID de Supabase...');
      // Intentar insertar, pero si el email ya existe, ignorar
      try {
        await db.execute(sql`
          INSERT INTO users (id, email, first_name, last_name, role, provider, is_email_verified, created_at, updated_at)
          VALUES (
            'cafe5e08-8581-4726-801b-4daa01e20610',
            'fabianseguraconsultor_supabase@temp.com',
            'Fabian',
            'Segura',
            'admin',
            'supabase',
            true,
            NOW(),
            NOW()
          )
        `);
        console.log('✅ Usuario insertado');
      } catch (e: any) {
        console.log('⚠️  Error insertando usuario (puede ser que ya exista):', e.message);
      }
    } else {
      console.log('✅ Usuario con ID de Supabase ya existe');
    }
    
    // Verificar si ya existe antes de insertar
    const checkAdmin = await db.execute(sql`
      SELECT * FROM admin_users WHERE user_id = 'cafe5e08-8581-4726-801b-4daa01e20610'
    `);
    
    if (checkAdmin.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO admin_users (user_id, role, permissions, is_active, created_at, updated_at)
        VALUES (
          'cafe5e08-8581-4726-801b-4daa01e20610',
          'super_admin',
          '["*"]'::jsonb,
          true,
          NOW(),
          NOW()
        )
      `);
    } else {
      await db.execute(sql`
        UPDATE admin_users
        SET is_active = true
        WHERE user_id = 'cafe5e08-8581-4726-801b-4daa01e20610'
      `);
    }
    
    console.log('✅ Admin configurado');
    
    // Verificar
    const result = await db.execute(sql`
      SELECT u.id, u.email, u.role, a.role as admin_role, a.is_active
      FROM users u
      LEFT JOIN admin_users a ON u.id = a.user_id
      WHERE u.email = 'fabianseguraconsultor@gmail.com'
    `);
    
    console.log('\n✅ VERIFICACIÓN:');
    console.log(result.rows);
    console.log('\n🎉 TODO LISTO! Ahora ve a http://localhost:5000/clear-cache y haz login\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixNow();

