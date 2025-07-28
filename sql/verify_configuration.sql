-- ========================================
-- VERIFICAÇÃO DE CONFIGURAÇÃO - DromeFlow MVP
-- Data: 26/07/2025
-- Descrição: Script para verificar se todas as tabelas estão configuradas corretamente
-- ========================================

-- Verificar estrutura da tabela users
SELECT 
    'USERS TABLE STRUCTURE' as verification_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se todas as colunas necessárias existem
SELECT 
    'REQUIRED COLUMNS CHECK' as verification_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') 
        THEN '✅ name column exists' 
        ELSE '❌ name column missing' 
    END as name_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') 
        THEN '✅ created_at column exists' 
        ELSE '❌ created_at column missing' 
    END as created_at_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') 
        THEN '✅ updated_at column exists' 
        ELSE '❌ updated_at column missing' 
    END as updated_at_check;

-- Verificar triggers
SELECT 
    'TRIGGERS CHECK' as verification_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND event_object_schema = 'public';

-- Verificar dados dos usuários
SELECT 
    'USERS DATA SUMMARY' as verification_type,
    COUNT(*) as total_users,
    COUNT(name) as users_with_name,
    COUNT(*) - COUNT(name) as users_without_name,
    COUNT(CASE WHEN role_id IS NOT NULL THEN 1 END) as users_with_role
FROM public.users;

-- Verificar roles disponíveis
SELECT 
    'ROLES AVAILABLE' as verification_type,
    r.name as role_name,
    r.display_name,
    COUNT(u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON r.id = u.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY r.name;

-- Verificar relacionamentos user_units
SELECT 
    'USER_UNITS SUMMARY' as verification_type,
    COUNT(*) as total_relationships,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT unit_id) as unique_units
FROM public.user_units;

-- Status final
SELECT 
    'CONFIGURATION STATUS' as verification_type,
    '✅ Configuration check completed' as status,
    current_timestamp as checked_at;
