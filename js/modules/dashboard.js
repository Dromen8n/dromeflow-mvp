// Dashboard Module JavaScript
// Sistema completo de dashboard com carregamento de dados da tabela 'resultados'

console.log('📊 Dashboard JavaScript carregado');

// Objeto dashboard com funcionalidades completas
window.dashboardModule = {
    data: {
        resultados: [],
        clientes: [],
        filtros: {}
    },
    
    init: function() {
        console.log('✅ Dashboard module inicializado');
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        // Listeners para filtros de clientes (tabs)
        this.setupClientFilterTabs();
    },
    
    setupClientFilterTabs: function() {
        // Configurar filtros de clientes na aba Clientes
        const filterCards = document.querySelectorAll('.client-filter-card');
        
        filterCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remover active de todos os cards
                filterCards.forEach(c => c.classList.remove('active'));
                
                // Adicionar active ao card clicado
                card.classList.add('active');
                
                // Determinar qual tabela mostrar
                const cardId = card.id;
                let tableToShow = '';
                
                switch (cardId) {
                    case 'btn-clientes-total':
                        tableToShow = 'tabela-clientes-ativos-wrapper';
                        break;
                    case 'btn-clientes-recorrentes':
                        tableToShow = 'tabela-clientes-recorrentes-wrapper';
                        break;
                    case 'btn-clientes-atencao':
                        tableToShow = 'tabela-clientes-atencao-wrapper';
                        break;
                    default:
                        tableToShow = 'tabela-clientes-ativos-wrapper';
                }
                
                // Ocultar todas as tabelas
                const allTables = document.querySelectorAll('#clientes-tabelas .chart-container-card');
                allTables.forEach(table => {
                    table.style.display = 'none';
                });
                
                // Mostrar tabela selecionada
                const selectedTable = document.getElementById(tableToShow);
                if (selectedTable) {
                    selectedTable.style.display = 'block';
                }
            });
        });
    }
};

// Funcionalidade para tabs do dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Configurar navegação por abas apenas se estivermos no dashboard
    setTimeout(() => {
        const tabFilters = document.querySelectorAll('.tab-filter');
        const tabContents = document.querySelectorAll('.tab-content-section');
        
        if (tabFilters.length > 0 && tabContents.length > 0) {
            tabFilters.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.dataset.tab;
                    
                    // Remover active de todas as abas
                    tabFilters.forEach(t => t.classList.remove('active'));
                    
                    // Adicionar active à aba clicada
                    tab.classList.add('active');
                    
                    // Ocultar todo o conteúdo
                    tabContents.forEach(content => {
                        content.classList.add('hidden');
                    });
                    
                    // Mostrar conteúdo da aba selecionada
                    const targetContent = document.getElementById(`tab-content-${targetTab}`);
                    if (targetContent) {
                        targetContent.classList.remove('hidden');
                    }
                });
            });
        }
    }, 500);
});

window.fecharModalEditarCliente = function() {
    const modal = document.getElementById('editClientModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
};

console.log('✅ Dashboard JavaScript configurado com sucesso');
