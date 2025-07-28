-- Script para inserir o módulo Dashboard na tabela modules
-- Este script deve ser executado uma única vez para garantir que o módulo Dashboard esteja disponível

-- Inserir o módulo Dashboard se não existir
INSERT INTO public.modules (
    id,
    name,
    display_name,
    description,
    icon,
    route,
    is_active,
    requires_unit,
    parent_module,
    order_index,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    'dashboard' as name,
    'Dashboard' as display_name,
    'Módulo de visualização de dados e métricas' as description,
    'fas fa-chart-pie' as icon,
    '/dashboard' as route,
    true as is_active,
    true as requires_unit,
    null as parent_module,
    1 as order_index,
    now() as created_at
WHERE NOT EXISTS (
    SELECT 1 FROM public.modules WHERE name = 'dashboard'
);

-- Verificar se o módulo foi inserido
SELECT 
    id,
    name,
    display_name,
    is_active,
    order_index
FROM public.modules 
WHERE name = 'dashboard';

-- Comentário: 
-- Este script garante que o módulo Dashboard esteja disponível para ser
-- ativado/desativado para cada unidade através do sistema de gestão.
-- O campo 'requires_unit' = true indica que este módulo precisa de uma 
-- unidade selecionada para funcionar corretamente.
