```instructions
---
applyTo: '**'
---

# 🎯 DromeFlow MVP - Instruções de Desenvolvimento

## 📋 Contexto do Projeto

O **DromeFlow MVP** é um sistema de gestão modular em arquivo único (HTML + CSS + JavaScript) que combina:
- **Frontend**: HTML5, CSS3, JavaScript ES6+ com Tailwind CSS
- **Backend**: Supabase (PostgreSQL + API REST)
- **Arquitetura**: Sistema modular com carregamento dinâmico
- **Tema**: Dark/Light mode com persistência
- **Autenticação**: Sistema de roles (super_admin, admin, user)

### 🏗️ Estrutura Modular Atual:
```
DromeFlow-MVP/
├── index.html (Sistema base + login + módulos)
├── modules/ (Templates HTML dos módulos)
│   ├── gestao-sistema.html ✅ IMPLEMENTADO
│   ├── dashboard.html ✅ IMPLEMENTADO  
│   ├── clientes.html ⏳ PENDENTE
│   ├── agenda.html ⏳ PENDENTE
│   ├── pos-venda.html ⏳ PENDENTE
│   └── recrutamento.html ⏳ PENDENTE
├── js/modules/ (Lógica JavaScript dos módulos)
│   ├── gestao-sistema.js ✅ IMPLEMENTADO
│   ├── dashboard.js ✅ IMPLEMENTADO
│   └── [outros].js ⏳ PENDENTES
└── database/ (Estrutura SQL + dados)
```

## 🎨 Diretrizes de UX/UI e Acessibilidade

### Layout Responsivo:
- **Mobile First**: Breakpoints em 768px, 1024px, 1440px
- **Sidebar Colapsível**: Automático em mobile (<768px)
- **Cards/Tabelas**: Padding responsivo usando `--spacing-*`
- **Modais**: Max-width 90vw em mobile, centrados com scroll

### Esquema de Cores (Variáveis CSS):
```css
/* Light Mode */
--accent-primary: #ac009e     /* Magenta principal */
--accent-secondary: #fd24a0   /* Pink secundário */
--success-color: #70e000      /* Verde sucesso */
--warning-color: #f88f0b      /* Laranja aviso */
--danger-color: #ef476f       /* Vermelho perigo */

/* Dark Mode (body.dark) */
--accent-primary: #fd24a0     /* Pink principal */
--accent-secondary: #ac009e   /* Magenta secundário */

/* Fundos */
--bg-primary: #f8fafc (light) / #010d32 (dark)
--bg-secondary: #ffffff (light) / #0b1a4c (dark)
--bg-tertiary: #f1f5f9 (light) / #11225a (dark)

/* Textos */
--text-primary: #1e293b (light) / #fffafa (dark)
--text-secondary: #64748b (light) / #a3aed0 (dark)
```

### Acessibilidade (WCAG AA):
- **Contraste**: Mínimo 4.5:1 para textos normais, 3:1 para textos grandes
- **ARIA Labels**: Obrigatórios em elementos interativos
- **Foco Visual**: `--focus-ring: rgba(172, 0, 158, 0.15)`
- **Hierarquia**: H1 único, H2-H6 em ordem sequencial
- **Semântica**: `<main>`, `<section>`, `<nav>`, `<header>`

## 🔧 Padrões de Desenvolvimento

### Estrutura HTML de Módulos:
```html
<div class="module-container">
    <!-- Para módulos sem submenus -->
    <header class="header">
        <div class="header-main">
            <h1 class="header-title">
                <i class="fas fa-icon"></i>
                Nome do Módulo
            </h1>
        </div>
    </header>
    
    <!-- Para módulos com navegação hierárquica (sem header interno) -->
    <main class="module-content">
        <!-- Seções navegáveis via sidebar -->
        <section id="modulo-secao1" class="module-section active">
            <!-- Conteúdo da seção 1 -->
        </section>
        
        <section id="modulo-secao2" class="module-section hidden">
            <!-- Conteúdo da seção 2 -->
        </section>
    </main>
