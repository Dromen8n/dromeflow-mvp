-- Adicionar coluna is_active na tabela units
-- Execute este script no seu banco de dados Supabase

ALTER TABLE units ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Comentário: Define o status ativo/inativo da unidade
-- true = Unidade ativa
-- false = Unidade inativa
-- Padrão: true (nova unidade é ativa por padrão)

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'units' AND column_name = 'is_active';
