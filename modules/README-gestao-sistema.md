# 🔧 Módulo: Gestão do Sistema

## 📋 Descrição
Módulo exclusivo para **Super Administradores** responsável pela administração completa do sistema DromeFlow.

## 🎯 Funcionalidades

### 1. **Gestão de Unidades**
- ✅ Criar novas unidades organizacionais
- ✅ Editar informações de unidades existentes
- ✅ Excluir unidades (com confirmação)
- ✅ Visualizar estatísticas de administradores e módulos por unidade

### 2. **Gestão de Administradores**
- ✅ Criar usuários administradores para unidades específicas
- ✅ Associar administradores a uma ou múltiplas unidades
- ✅ Editar credenciais e permissões de administradores
- ✅ Excluir administradores do sistema

### 3. **Liberação de Módulos por Unidade**
- ✅ Configurar quais módulos cada unidade pode acessar
- ✅ Habilitar/desabilitar módulos individualmente
- ✅ Habilitar/desabilitar todos os módulos de uma vez
- ✅ Visualização clara dos módulos ativos por unidade

### 4. **Dashboard de Estatísticas**
- ✅ Total de unidades cadastradas
- ✅ Total de administradores ativos
- ✅ Total de módulos disponíveis
- ✅ Atualização em tempo real

## 🔒 Segurança

### Controle de Acesso
- **Acesso Exclusivo**: Apenas usuários com role `super_admin`
- **Verificação Dupla**: Cliente e servidor verificam permissões
- **Fallback de Segurança**: Tela de acesso negado para usuários não autorizados

### Validações
- **Formulários**: Validação completa de todos os campos obrigatórios
- **Confirmações**: Diálogos de confirmação para ações destrutivas
- **Sanitização**: Limpeza de dados de entrada

## 🗄️ Estrutura do Banco

### Tabelas Utilizadas
```sql
-- Unidades organizacionais
units (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
)

-- Usuários administradores
users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW()
)

-- Associação usuário-unidade
user_units (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, unit_id)
)

-- Módulos disponíveis
modules (
    id UUID PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR NOT NULL,
    icon VARCHAR,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER
)

-- Módulos liberados por unidade
unit_modules (
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    PRIMARY KEY (unit_id, module_id)
)

-- Roles do sistema
roles (
    id UUID PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR NOT NULL,
    level INTEGER
)
```

## 🎨 Interface

### Tema Responsivo
- **Light/Dark Mode**: Suporte completo aos dois temas
- **Design Consistente**: Usa as mesmas variáveis CSS do sistema principal
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

### Componentes
- **Stats Cards**: Cards informativos com ícones e contadores
- **Tabs Navigation**: Navegação por abas para organizar funcionalidades
- **Data Tables**: Tabelas responsivas com ações inline
- **Modals**: Formulários modais para criação/edição
- **Toggle Switches**: Switches elegantes para habilitar/desabilitar módulos

## 🔧 Arquivos

### Estrutura
```
modules/
├── gestao-sistema.html     # Interface do módulo
└── ...

js/modules/
├── gestao-sistema.js       # Lógica completa do módulo
└── ...
```

### Integração
- **Carregamento Dinâmico**: Módulo carregado apenas quando acessado
- **Inicialização Automática**: Auto-inicialização quando DOM está pronto
- **Comunicação com Sistema**: Recebe dados do sistema principal via `window.moduleUserData`

## 🚀 Como Usar

### Para Super Admin
1. **Acesse o menu** "Gestão do Sistema" no sidebar
2. **Gerencie Unidades**: Aba "Unidades" - criar, editar, excluir
3. **Gerencie Administradores**: Aba "Administradores" - criar admins e associar a unidades
4. **Configure Módulos**: Aba "Módulos por Unidade" - liberar/restringir módulos

### Fluxo Recomendado
1. **Criar Unidades** primeiro
2. **Criar Administradores** e associar às unidades
3. **Configurar Módulos** disponíveis para cada unidade
4. **Monitorar Estatísticas** no dashboard

## 🔍 Troubleshooting

### Problemas Comuns
- **Acesso Negado**: Verificar se usuário tem role `super_admin`
- **Módulo não carrega**: Verificar console para erros JavaScript
- **Dados não salvam**: Verificar permissões RLS no Supabase

### Logs
- Todos os logs são prefixados com emoji para fácil identificação
- Erros são logados no console com detalhes completos
- Sucessos são notificados visualmente ao usuário

## 📊 Performance
- **Cache Inteligente**: Dados carregados são mantidos em memória
- **Queries Otimizadas**: Joins eficientes para reduzir chamadas ao banco
- **Loading States**: Indicadores visuais durante operações

---

**Módulo implementado com sucesso! ✅**

*Este é um módulo crítico do sistema - sempre teste as funcionalidades em ambiente de desenvolvimento antes de usar em produção.*