</div>
```

### Sistema de Navegação Hierárquica:
- **Header Principal**: Título atualizado automaticamente para "Menu - Submenu"
- **Submenus**: Navegação via sidebar integrada ao sistema principal
- **Funções de Controle**:
  - `updateDashboardHeader(submenu)` - Atualiza título no header principal
  - `clearHeaderSubmenu()` - Limpa submenu ao trocar de módulo
  - `loadDashboardSubmenu(submenu)` - Carrega conteúdo da seção específica

### Padrão JavaScript de Módulos:
```javascript
window.NomeModulo = {
    // Dados globais do módulo
    data: {
        supabase: null,
        currentUser: null,
        userUnits: []
    },

    // Inicialização do módulo
    async init() {
        console.log('[NomeModulo] Inicializando...');
        this.setupData();
        await this.loadData();
        this.setupEventListeners();
    },

    // Configurar dados do usuário
    setupData() {
        const userData = window.moduleUserData;
        this.data.supabase = userData.supabase;
        this.data.currentUser = userData.currentUser;
        this.data.userUnits = userData.userUnits;
    },

    // Carregar dados do Supabase
    async loadData() {
        try {
            // Implementar carregamento específico
        } catch (error) {
            console.error('[NomeModulo] Erro ao carregar dados:', error);
        }
    },

    // Event listeners
    setupEventListeners() {
        // Implementar eventos específicos
    },

    // Para módulos com submenus (opcional)
    loadSubmenu(submenu) {
        // Ocultar todas as seções
        document.querySelectorAll('.module-section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });
        
        // Mostrar seção específica
        const targetSection = document.getElementById(`modulo-${submenu}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            
            // Atualizar título no header principal
            this.updateModuleHeader(submenu);
        }
    },

    // Atualizar header principal (para módulos hierárquicos)
    updateModuleHeader(submenu) {
        const pageTitle = document.getElementById('pageTitle');
        const configs = {
            secao1: 'Nome da Seção 1',
            secao2: 'Nome da Seção 2'
        };
        
        if (pageTitle && configs[submenu]) {
            pageTitle.textContent = `Nome do Módulo - ${configs[submenu]}`;
        }
    }
};
```

### Sistema de Modais:
```javascript
// Abrir modal
function openModal(modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    // Foco no primeiro elemento focável
}

// Fechar modal
function closeModal(modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}
```

## 🗄️ Integração com Banco de Dados

### Tabelas Principais:
- **`users`**: Usuários do sistema
- **`roles`**: Permissões (super_admin, admin, user)
- **`units`**: Unidades/empresas
- **`modules`**: Módulos disponíveis
- **`resultados`**: Dados de atendimentos (principal)

### Padrão de Consultas:
```javascript
// Carregar dados filtrados por unidade do usuário
async loadModuleData() {
    const { data, error } = await this.data.supabase
        .from('tabela_nome')
        .select('*')
        .in('unit_id', this.data.userUnits.map(u => u.id))
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error('Erro ao carregar dados:', error);
        return [];
    }
    
    return data;
}
```

## ⚡ Otimizações de Performance

### CSS:
- **Variáveis CSS**: Usar `--var-name` para cores e espaçamentos
- **Classes Utilitárias**: Preferir classes reutilizáveis
- **Especificidade**: Evitar `!important`, usar seletores específicos
- **Animações**: `transition` com `cubic-bezier` para suavidade

### JavaScript:
- **Event Delegation**: Para elementos dinâmicos
- **Debounce**: Para filtros e buscas (300ms)
- **Loading States**: Feedback visual durante carregamentos
- **Error Handling**: Try/catch em todas as operações async

### Banco de Dados:
- **Índices**: Em colunas de filtro frequente
- **Paginação**: Para tabelas com muitos dados
- **Filtros por Unidade**: Sempre filtrar por unidades do usuário

## 🔄 Fluxo de Criação de Novos Módulos

### 1. Planejamento:
- Definir funcionalidades principais
- Identificar tabelas Supabase necessárias
- Planejar interface e componentes

### 2. Estrutura Base:
```bash
# Copiar templates
cp modules/_template-base.html modules/[nome-modulo].html
cp js/modules/_template-base.js js/modules/[nome-modulo].js
```

### 3. Desenvolvimento:
- Adaptar HTML com componentes específicos
- Implementar JavaScript seguindo padrões
- Integrar com Supabase usando filtros de unidade
- Testar responsividade e acessibilidade

### 4. Ativação:
```sql
-- Ativar módulo no banco
UPDATE modules 
SET is_active = true 
WHERE name = 'nome-modulo';
```

## 🛠️ Ferramentas de Debug

### Funções Globais (Console):
```javascript
debugGestaoSistema()    // Debug módulo gestão
debugDashboard()        // Debug dashboard  
debugModuleSystem()     // Debug sistema modular
debugUserUnits()        // Debug usuários/unidades
```

### Logs Padronizados:
```javascript
console.log('[NomeModulo] Ação realizada:', data);
console.error('[NomeModulo] Erro capturado:', error);
console.warn('[NomeModulo] Aviso importante:', info);
```

## 📱 Responsividade Crítica

### Breakpoints:
- **Mobile**: < 768px (sidebar colapsada, modais full-width)
- **Tablet**: 768px - 1024px (sidebar visível, cards adaptados)
- **Desktop**: > 1024px (layout completo)

### Elementos Críticos:
- **Sidebar**: Toggle automático em mobile
- **Modais**: Scroll vertical quando necessário
- **Tabelas**: Scroll horizontal com sombras de gradiente
- **Forms**: Labels acima dos inputs em mobile

## 🎯 Prioridades por Módulo

### Essenciais (Implementados):
- ✅ **Sistema Base**: Login, navegação, temas
- ✅ **Gestão Sistema**: CRUD unidades/usuários (Super Admin)
- ✅ **Dashboard**: Métricas e KPIs principais com navegação hierárquica
- ✅ **Navegação Hierárquica**: Sistema de submenus integrado ao header principal

### Próximos (Por Prioridade):
1. **Clientes**: CRUD + classificação automática
2. **Agenda**: Calendário + agendamentos
3. **Pós-venda**: Follow-up + satisfação
4. **Recrutamento**: Candidatos + processos seletivos

### Diretrizes para Novos Módulos com Submenus:
- **Remover headers internos**: Evitar duplicação de títulos
- **Usar header principal**: Título dinâmico "Menu - Submenu"
- **Seções limpas**: Focar no conteúdo sem elementos redundantes
- **Navegação sidebar**: Integrar submenus ao sistema principal
- **Responsividade**: Manter compatibilidade em todos os dispositivos

---

**💡 Lembre-se**: Este é um MVP em arquivo único. Mantenha as mudanças focadas, preserve toda a funcionalidade existente e priorize correções que tragam maior impacto com menor alteração de código.
```