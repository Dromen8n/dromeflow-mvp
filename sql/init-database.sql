-- Inicialização do banco de dados DromeFlow MVP
-- Execute estes comandos no Supabase SQL Editor

-- Verificar e criar tabelas base se não existirem

-- Tabela: roles (se não existir)
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Inserir roles básicos se não existirem
INSERT INTO public.roles (name, description) VALUES 
('super_admin', 'Super Administrador do sistema'),
('admin', 'Administrador de unidade'),
('user', 'Usuário padrão')
ON CONFLICT (name) DO NOTHING;

-- Tabela: users (se não existir)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password text NOT NULL,
  role_id uuid NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles (id)
) TABLESPACE pg_default;

-- Tabela: modules (se não existir)
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Inserir módulos básicos se não existirem
INSERT INTO public.modules (name, display_name, description) VALUES 
('gestao-sistema', 'Gestão do Sistema', 'Módulo para administração do sistema'),
('dashboard', 'Dashboard', 'Painel principal do sistema'),
('relatorios', 'Relatórios', 'Módulo de relatórios')
ON CONFLICT (name) DO NOTHING;

-- Tabela: units (unidades)
CREATE TABLE IF NOT EXISTS public.units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Tabela: user_units (relacionamento usuário-unidade)
CREATE TABLE IF NOT EXISTS public.user_units (
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_units_pkey PRIMARY KEY (user_id, unit_id),
  CONSTRAINT user_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units (id) ON DELETE CASCADE,
  CONSTRAINT user_units_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Tabela: user_module_permissions (permissões de módulo por usuário)
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  unit_id uuid NULL,
  module_id uuid NULL,
  granted_by uuid NULL,
  granted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_module_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_module_permissions_user_id_unit_id_module_id_key UNIQUE (user_id, unit_id, module_id),
  CONSTRAINT user_module_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES users (id),
  CONSTRAINT user_module_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
  CONSTRAINT user_module_permissions_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units (id) ON DELETE CASCADE,
  CONSTRAINT user_module_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Tabela: unit_modules (módulos habilitados por unidade)
CREATE TABLE IF NOT EXISTS public.unit_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NULL,
  module_id uuid NULL,
  enabled_by uuid NULL,
  enabled_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT unit_modules_pkey PRIMARY KEY (id),
  CONSTRAINT unit_modules_unit_id_module_id_key UNIQUE (unit_id, module_id),
  CONSTRAINT unit_modules_enabled_by_fkey FOREIGN KEY (enabled_by) REFERENCES users (id),
  CONSTRAINT unit_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
  CONSTRAINT unit_modules_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Atualizar tabela users se necessário (pode já existir)
-- Apenas adicione as colunas se não existirem
DO $$ 
BEGIN
    -- Verificar se as colunas existem antes de criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE public.users ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE public.users ADD COLUMN full_name text;
    END IF;
END $$;

-- Inserir dados de exemplo (unidades)
INSERT INTO public.units (name, description) VALUES 
('Matriz', 'Unidade principal da empresa'),
('Filial Norte', 'Filial região norte'),
('Filial Sul', 'Filial região sul')
ON CONFLICT (name) DO NOTHING;

-- Inserir usuário super_admin de exemplo (senha: admin123)
DO $$
DECLARE 
    super_admin_role_id uuid;
BEGIN
    -- Buscar o ID do role super_admin
    SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';
    
    -- Inserir super_admin se não existir
    INSERT INTO public.users (email, password, role_id) VALUES 
    ('admin@dromeflow.com', 'admin123', super_admin_role_id)
    ON CONFLICT (email) DO NOTHING;
END $$;

-- Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_modules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajuste conforme necessário)
-- Política para units - permite leitura para usuários autenticados
DROP POLICY IF EXISTS "Units are viewable by authenticated users" ON public.units;
CREATE POLICY "Units are viewable by authenticated users" ON public.units
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para units - permite inserção/atualização para super_admin
DROP POLICY IF EXISTS "Units are manageable by super_admin" ON public.units;
CREATE POLICY "Units are manageable by super_admin" ON public.units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'super_admin'
        )
    );

-- Política para user_units
DROP POLICY IF EXISTS "User units are viewable by related users" ON public.user_units;
CREATE POLICY "User units are viewable by related users" ON public.user_units
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Política para unit_modules
DROP POLICY IF EXISTS "Unit modules are viewable by authenticated users" ON public.unit_modules;
CREATE POLICY "Unit modules are viewable by authenticated users" ON public.unit_modules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para user_module_permissions
DROP POLICY IF EXISTS "User module permissions are viewable by related users" ON public.user_module_permissions;
CREATE POLICY "User module permissions are viewable by related users" ON public.user_module_permissions
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE public.units IS 'Unidades organizacionais do sistema';
COMMENT ON TABLE public.user_units IS 'Relacionamento entre usuários e unidades';
COMMENT ON TABLE public.user_module_permissions IS 'Permissões específicas de módulos para usuários em unidades';
COMMENT ON TABLE public.unit_modules IS 'Módulos habilitados para cada unidade';
