-- Script para testar a conexão e permissões da tabela active_workouts
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as políticas RLS estão ativas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'active_workouts';

-- 2. Verificar as políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'active_workouts';

-- 3. Verificar se o usuário atual tem permissão
SELECT auth.uid() as current_user_id;

-- 4. Testar uma consulta simples (substitua o UUID pelo seu user_id)
-- SELECT * FROM active_workouts WHERE user_id = '713c19f9-97dd-4533-a49e-b3de087d9a4d' LIMIT 1;

-- 5. Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'active_workouts';

-- 6. Verificar triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'active_workouts';
