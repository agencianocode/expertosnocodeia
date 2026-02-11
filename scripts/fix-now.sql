-- Insertar usuario con ID de Supabase si no existe
INSERT INTO users (id, email, first_name, last_name, role, provider, is_email_verified, created_at, updated_at)
VALUES (
  'cafe5e08-8581-4726-801b-4daa01e20610',
  'fabianseguraconsultor@gmail.com',
  'Fabian',
  'Segura',
  'admin',
  'supabase',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insertar registro de admin con ID de Supabase
INSERT INTO admin_users (user_id, role, permissions, is_active, created_at, updated_at)
VALUES (
  'cafe5e08-8581-4726-801b-4daa01e20610',
  'super_admin',
  ARRAY['*'],
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET is_active = true;

-- Verificar
SELECT u.id, u.email, u.role, a.role as admin_role, a.is_active
FROM users u
LEFT JOIN admin_users a ON u.id = a.user_id
WHERE u.email = 'fabianseguraconsultor@gmail.com';

