# DromeFlow MVP - Configuração do Banco de Dados

## Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Acesso ao SQL Editor do Supabase

## 🚀 Configuração Inicial

### 1. Executar Script de Inicialização

1. Acesse o SQL Editor no painel do Supabase
2. Execute o arquivo `sql/init-database.sql`
3. Verifique se todas as tabelas foram criadas com sucesso

### 2. Atualizar Tabela Users (IMPORTANTE)

1. Execute o arquivo `sql/update_users_table.sql`
2. Este script adiciona a coluna `name` e configura triggers
3. É seguro executar múltiplas vezes (idempotente)

### 3. Verificar Configuração

1. Execute o arquivo `sql/verify_configuration.sql`
2. Verifique se todas as verificações passaram (✅)
3. Este script mostra o status completo do sistema

## 📁 Arquivos SQL Disponíveis

### Scripts Principais:
- **`init-database.sql`** - Configuração inicial das tabelas
- **`update_users_table.sql`** - ⭐ Atualização segura da tabela users
- **`verify_configuration.sql`** - ⭐ Verificação completa da configuração

### Scripts Específicos:
- **`add_units_is_active.sql`** - Adiciona coluna is_active às unidades
- **`insert_dashboard_module.sql`** - Insere módulo dashboard

### Scripts de Funcionalidades:
- **`init-database.sql`** - Script principal de inicialização

### 2. Tabelas Criadas

O script criará as seguintes tabelas:

- **units**: Unidades organizacionais
- **user_units**: Relacionamento usuário-unidade
- **user_module_permissions**: Permissões de módulos por usuário
- **unit_modules**: Módulos habilitados por unidade

### 3. Estrutura do Sistema

```
├── users (tabela base, deve já existir)
├── roles (tabela base, deve já existir)
├── modules (tabela base, deve já existir)
├── units (nova)
├── user_units (nova)
├── user_module_permissions (nova)
└── unit_modules (nova)
```

### 4. Dados de Exemplo

O script insere 3 unidades de exemplo:
- Matriz
- Filial Norte
- Filial Sul

### 5. Configuração RLS (Row Level Security)

As políticas RLS são configuradas automaticamente para:
- Super admins: acesso total
- Admins: acesso às unidades relacionadas
- Usuários: acesso apenas aos próprios dados

## Verificação

Após executar o script, verifique:

1. **Tabelas criadas**: Vá em "Table Editor" e confirme que todas as tabelas existem
2. **Dados de exemplo**: Verifique se as unidades foram inseridas na tabela `units`
3. **RLS ativo**: Confirme que RLS está habilitado nas tabelas

## Troubleshooting

### Erro: "relation does not exist"
- Verifique se as tabelas base (users, roles, modules) existem
- Execute o script novamente

### Erro: "permission denied"
- Verifique se você tem privilégios de administrador no Supabase
- Verifique se o RLS não está bloqueando suas operações

### Erro: "foreign key constraint"
- Certifique-se de que as tabelas referenciadas existem
- Verifique se os IDs estão corretos

## Próximos Passos

1. Configure as variáveis de ambiente no sistema
2. Teste o módulo "Gestão do Sistema"
3. Crie usuários administradores conforme necessário
