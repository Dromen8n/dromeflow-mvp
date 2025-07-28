-- ========================================
-- ATUALIZAÇÃO DA TABELA USERS - DromeFlow MVP
-- Data: 26/07/2025
-- Descrição: Script para garantir estrutura correta da tabela users
-- ========================================

-- Verificar se a coluna 'name' existe, se não existir, criar
DO $$
BEGIN
    -- Adicionar coluna 'name' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN name text;
        RAISE NOTICE 'Coluna "name" adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna "name" já existe na tabela users';
    END IF;

    -- Verificar se a coluna 'created_at' existe, se não existir, criar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN created_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Coluna "created_at" adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna "created_at" já existe na tabela users';
    END IF;

    -- Verificar se a coluna 'updated_at' existe, se não existir, criar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Coluna "updated_at" adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna "updated_at" já existe na tabela users';
    END IF;
END $$;

-- Atualizar registros existentes que não têm nome definido
UPDATE public.users 
SET name = 'Usuário' 
WHERE name IS NULL OR name = '';

-- Opcional: Tornar a coluna 'name' obrigatória (descomente se desejar)
-- ALTER TABLE public.users ALTER COLUMN name SET NOT NULL;

-- Criar trigger para atualizar 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Criar novo trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar contagem de usuários
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(name) as usuarios_com_nome,
    COUNT(*) - COUNT(name) as usuarios_sem_nome
FROM public.users;

RAISE NOTICE '✅ Atualização da tabela users concluída com sucesso!';
