-- Run after creating admin user via API or manually in Supabase Auth dashboard.
-- This script updates profile role if admin user already exists.
-- Admin user creation is handled by scripts/seed-admin.ts using service role.

UPDATE public.profiles
SET role = 'admin', full_name = 'CFI Administrator'
WHERE id IN (
  SELECT id FROM auth.users WHERE email ILIKE 'cfi@%'
);
