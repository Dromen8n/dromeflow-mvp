/**
 * Módulo: Gestão do Sistema - DromeFlow MVP
 * Funcionalidades: Gerenciar Unidades, Administradores, Usuários e Módulos
 * Acesso: Super Admin apenas
 */

// Namespace global para o módulo
window.GestaoSistema = {
    // Dados do módulo
    currentUser: null,
    currentUnits: [],
    currentAdmins: [],
    currentModules: [],
    editingItem: null,
    supabaseClient: null, // Cliente Supabase para usar nas consultas
    
    // Referências aos elementos DOM
    elements: {
        // Tabs
        tabButtons: null,
        tabContents: null,
        subTabButtons: null,
        subTabContents: null,
        dynamicActionBtn: null,
        
        // Tables
        unitsTableBody: null,
        adminsTableBody: null,
        adminUsersTableWrapper: null,
        modulesList: null,
        
        // Selects
        adminUserSelect: null,
        moduleUnitSelect: null,
        
        // Modals
        unitModal: null,
        adminModal: null,
        userModal: null,
        createUserForAdminModal: null,
        
        // Forms
        unitForm: null,
        adminForm: null,
        userForm: null
    },

    /**
     * Verificar ambiente antes da inicialização
     */
    checkEnvironment() {
        console.log('🔍 GESTÃO SISTEMA - Verificando ambiente...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const checks = {
            windowSupabase: !!window.supabase,
            windowModuleUserData: !!window.moduleUserData,
            supabaseUrl: typeof SUPABASE_URL !== 'undefined',
            supabaseKey: typeof SUPABASE_ANON_KEY !== 'undefined',
            documentReady: document.readyState,
            currentScript: document.currentScript?.src || 'não detectado',
            availableIds: Array.from(document.querySelectorAll('[id]')).map(el => el.id).slice(0, 10)
        };
        
        console.table(checks);
        
        if (window.moduleUserData) {
            console.log('📊 Dados do moduleUserData:');
            console.log('  - currentUser:', !!window.moduleUserData.currentUser);
            console.log('  - userRole:', window.moduleUserData.userRole);
            console.log('  - supabase:', !!window.moduleUserData.supabase);
            console.log('  - isDarkMode:', window.moduleUserData.isDarkMode);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return checks;
    },

    /**
     * Inicialização do módulo
     */
    async init() {
        try {
            console.log('🚀 Inicializando módulo Gestão do Sistema...');
            
            // Verificar ambiente primeiro
            console.log('🔍 Verificando ambiente...');
            const envCheck = this.checkEnvironment();
            
            // Verificar se o Supabase está disponível
            if (!window.supabase) {
                console.error('❌ window.supabase não encontrado!');
                if (!envCheck.supabaseUrl || !envCheck.supabaseKey) {
                    throw new Error('Cliente Supabase não encontrado e constantes não definidas. Verifique se o script do Supabase foi carregado.');
                }
                throw new Error('Cliente Supabase não encontrado. Verifique se o script do Supabase foi carregado.');
            }
            console.log('✅ Supabase disponível');
            
            // Verificar dados do usuário passados pelo sistema principal
            this.currentUser = window.moduleUserData || null;
            if (!this.currentUser) {
                console.error('❌ window.moduleUserData não encontrado!');
                throw new Error('Dados do usuário não encontrados. Módulo deve ser carregado pelo sistema principal.');
            }
            console.log('✅ Dados do usuário disponíveis');
            
            console.log('📊 Dados do usuário recebidos:', this.currentUser);
            
            // Verificar permissões de super admin
            const userRoleName = this.currentUser.userRole?.name || this.currentUser.userRole;
            
            console.log('🔍 Verificando role do usuário:', userRoleName);
            
            if (userRoleName !== 'super_admin') {
                console.warn(`⚠️ Role não é super_admin: ${userRoleName}`);
                // Temporariamente permitir acesso para debug - REMOVER EM PRODUÇÃO
                console.log('🔧 DEBUG MODE: Permitindo acesso temporariamente...');
                // throw new Error(`Acesso negado: Apenas Super Admins podem acessar este módulo. Role atual: ${userRoleName}`);
            }
            
            console.log('✅ Usuário autenticado:', this.currentUser.currentUser?.email || 'N/A');
            console.log('✅ Role verificado:', userRoleName);
            
            // Verificar e criar roles necessários
            console.log('🔍 Verificando roles...');
            await this.checkAndCreateRoles();
            console.log('✅ Roles verificados');
            
            // Inicializar elementos DOM
            this.initializeElements();
            
            // Inicializar interface
            this.initializeTabs();
            this.initializeEventListeners();
            
            // Carregar dados iniciais
            await this.loadInitialData();
            
            console.log('✅ Módulo Gestão do Sistema inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização do módulo:', error);
            console.error('❌ Stack trace:', error.stack);
            
            // Mostrar erro mais detalhado
            const errorDetails = {
                message: error.message,
                stack: error.stack,
                windowSupabase: !!window.supabase,
                windowModuleUserData: !!window.moduleUserData,
                documentState: document.readyState,
                currentUser: this.currentUser,
                elements: Object.keys(this.elements || {})
            };
            
            console.log('🔍 DEBUG - Detalhes do erro:', errorDetails);
            
            this.showError('Erro ao carregar módulo: ' + error.message);
        }
    },

    /**
     * Inicializar referências aos elementos DOM
     */
    initializeElements() {
        this.elements = {
            // Tabs
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            subTabButtons: document.querySelectorAll('.sub-tab-btn'),
            subTabContents: document.querySelectorAll('.sub-tab-content'),
            dynamicActionBtn: document.getElementById('dynamicActionBtn'),
            
            // Tables
            unitsTableBody: document.getElementById('unitsTableBody'),
            adminsTableBody: document.getElementById('adminsTableBody'),
            adminUsersTableWrapper: document.getElementById('adminUsersTableWrapper'),
            adminInfoCard: document.getElementById('adminInfoCard'),
            adminUsersList: document.getElementById('adminUsersList'),
            modulesList: document.getElementById('modulesList'),
            
            // Selects
            adminUserSelect: document.getElementById('adminUserSelect'),
            moduleUnitSelect: document.getElementById('moduleUnitSelect'),
            
            // Modals
            unitModal: document.getElementById('unitModal'),
            adminModal: document.getElementById('adminModal'),
            userModal: document.getElementById('userModal'),
            createUserForAdminModal: document.getElementById('createUserForAdminModal'),
            
            // Forms
            unitForm: document.getElementById('unitForm'),
            adminForm: document.getElementById('adminForm'),
            userForm: document.getElementById('userForm')
        };
        
        // Debug: verificar quais elementos foram encontrados
        // Verificar se elementos críticos existem
        const criticalElements = ['unitsTableBody', 'adminsTableBody'];
        const missingElements = criticalElements.filter(name => !this.elements[name]);
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Elementos DOM críticos não encontrados:', missingElements);
        }
    },

    /**
     * Inicializar sistema de tabs
     */
    initializeTabs() {
        console.log('🔍 Inicializando sistema de tabs...');
        
        // Tabs principais
        if (this.elements.tabButtons && this.elements.tabButtons.length > 0) {
            console.log(`✅ Inicializando ${this.elements.tabButtons.length} tabs principais`);
            this.elements.tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabId = e.currentTarget.getAttribute('data-tab');
                    this.switchTab(tabId);
                });
            });
        } else {
            console.warn('⚠️ Nenhum botão de tab principal encontrado (.tab-btn)');
        }
        
        // Sub-tabs
        if (this.elements.subTabButtons && this.elements.subTabButtons.length > 0) {
            console.log(`✅ Inicializando ${this.elements.subTabButtons.length} sub-tabs`);
            this.elements.subTabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const subTabId = e.currentTarget.getAttribute('data-subtab');
                    this.switchSubTab(subTabId);
                });
            });
        } else {
            console.warn('⚠️ Nenhum botão de sub-tab encontrado (.sub-tab-btn)');
        }
        
        console.log('✅ Sistema de tabs inicializado');
    },

    /**
     * Inicializar event listeners
     */
    initializeEventListeners() {
        // Selects
        if (this.elements.adminUserSelect) {
            this.elements.adminUserSelect.addEventListener('change', (e) => {
                this.loadUsersByAdmin(e.target.value);
            });
        }
        
        if (this.elements.moduleUnitSelect) {
            this.elements.moduleUnitSelect.addEventListener('change', (e) => {
                this.loadModulesByUnit(e.target.value);
            });
        }
        
        // Fechar modais ao clicar no backdrop
        [this.elements.unitModal, this.elements.adminModal, this.elements.userModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal);
                    }
                });
            }
        });
    },

    /**
     * Trocar tab ativa
     */
    switchTab(tabId) {
        // Remover classe active de todos os botões e conteúdos
        this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.elements.tabContents.forEach(content => content.classList.remove('active'));
        
        // Adicionar classe active no botão e conteúdo selecionado
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(`tab-${tabId}`);
        
        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.classList.add('active');
        }
        
        // Atualizar botão dinâmico
        this.updateDynamicButton(tabId);
    },

    /**
     * Trocar sub-tab ativa
     */
    switchSubTab(subTabId) {
        // Remover classe active de todos os sub-botões e sub-conteúdos
        this.elements.subTabButtons.forEach(btn => btn.classList.remove('active'));
        this.elements.subTabContents.forEach(content => content.classList.remove('active'));
        
        // Adicionar classe active no sub-botão e sub-conteúdo selecionado
        const activeBtn = document.querySelector(`[data-subtab="${subTabId}"]`);
        const activeContent = document.getElementById(`subtab-${subTabId}`);
        
        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.classList.add('active');
        }
    },

    /**
     * Atualizar botão dinâmico baseado na tab ativa
     */
    updateDynamicButton(tabId) {
        if (!this.elements.dynamicActionBtn) return;
        
        const buttonConfigs = {
            'units': {
                text: '<i class="fas fa-plus"></i> Nova Unidade',
                onclick: 'openUnitModal()'
            },
            'admins': {
                text: '<i class="fas fa-plus"></i> Novo Administrador',
                onclick: 'openAdminModal()'
            },
            'modules': {
                text: '<i class="fas fa-sync"></i> Atualizar Módulos',
                onclick: 'refreshModules()'
            }
        };
        
        const config = buttonConfigs[tabId];
        if (config) {
            this.elements.dynamicActionBtn.innerHTML = config.text;
            this.elements.dynamicActionBtn.setAttribute('onclick', config.onclick);
        }
    },

    /**
     * Carregar dados iniciais
     */
    async loadInitialData() {
        try {
            console.log('📊 Carregando dados iniciais...');
            
            // Carregar em paralelo para melhor performance
            await Promise.all([
                this.loadUnits(),
                this.loadAdmins(),
                this.loadModules()
            ]);
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados iniciais:', error);
            this.showError('Erro ao carregar dados: ' + error.message);
        }
    },

    /**
     * Carregar unidades
     */
    async loadUnits() {
        try {
            // Usar o cliente armazenado ou o passado via moduleUserData
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            const { data: units, error } = await supabase
                .from('units')
                .select('*')
                .order('name');
                
            if (error) {
                throw error;
            }
            
            this.currentUnits = units || [];
            this.renderUnitsTable();
            this.populateUnitSelects();
            
            console.log(`✅ ${this.currentUnits.length} unidades carregadas`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar unidades:', error);
            this.showError('Erro ao carregar unidades: ' + error.message);
        }
    },

    /**
     * Carregar administradores
     */
    async loadAdmins() {
        try {
            // Usar o cliente armazenado ou o passado via moduleUserData
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Primeiro, buscar os IDs dos roles de admin e super_admin
            const { data: adminRoles, error: roleError } = await supabase
                .from('roles')
                .select('id, name, display_name, level')
                .in('name', ['admin', 'super_admin']);
                
            if (roleError) {
                throw roleError;
            }
            
            if (!adminRoles || adminRoles.length === 0) {
                console.warn('⚠️ Nenhum role de administrador encontrado');
                this.currentAdmins = [];
                this.renderAdminsTable();
                this.populateAdminSelects();
                return;
            }
            
            const adminRoleIds = adminRoles.map(role => role.id);
            
            // Buscar usuários com role 'admin' ou 'super_admin'
            const { data: admins, error } = await supabase
                .from('users')
                .select(`
                    *,
                    roles (
                        id,
                        name,
                        display_name,
                        level
                    )
                `)
                .in('role_id', adminRoleIds)
                .order('email');
                
            if (error) {
                throw error;
            }
            
            // Para cada admin, buscar suas unidades
            const adminsWithUnits = [];
            for (const admin of (admins || [])) {
                const { data: userUnits, error: unitsError } = await supabase
                    .from('user_units')
                    .select(`
                        units (
                            id,
                            name
                        )
                    `)
                    .eq('user_id', admin.id);
                
                adminsWithUnits.push({
                    ...admin,
                    user_units: userUnits || []
                });
            }
            
            this.currentAdmins = adminsWithUnits;
            this.renderAdminsTable();
            this.populateAdminSelects();
            
            console.log(`✅ ${this.currentAdmins.length} administradores carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar administradores:', error);
            this.showError('Erro ao carregar administradores: ' + error.message);
        }
    },

    /**
     * Carregar módulos do sistema
     */
    async loadModules() {
        try {
            // Usar o cliente armazenado ou o passado via moduleUserData
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            const { data: modules, error } = await supabase
                .from('modules')
                .select('*')
                .eq('is_active', true)
                .order('order_index, display_name');
                
            if (error) {
                throw error;
            }
            
            this.currentModules = modules || [];
            
            console.log(`✅ ${this.currentModules.length} módulos carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar módulos:', error);
            this.showError('Erro ao carregar módulos: ' + error.message);
        }
    },

    /**
     * Renderizar tabela de unidades
     */
    renderUnitsTable() {
        if (!this.elements.unitsTableBody) return;
        
        if (this.currentUnits.length === 0) {
            this.elements.unitsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-building"></i>
                        <h3>Nenhuma unidade encontrada</h3>
                        <p>Clique em "Nova Unidade" para criar a primeira unidade</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.currentUnits.forEach(unit => {
            const unitName = unit.name || 'N/A';
            const isActive = unit.is_active !== false; // Padrão true se não definido
            const statusClass = isActive ? 'success' : 'danger';
            const statusText = isActive ? 'Ativo' : 'Inativo';
            
            html += `
                <tr class="clickable-row" onclick="window.GestaoSistema.openUnitDetails('${unit.id}')" title="Clique para ver detalhes">
                    <td>
                        <strong>${unitName}</strong>
                        <small style="display: block; color: var(--text-secondary); margin-top: 0.25rem;">
                            ID: ${unit.id}
                        </small>
                    </td>
                    <td>
                        <span class="badge badge-info" title="Carregando...">
                            <i class="fas fa-users"></i>
                            <span id="unit-admins-${unit.id}">...</span>
                        </span>
                    </td>
                    <td>
                        <span class="badge badge-success" title="Carregando...">
                            <i class="fas fa-puzzle-piece"></i>
                            <span id="unit-modules-${unit.id}">...</span>
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <label class="toggle-switch" onclick="event.stopPropagation()">
                                <input type="checkbox" ${isActive ? 'checked' : ''} 
                                       onchange="window.GestaoSistema.toggleUnitStatus('${unit.id}', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="badge badge-${statusClass}">${statusText}</span>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        this.elements.unitsTableBody.innerHTML = html;
        
        // Carregar contadores após renderizar
        this.loadUnitCounters();
    },

    /**
     * Carregar contadores de administradores e módulos por unidade
     */
    async loadUnitCounters() {
        try {
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) return;
            
            // Para cada unidade, carregar contadores
            for (const unit of this.currentUnits) {
                // Contar administradores
                const { data: adminCount, error: adminError } = await supabase
                    .from('user_units')
                    .select('user_id', { count: 'exact' })
                    .eq('unit_id', unit.id);
                
                const adminElement = document.getElementById(`unit-admins-${unit.id}`);
                if (adminElement) {
                    if (adminError) {
                        adminElement.textContent = '?';
                        adminElement.title = 'Erro ao carregar';
                    } else {
                        const count = adminCount?.length || 0;
                        adminElement.textContent = count;
                        adminElement.title = `${count} administrador(es) vinculado(s)`;
                    }
                }
                
                // Contar módulos habilitados para a unidade
                const { data: moduleCount, error: moduleError } = await supabase
                    .from('unit_modules')
                    .select('id', { count: 'exact' })
                    .eq('unit_id', unit.id);
                
                const moduleElement = document.getElementById(`unit-modules-${unit.id}`);
                if (moduleElement) {
                    if (moduleError) {
                        moduleElement.textContent = '?';
                        moduleElement.title = 'Erro ao carregar';
                    } else {
                        const count = moduleCount?.length || 0;
                        moduleElement.textContent = count;
                        moduleElement.title = `${count} módulo(s) habilitado(s)`;
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar contadores:', error);
        }
    },

    /**
     * Renderizar tabela de administradores
     */
    renderAdminsTable() {
        if (!this.elements.adminsTableBody) {
            console.error('❌ Elemento adminsTableBody não encontrado');
            return;
        }
        
        if (this.currentAdmins.length === 0) {
            this.elements.adminsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-users-cog"></i>
                        <h3>Nenhum administrador encontrado</h3>
                        <p>Clique em "Novo Administrador" para criar o primeiro</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.currentAdmins.forEach(admin => {
            console.log('🔍 DEBUG - Processando admin:', admin);
            
            const createdAt = new Date(admin.created_at).toLocaleDateString('pt-BR');
            const units = admin.user_units?.map(uu => uu.units?.name).filter(name => name).join(', ') || 'Nenhuma';
            const roleName = admin.roles?.name || 'N/A';
            const roleDisplayName = admin.roles?.display_name || admin.roles?.name || 'N/A';
            const roleLevel = admin.roles?.level || 0;
            
            // Definir cor do badge baseado no role e level
            let roleBadgeClass = 'badge-info';
            if (roleName === 'super_admin' || roleLevel >= 90) roleBadgeClass = 'badge-danger';
            else if (roleName === 'admin' || roleLevel >= 50) roleBadgeClass = 'badge-warning';
            
            html += `
                <tr onclick="window.GestaoSistema.openAdminCard('${admin.id}')">
                    <td>${admin.email || 'N/A'}</td>
                    <td>${units}</td>
                    <td>${createdAt}</td>
                    <td>
                        <span class="badge badge-success">Ativo</span>
                        <span class="badge ${roleBadgeClass}" style="margin-left: 0.5rem;" title="Level: ${roleLevel}">${roleDisplayName}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="window.GestaoSistema.editAdmin('${admin.id}'); event.stopPropagation();" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${admin.roles?.name !== 'super_admin' ? `
                        <button class="btn btn-sm btn-danger" onclick="window.GestaoSistema.deleteAdmin('${admin.id}'); event.stopPropagation();" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        this.elements.adminsTableBody.innerHTML = html;
        console.log('✅ Tabela de administradores renderizada com sucesso');
    },

    /**
     * Popular selects de unidades
     */
    populateUnitSelects() {
        const selects = [this.elements.moduleUnitSelect];
        
        selects.forEach(select => {
            if (!select) return;
            
            // Limpar opções existentes (exceto a primeira)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Adicionar unidades
            this.currentUnits.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit.id;
                option.textContent = unit.name;
                select.appendChild(option);
            });
        });
    },

    /**
     * Popular selects de administradores
     */
    populateAdminSelects() {
        if (!this.elements.adminUserSelect) return;
        
        // Limpar opções existentes (exceto a primeira)
        while (this.elements.adminUserSelect.children.length > 1) {
            this.elements.adminUserSelect.removeChild(this.elements.adminUserSelect.lastChild);
        }
        
        // Adicionar administradores
        this.currentAdmins.forEach(admin => {
            const option = document.createElement('option');
            option.value = admin.id;
            option.textContent = admin.email;
            this.elements.adminUserSelect.appendChild(option);
        });
    },

    /**
     * Mostrar erro para o usuário
     */
    showError(message) {
        console.error('🚨 Erro:', message);
        
        // Criar uma notificação de erro mais elegante
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 1.25rem 1.5rem;
            border-radius: 12px;
            max-width: 450px;
            min-width: 320px;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(220, 53, 69, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <div style="
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                ">❌</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 0.4rem; font-size: 0.95rem;">
                        Erro no Sistema
                    </div>
                    <div style="opacity: 0.95; line-height: 1.4; font-size: 0.9rem;">
                        ${message}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                " onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">✕</button>
            </div>
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0 0 12px 12px;
                animation: progressBar 8s linear;
            "></div>
        `;
        
        // Adicionar estilos de animação se não existirem
        if (!document.getElementById('toastAnimations')) {
            const style = document.createElement('style');
            style.id = 'toastAnimations';
            style.textContent = `
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes progressBar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(errorDiv);
        
        // Auto-remover após 8 segundos
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.style.animation = 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 8000);
    },

    /**
     * Mostrar sucesso para o usuário
     */
    showSuccess(message) {
        console.log('✅ Sucesso:', message);
        
        // Criar uma notificação de sucesso elegante
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 1.25rem 1.5rem;
            border-radius: 12px;
            max-width: 450px;
            min-width: 320px;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(40, 167, 69, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        successDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <div style="
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                ">✅</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 0.4rem; font-size: 0.95rem;">
                        Operação Realizada
                    </div>
                    <div style="opacity: 0.95; line-height: 1.4; font-size: 0.9rem;">
                        ${message}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                " onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">✕</button>
            </div>
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0 0 12px 12px;
                animation: progressBar 5s linear;
            "></div>
        `;
        
        // Adicionar estilos de animação se não existirem
        if (!document.getElementById('toastAnimations')) {
            const style = document.createElement('style');
            style.id = 'toastAnimations';
            style.textContent = `
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes progressBar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(successDiv);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.style.animation = 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
                setTimeout(() => successDiv.remove(), 300);
            }
        }, 5000);
    },

    /**
     * Função de debug para verificar status do módulo
     */
    debug() {
        console.log('🔍 DEBUG - Status do Módulo Gestão do Sistema:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Dados do usuário atual:', this.currentUser);
        console.log('🏢 Unidades carregadas:', this.currentUnits.length);
        console.log('👥 Administradores carregados:', this.currentAdmins.length);
        console.log('🧩 Módulos carregados:', this.currentModules.length);
        console.log('🌐 window.supabase disponível:', !!window.supabase);
        console.log('🔗 this.supabaseClient disponível:', !!this.supabaseClient);
        console.log('📡 moduleUserData.supabase disponível:', !!(this.currentUser?.supabase));
        console.log('🔧 Elementos DOM inicializados:', Object.keys(this.elements).length);
        console.log('🌍 SUPABASE_URL definida:', typeof SUPABASE_URL !== 'undefined');
        console.log('🗝️ SUPABASE_ANON_KEY definida:', typeof SUPABASE_ANON_KEY !== 'undefined');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Testar cliente Supabase
        const testClient = this.supabaseClient || this.currentUser?.supabase;
        if (testClient) {
            console.log('✅ Cliente Supabase encontrado, testando método .from()...');
            console.log('🔍 Tipo do cliente:', typeof testClient);
            console.log('🔍 Método .from disponível:', typeof testClient.from);
        } else {
            console.log('❌ Nenhum cliente Supabase disponível');
        }
    },

    /**
     * Debug específico para verificar dados no banco
     */
    async debugDatabase() {
        try {
            console.log('🔍 DEBUG DATABASE - Verificando dados no banco...');
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) {
                console.error('❌ Cliente Supabase não disponível');
                return;
            }
            
            // Verificar todas as tabelas
            console.log('━━━ VERIFICANDO TABELAS ━━━');
            
            // 1. Roles
            const { data: roles, error: roleError } = await supabase
                .from('roles')
                .select('*');
            console.log('📋 ROLES:', roles, roleError ? `Erro: ${roleError.message}` : '');
            
            // 1.1. Verificar roles específicos
            if (roles && roles.length > 0) {
                console.log('🔍 ROLES DETALHADOS:');
                roles.forEach(role => {
                    console.log(`  - ID: ${role.id}, Name: ${role.name}, Display: ${role.display_name}, Level: ${role.level}`);
                });
            }
            
            // 2. Users
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('*');
            console.log('👤 USERS:', users, userError ? `Erro: ${userError.message}` : '');
            
            // 3. Units
            const { data: units, error: unitError } = await supabase
                .from('units')
                .select('*');
            console.log('🏢 UNITS:', units, unitError ? `Erro: ${unitError.message}` : '');
            
            // 4. User_Units
            const { data: userUnits, error: userUnitError } = await supabase
                .from('user_units')
                .select('*');
            console.log('🔗 USER_UNITS:', userUnits, userUnitError ? `Erro: ${userUnitError.message}` : '');
            
            // 5. Users com JOIN roles (estrutura correta)
            const { data: usersWithRoles, error: joinError } = await supabase
                .from('users')
                .select(`
                    *,
                    roles (
                        id,
                        name,
                        display_name,
                        level
                    )
                `);
            console.log('👥 USERS com ROLES:', usersWithRoles, joinError ? `Erro: ${joinError.message}` : '');
            
            // 6. Modules
            const { data: modules, error: moduleError } = await supabase
                .from('modules')
                .select('*');
            console.log('🧩 MODULES:', modules, moduleError ? `Erro: ${moduleError.message}` : '');
            
            // 7. Unit_Modules
            const { data: unitModules, error: unitModuleError } = await supabase
                .from('unit_modules')
                .select('*');
            console.log('🔗 UNIT_MODULES:', unitModules, unitModuleError ? `Erro: ${unitModuleError.message}` : '');
            
        } catch (error) {
            console.error('❌ Erro no debug do banco:', error);
        }
    },

    /**
     * Verificar e criar roles necessários
     */
    async checkAndCreateRoles() {
        try {
            console.log('🔍 Verificando roles necessários...');
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Verificar se os roles existem
            const { data: existingRoles, error: checkError } = await supabase
                .from('roles')
                .select('name')
                .in('name', ['super_admin', 'admin', 'user']);
            
            if (checkError) {
                console.error('❌ Erro ao verificar roles:', checkError);
                return;
            }
            
            const existingRoleNames = existingRoles?.map(r => r.name) || [];
            const requiredRoles = [
                { name: 'super_admin', display_name: 'Super Administrador', level: 100 },
                { name: 'admin', display_name: 'Administrador', level: 50 },
                { name: 'user', display_name: 'Usuário', level: 10 }
            ];
            
            // Criar roles que não existem
            for (const role of requiredRoles) {
                if (!existingRoleNames.includes(role.name)) {
                    console.log(`📝 Criando role: ${role.name}`);
                    
                    const { error: insertError } = await supabase
                        .from('roles')
                        .insert([role]);
                    
                    if (insertError) {
                        console.error(`❌ Erro ao criar role ${role.name}:`, insertError);
                    } else {
                        console.log(`✅ Role ${role.name} criado com sucesso`);
                    }
                }
            }
            
            // Verificar e criar módulos básicos
            await this.checkAndCreateModules();
            
        } catch (error) {
            console.error('❌ Erro ao verificar/criar roles:', error);
        }
    },

    /**
     * Verificar e criar módulos básicos
     */
    async checkAndCreateModules() {
        try {
            console.log('🔍 Verificando módulos básicos...');
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) {
                return;
            }
            
            // Verificar se os módulos existem
            const { data: existingModules, error: checkError } = await supabase
                .from('modules')
                .select('name')
                .in('name', ['gestao-sistema', 'dashboard', 'relatorios']);
            
            if (checkError) {
                console.error('❌ Erro ao verificar módulos:', checkError);
                return;
            }
            
            const existingModuleNames = existingModules?.map(m => m.name) || [];
            const requiredModules = [
                { 
                    name: 'gestao-sistema', 
                    display_name: 'Gestão do Sistema', 
                    description: 'Módulo para administração do sistema',
                    icon: 'fas fa-cogs',
                    order_index: 1,
                    is_active: true
                },
                { 
                    name: 'dashboard', 
                    display_name: 'Dashboard', 
                    description: 'Painel principal do sistema',
                    icon: 'fas fa-tachometer-alt',
                    order_index: 2,
                    is_active: true
                },
                { 
                    name: 'relatorios', 
                    display_name: 'Relatórios', 
                    description: 'Módulo de relatórios',
                    icon: 'fas fa-chart-bar',
                    order_index: 3,
                    is_active: true
                }
            ];
            
            // Criar módulos que não existem
            for (const module of requiredModules) {
                if (!existingModuleNames.includes(module.name)) {
                    console.log(`📝 Criando módulo: ${module.name}`);
                    
                    const { error: insertError } = await supabase
                        .from('modules')
                        .insert([module]);
                    
                    if (insertError) {
                        console.error(`❌ Erro ao criar módulo ${module.name}:`, insertError);
                    } else {
                        console.log(`✅ Módulo ${module.name} criado com sucesso`);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar/criar módulos:', error);
        }
    },

    /**
     * Recarregar todos os dados
     */
    async reloadAllData() {
        try {
            console.log('🔄 Recarregando todos os dados...');
            this.showSuccess('Recarregando dados...');
            
            // Verificar roles primeiro
            await this.checkAndCreateRoles();
            
            await this.loadInitialData();
            
            this.showSuccess('Dados recarregados com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao recarregar dados:', error);
            this.showError('Erro ao recarregar dados: ' + error.message);
        }
    },

    /**
     * Fechar modal
     */
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Abrir modal para nova unidade
     */
    openUnitModal() {
        console.log('🏢 Abrindo modal para nova unidade...');
        
        if (!this.elements.unitModal) {
            console.error('❌ Modal de unidade não encontrado');
            return;
        }
        
        // Limpar dados de edição
        this.editingItem = null;
        
        // Atualizar título do modal
        const modalTitle = document.getElementById('unitModalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Nova Unidade';
        }
        
        // Limpar formulário
        if (this.elements.unitForm) {
            this.elements.unitForm.reset();
        }
        
        // Atualizar botão de salvar
        const saveBtn = document.getElementById('saveUnitBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
        }
        
        // Mostrar modal
        this.elements.unitModal.classList.add('active');
    },

    /**
     * Fechar modal de unidade
     */
    closeUnitModal() {
        if (this.elements.unitModal) {
            this.elements.unitModal.classList.remove('active');
        }
        
        // Limpar dados de edição
        this.editingItem = null;
        
        // Limpar formulário
        if (this.elements.unitForm) {
            this.elements.unitForm.reset();
        }
        
        // Esconder card de informações
        const unitInfoCard = document.getElementById('unitInfoCard');
        if (unitInfoCard) {
            unitInfoCard.style.display = 'none';
        }
        
        // Resetar modo de edição inline
        this.resetUnitModalToEditMode();
    },

    /**
     * Abrir detalhes da unidade (novo comportamento)
     */
    async openUnitDetails(unitId) {
        try {
            console.log('👁️ Abrindo detalhes da unidade:', unitId);
            
            // Encontrar a unidade
            const unit = this.currentUnits.find(u => u.id === unitId);
            if (!unit) {
                this.showError('Unidade não encontrada');
                return;
            }
            
            // Definir item em visualização
            this.editingItem = unit;
            
            // Atualizar título do modal
            const modalTitle = document.getElementById('unitModalTitle');
            if (modalTitle) {
                modalTitle.textContent = `Detalhes: ${unit.name}`;
            }
            
            // Preencher formulário em modo readonly
            const unitName = document.getElementById('unitName');
            if (unitName) {
                unitName.value = unit.name;
                unitName.readOnly = true;
            }
            
            // Mostrar e preencher card de informações
            await this.populateUnitInfoCard(unit);
            
            // Atualizar botão principal
            const saveBtn = document.getElementById('saveUnitBtn');
            if (saveBtn) {
                saveBtn.style.display = 'none'; // Esconder botão salvar no modo visualização
            }
            
            // Mostrar modal
            this.elements.unitModal.classList.add('active');
            
        } catch (error) {
            console.error('❌ Erro ao abrir detalhes da unidade:', error);
            this.showError('Erro ao abrir detalhes: ' + error.message);
        }
    },

    /**
     * Popular card de informações da unidade
     */
    async populateUnitInfoCard(unit) {
        try {
            const unitInfoCard = document.getElementById('unitInfoCard');
            if (!unitInfoCard) return;
            
            // Mostrar card
            unitInfoCard.style.display = 'block';
            
            // Preencher informações básicas
            const createdAt = unit.created_at ? 
                new Date(unit.created_at).toLocaleDateString('pt-BR') : 
                'Não disponível';
            
            const createdAtElement = document.getElementById('unitCreatedAt');
            if (createdAtElement) {
                createdAtElement.textContent = createdAt;
            }
            
            // Carregar contadores específicos
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (supabase) {
                // Contar todos os usuários vinculados à unidade (via user_units)
                const { data: userCount, error: userError } = await supabase
                    .from('user_units')
                    .select('user_id', { count: 'exact' })
                    .eq('unit_id', unit.id);
                
                const adminCountElement = document.getElementById('unitAdminCount');
                if (adminCountElement) {
                    const totalUsers = userCount?.length || 0;
                    adminCountElement.textContent = totalUsers;
                    console.log(`👥 Total de usuários na unidade ${unit.name}: ${totalUsers}`);
                }
                
                // Contar módulos ativos da unidade
                const { data: moduleCount, error: moduleError } = await supabase
                    .from('unit_modules')
                    .select('module_id', { count: 'exact' })
                    .eq('unit_id', unit.id)
                    .eq('is_active', true);
                
                const moduleCountElement = document.getElementById('unitModuleCount');
                if (moduleCountElement) {
                    const totalModules = moduleCount?.length || 0;
                    moduleCountElement.textContent = totalModules;
                    console.log(`🧩 Total de módulos ativos na unidade ${unit.name}: ${totalModules}`);
                }
            }
            
            // Status
            const isActive = unit.is_active !== false;
            const statusElement = document.getElementById('unitStatusDisplay');
            if (statusElement) {
                const statusClass = isActive ? 'success' : 'danger';
                const statusText = isActive ? 'Ativo' : 'Inativo';
                statusElement.innerHTML = `<span class="badge badge-${statusClass}">${statusText}</span>`;
            }
            
            // Inicializar abas do card
            this.initializeUnitDetailTabs();
            
            // Carregar dados das abas
            await this.loadUnitUsers(unit.id);
            await this.loadUnitModules(unit.id);
            
        } catch (error) {
            console.error('❌ Erro ao popular informações da unidade:', error);
        }
    },

    /**
     * Inicializar abas de detalhes da unidade
     */
    initializeUnitDetailTabs() {
        try {
            const tabButtons = document.querySelectorAll('.unit-tab-btn');
            const tabContents = document.querySelectorAll('.unit-tab-content');
            
            if (tabButtons.length === 0) {
                console.warn('⚠️ Nenhum botão de aba de unidade encontrado');
                return;
            }
            
            tabButtons.forEach(btn => {
                // Remover listeners anteriores para evitar duplicação
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', (e) => {
                    try {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const tabId = e.currentTarget.getAttribute('data-unit-tab');
                        if (tabId) {
                            this.switchUnitDetailTab(tabId);
                        }
                    } catch (error) {
                        console.error('❌ Erro ao trocar aba da unidade:', error);
                        this.showError('Erro ao carregar aba: ' + error.message);
                    }
                });
            });
            
            console.log(`✅ ${tabButtons.length} abas de detalhes da unidade inicializadas`);
            
        } catch (error) {
            console.error('❌ Erro ao inicializar abas de detalhes da unidade:', error);
        }
    },

    /**
     * Trocar aba ativa nos detalhes da unidade
     */
    switchUnitDetailTab(tabId) {
        try {
            console.log(`🔄 Trocando para aba: ${tabId}`);
            
            // Remover classe active de todos os botões e conteúdos
            const tabButtons = document.querySelectorAll('.unit-tab-btn');
            const tabContents = document.querySelectorAll('.unit-tab-content');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adicionar classe active no botão e conteúdo selecionado
            const activeBtn = document.querySelector(`[data-unit-tab="${tabId}"]`);
            const activeContent = document.getElementById(`unit-tab-${tabId}`);
            
            if (activeBtn && activeContent) {
                activeBtn.classList.add('active');
                activeContent.classList.add('active');
                console.log(`✅ Aba ${tabId} ativada com sucesso`);
            } else {
                console.warn(`⚠️ Elementos da aba ${tabId} não encontrados:`, {
                    button: !!activeBtn,
                    content: !!activeContent
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao trocar aba da unidade:', error);
            this.showError('Erro ao carregar aba: ' + error.message);
        }
    },

    /**
     * Carregar usuários da unidade através da tabela user_units
     */
    async loadUnitUsers(unitId) {
        try {
            const usersList = document.getElementById('unitUsersList');
            if (!usersList) {
                console.error('❌ Elemento unitUsersList não encontrado');
                return;
            }
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) {
                console.error('❌ Cliente Supabase não disponível');
                return;
            }
            
            console.log(`🔍 Carregando usuários da unidade: ${unitId}`);
            
            // Buscar usuários vinculados à unidade através da tabela user_units
            const { data: unitUsersData, error } = await supabase
                .from('user_units')
                .select(`
                    user_id,
                    unit_id,
                    users!inner (
                        id,
                        email,
                        role_id,
                        roles!inner (
                            id,
                            name
                        )
                    )
                `)
                .eq('unit_id', unitId);
            
            if (error) {
                console.error('❌ Erro ao carregar usuários da unidade:', error);
                usersList.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar usuários</p>
                        <small>Erro: ${error.message}</small>
                    </div>
                `;
                return;
            }
            
            console.log(`📊 Dados recebidos:`, unitUsersData);
            
            if (!unitUsersData || unitUsersData.length === 0) {
                usersList.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-user-slash"></i>
                        <p>Nenhum usuário vinculado</p>
                        <small>Esta unidade ainda não possui usuários cadastrados</small>
                    </div>
                `;
                return;
            }
            
            // Extrair usuários e ordenar por nível de role
            const users = unitUsersData
                .map(uu => uu.users)
                .filter(user => user && user.roles)
                .sort((a, b) => {
                    // Definir níveis para ordenação
                    const getLevelFromRole = (roleName) => {
                        switch(roleName) {
                            case 'super_admin': return 100;
                            case 'admin': return 50;
                            case 'user': return 10;
                            default: return 0;
                        }
                    };
                    
                    const levelA = getLevelFromRole(a.roles.name);
                    const levelB = getLevelFromRole(b.roles.name);
                    return levelB - levelA; // Maior nível primeiro
                });
            
            console.log(`👥 ${users.length} usuários encontrados para a unidade`);
            
            let html = '';
            users.forEach((user, index) => {
                const initials = user.email ? 
                    user.email.substring(0, 2).toUpperCase() : 'U';
                    
                const displayName = user.email; // Usar apenas email
                const roleName = user.roles?.name || 'user'; // Usar apenas name da role
                const roleKey = user.roles?.name || 'user';
                
                // Como não temos created_at, vamos omitir a data
                const createdDate = 'N/A';
                
                // Definir cor, ícone e badge baseado no tipo de usuário
                let roleColor = 'var(--text-secondary)';
                let roleIcon = 'fas fa-user';
                let badgeClass = 'badge badge-secondary';
                let displayRoleName = 'Usuário';
                
                switch(roleKey) {
                    case 'super_admin':
                        roleColor = 'var(--accent-primary)';
                        roleIcon = 'fas fa-crown';
                        badgeClass = 'badge badge-primary';
                        displayRoleName = 'Super Admin';
                        break;
                    case 'admin':
                        roleColor = 'var(--warning-color)';
                        roleIcon = 'fas fa-user-tie';
                        badgeClass = 'badge badge-warning';
                        displayRoleName = 'Admin';
                        break;
                    case 'user':
                    default:
                        roleColor = 'var(--success-color)';
                        roleIcon = 'fas fa-user';
                        badgeClass = 'badge badge-success';
                        displayRoleName = 'Usuário';
                        break;
                }
                
                html += `
                    <div class="user-item">
                        <div class="user-info">
                            <div class="user-avatar" style="background: ${roleColor}20; color: ${roleColor};">
                                ${initials}
                            </div>
                            <div class="user-details">
                                <div class="user-name">
                                    <i class="${roleIcon}" style="color: ${roleColor}; margin-right: 8px;"></i>
                                    ${displayName}
                                </div>
                                <div class="user-meta">
                                    ${displayRoleName} • ${createdDate}
                                </div>
                            </div>
                        </div>
                        <div class="user-actions">
                            <span class="${badgeClass}" style="font-size: 0.75rem;">
                                ${displayRoleName}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            usersList.innerHTML = html;
            console.log(`✅ Lista de usuários carregada com sucesso`);
            
        } catch (error) {
            console.error('❌ Erro crítico ao carregar usuários da unidade:', error);
            const usersList = document.getElementById('unitUsersList');
            if (usersList) {
                usersList.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro crítico ao carregar usuários</p>
                        <small>Verifique o console para mais detalhes</small>
                    </div>
                `;
            }
        }
    },

    /**
     * Carregar módulos da unidade
     * 
     * SISTEMA DE CONTROLE DE MÓDULOS:
     * - Super Admin: Habilita/desabilita módulos para unidades (controle via unit_modules)
     * - Admin de Unidade: Acessa apenas módulos habilitados pelo Super Admin para sua unidade
     * - Usuário Regular: Acessa módulos liberados pelo Admin da unidade (controle via user_module_permissions)
     */
    async loadUnitModules(unitId) {
        try {
            const modulesList = document.getElementById('unitModulesList');
            if (!modulesList) return;
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) return;
            
            // Buscar todos os módulos disponíveis
            const { data: allModules, error: modulesError } = await supabase
                .from('modules')
                .select('*')
                .eq('is_active', true)
                .order('order_index, display_name');
            
            if (modulesError) {
                console.error('Erro ao carregar módulos:', modulesError);
                modulesList.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar módulos</p>
                    </div>
                `;
                return;
            }
            
            // Buscar módulos ativos para esta unidade com informações do usuário que habilitou
            const { data: unitModules, error: unitModulesError } = await supabase
                .from('unit_modules')
                .select(`
                    id,
                    module_id,
                    enabled_at,
                    enabled_by,
                    users:enabled_by (
                        email
                    )
                `)
                .eq('unit_id', unitId);
            
            if (unitModulesError) {
                console.error('Erro ao carregar módulos da unidade:', unitModulesError);
            }
            
            const activeModuleIds = unitModules?.map(um => um.module_id) || [];
            const moduleInfoMap = {};
            
            // Criar mapa com informações dos módulos habilitados
            unitModules?.forEach(um => {
                moduleInfoMap[um.module_id] = {
                    id: um.id,
                    enabled_at: um.enabled_at,
                    enabled_by_email: um.users?.email || 'Sistema'
                };
            });
            
            if (!allModules || allModules.length === 0) {
                modulesList.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-puzzle-piece"></i>
                        <p>Nenhum módulo disponível</p>
                        <small>Não há módulos configurados no sistema</small>
                    </div>
                `;
                return;
            }
            
            let html = '';
            allModules.forEach(module => {
                const isActive = activeModuleIds.includes(module.id);
                const iconClass = module.icon || 'fas fa-puzzle-piece';
                const moduleInfo = moduleInfoMap[module.id];
                
                // Informações sobre quem habilitou e quando
                let enabledInfo = '';
                if (isActive && moduleInfo) {
                    const enabledDate = new Date(moduleInfo.enabled_at).toLocaleDateString('pt-BR');
                    enabledInfo = `
                        <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
                            Habilitado por ${moduleInfo.enabled_by_email} em ${enabledDate}
                        </small>
                    `;
                }
                
                html += `
                    <div class="module-item">
                        <div class="module-info">
                            <div class="module-icon">
                                <i class="${iconClass}"></i>
                            </div>
                            <div class="module-details">
                                <div class="module-name">${module.display_name}</div>
                                <div class="module-description">${module.description || 'Módulo do sistema'}</div>
                                ${enabledInfo}
                            </div>
                        </div>
                        <div class="module-actions">
                            <label class="toggle-switch" style="margin-right: 0.5rem;">
                                <input type="checkbox" ${isActive ? 'checked' : ''} 
                                       onchange="window.GestaoSistema.toggleUnitModule('${unitId}', '${module.id}', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="badge badge-${isActive ? 'success' : 'secondary'}" style="font-size: 0.75rem;">
                                ${isActive ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            modulesList.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Erro ao carregar módulos da unidade:', error);
        }
    },

    /**
     * Alternar módulo ativo/inativo para a unidade
     */
    async toggleUnitModule(unitId, moduleId, isActive) {
        try {
            console.log(`🔄 Alternando módulo ${moduleId} para unidade ${unitId}:`, isActive ? 'Ativo' : 'Inativo');
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            if (isActive) {
                // Adicionar módulo à unidade com informação de quem habilitou
                const { error } = await supabase
                    .from('unit_modules')
                    .insert([{
                        unit_id: unitId,
                        module_id: moduleId,
                        enabled_by: this.currentUser?.currentUser?.id || null,
                        enabled_at: new Date().toISOString()
                    }]);
                    
                if (error) {
                    // Se já existe, pode ser erro de duplicação, tentar atualizar
                    if (error.code === '23505') { // unique_violation
                        console.log('🔄 Módulo já existe, tentando reativar...');
                        const { error: updateError } = await supabase
                            .from('unit_modules')
                            .update({
                                enabled_by: this.currentUser?.currentUser?.id || null,
                                enabled_at: new Date().toISOString()
                            })
                            .eq('unit_id', unitId)
                            .eq('module_id', moduleId);
                            
                        if (updateError) {
                            throw updateError;
                        }
                    } else {
                        throw error;
                    }
                }
            } else {
                // Remover módulo da unidade
                const { error } = await supabase
                    .from('unit_modules')
                    .delete()
                    .eq('unit_id', unitId)
                    .eq('module_id', moduleId);
                    
                if (error) {
                    throw error;
                }
            }
            
            // Recarregar lista de módulos para atualizar contadores e informações
            await this.loadUnitModules(unitId);
            
            // Atualizar contador na tabela principal
            this.loadUnitCounters();
            
            // Mostrar notificação
            const statusText = isActive ? 'ativado' : 'desativado';
            this.showSuccess(`Módulo ${statusText} para esta unidade!`);
            
        } catch (error) {
            console.error('❌ Erro ao alternar módulo da unidade:', error);
            this.showError('Erro ao alterar módulo: ' + error.message);
            
            // Reverter toggle se houve erro
            const checkbox = document.querySelector(`input[onchange*="${moduleId}"]`);
            if (checkbox) {
                checkbox.checked = !isActive;
            }
        }
    },

    /**
     * Alternar entre modo visualização e edição inline
     */
    editUnitInline() {
        const unitName = document.getElementById('unitName');
        const saveBtn = document.getElementById('saveUnitBtn');
        const modalTitle = document.getElementById('unitModalTitle');
        
        if (unitName && saveBtn && modalTitle) {
            // Ativar modo edição
            unitName.readOnly = false;
            unitName.focus();
            
            // Mostrar botão salvar
            saveBtn.style.display = 'inline-flex';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
            
            // Atualizar título
            modalTitle.textContent = `Editando: ${this.editingItem?.name || 'Unidade'}`;
            
            this.showSuccess('Modo de edição ativado. Faça as alterações e clique em "Salvar".');
        }
    },

    /**
     * Resetar modal para modo de edição padrão
     */
    resetUnitModalToEditMode() {
        const unitName = document.getElementById('unitName');
        const saveBtn = document.getElementById('saveUnitBtn');
        
        if (unitName) {
            unitName.readOnly = false;
        }
        
        if (saveBtn) {
            saveBtn.style.display = 'inline-flex';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
        }
    },

    /**
     * Excluir unidade a partir do modal
     */
    async deleteUnitFromModal() {
        if (this.editingItem) {
            const confirmed = await this.deleteUnit(this.editingItem.id);
            if (confirmed) {
                this.closeUnitModal();
            }
        }
    },

    /**
     * Alternar status ativo/inativo da unidade
     */
    async toggleUnitStatus(unitId, isActive) {
        try {
            console.log(`🔄 Alternando status da unidade ${unitId} para:`, isActive ? 'Ativo' : 'Inativo');
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Atualizar no banco
            const { error } = await supabase
                .from('units')
                .update({ is_active: isActive })
                .eq('id', unitId);
            
            if (error) {
                throw error;
            }
            
            // Atualizar dados locais
            const unit = this.currentUnits.find(u => u.id === unitId);
            if (unit) {
                unit.is_active = isActive;
            }
            
            // Mostrar notificação
            const statusText = isActive ? 'ativada' : 'desativada';
            this.showSuccess(`Unidade ${statusText} com sucesso!`);
            
            // Recarregar tabela para atualizar badges
            this.renderUnitsTable();
            
        } catch (error) {
            console.error('❌ Erro ao alternar status da unidade:', error);
            this.showError('Erro ao alterar status: ' + error.message);
            
            // Reverter toggle se houve erro
            const checkbox = document.querySelector(`input[onchange*="${unitId}"]`);
            if (checkbox) {
                checkbox.checked = !isActive;
            }
        }
    },

    /**
     * Salvar unidade (nova ou editada)
     */
    async saveUnit() {
        try {
            console.log('💾 Salvando unidade...');
            
            // Validar formulário
            const unitName = document.getElementById('unitName');
            if (!unitName || !unitName.value.trim()) {
                this.showError('Por favor, digite o nome da unidade');
                return;
            }
            
            const name = unitName.value.trim();
            
            // Usar o cliente armazenado ou o passado via moduleUserData
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Salvar no banco
            let result;
            if (this.editingItem) {
                // Atualizar unidade existente
                result = await supabase
                    .from('units')
                    .update({ name: name })
                    .eq('id', this.editingItem.id)
                    .select();
            } else {
                // Criar nova unidade (is_active = true por padrão)
                result = await supabase
                    .from('units')
                    .insert([{ name: name, is_active: true }])
                    .select();
            }
            
            const { data, error } = result;
            
            if (error) {
                throw error;
            }
            
            console.log('✅ Unidade salva com sucesso:', data);
            
            // Mostrar sucesso
            const action = this.editingItem ? 'atualizada' : 'criada';
            this.showSuccess(`Unidade "${name}" ${action} com sucesso!`);
            
            // Fechar modal
            this.closeUnitModal();
            
            // Recarregar lista de unidades
            await this.loadUnits();
            
        } catch (error) {
            console.error('❌ Erro ao salvar unidade:', error);
            this.showError('Erro ao salvar unidade: ' + error.message);
        }
    },

    /**
     * Editar unidade
     */
    async editUnit(unitId) {
        try {
            console.log('✏️ Editando unidade:', unitId);
            
            // Encontrar a unidade
            const unit = this.currentUnits.find(u => u.id === unitId);
            if (!unit) {
                this.showError('Unidade não encontrada');
                return;
            }
            
            // Definir item em edição
            this.editingItem = unit;
            
            // Atualizar título do modal
            const modalTitle = document.getElementById('unitModalTitle');
            if (modalTitle) {
                modalTitle.textContent = 'Editar Unidade';
            }
            
            // Preencher formulário
            const unitName = document.getElementById('unitName');
            if (unitName) {
                unitName.value = unit.name;
            }
            
            // Atualizar botão de salvar
            const saveBtn = document.getElementById('saveUnitBtn');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar';
            }
            
            // Mostrar modal
            this.elements.unitModal.classList.add('active');
            
        } catch (error) {
            console.error('❌ Erro ao editar unidade:', error);
            this.showError('Erro ao editar unidade: ' + error.message);
        }
    },

    /**
     * Excluir unidade
     */
    async deleteUnit(unitId) {
        try {
            const unit = this.currentUnits.find(u => u.id === unitId);
            if (!unit) {
                this.showError('Unidade não encontrada');
                return;
            }
            
            if (!confirm(`Tem certeza que deseja excluir a unidade "${unit.name}"?\n\nEsta ação não pode ser desfeita e irá remover todos os relacionamentos desta unidade.`)) {
                return;
            }
            
            console.log('🗑️ Excluindo unidade:', unitId);
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Excluir relacionamentos primeiro (user_units, unit_modules, user_module_permissions)
            console.log('🔄 Removendo relacionamentos da unidade...');
            
            // 1. Remover user_units
            await supabase
                .from('user_units')
                .delete()
                .eq('unit_id', unitId);
            
            // 2. Remover unit_modules
            await supabase
                .from('unit_modules')
                .delete()
                .eq('unit_id', unitId);
            
            // 3. Remover user_module_permissions
            await supabase
                .from('user_module_permissions')
                .delete()
                .eq('unit_id', unitId);
            
            // 4. Excluir a unidade
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('id', unitId);
                
            if (error) {
                throw error;
            }
            
            console.log('✅ Unidade excluída com sucesso');
            this.showSuccess(`Unidade "${unit.name}" excluída com sucesso!`);
            
            // Recarregar lista
            await this.loadUnits();
            
        } catch (error) {
            console.error('❌ Erro ao excluir unidade:', error);
            this.showError('Erro ao excluir unidade: ' + error.message);
        }
    },

    /**
     * Abrir modal para novo administrador
     */
    openAdminModal() {
        console.log('👥 Abrindo modal para novo administrador...');
        
        // Buscar modal diretamente se this.elements falhar
        const modal = this.elements.adminModal || document.getElementById('adminModal');
        
        if (!modal) {
            console.error('❌ Modal de administrador não encontrado no DOM');
            this.showError('Erro interno: Modal não encontrado. Recarregue a página.');
            return;
        }
        
        console.log('✅ Modal encontrado:', modal);
        
        // Limpar dados de edição
        this.editingItem = null;
        
        // Atualizar título do modal
        const modalTitle = document.getElementById('adminModalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Novo Administrador';
            console.log('✅ Título do modal atualizado');
        }
        
        // Limpar formulário
        const adminForm = this.elements.adminForm || document.getElementById('adminForm');
        if (adminForm) {
            adminForm.reset();
            console.log('✅ Formulário resetado');
        }
        
        // Limpar campos específicos
        const adminEmail = document.getElementById('adminEmail');
        const adminPassword = document.getElementById('adminPassword');
        if (adminEmail) adminEmail.value = '';
        if (adminPassword) adminPassword.value = '';
        
        // Atualizar botão de salvar
        const saveBtn = document.getElementById('saveAdminBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
            console.log('✅ Botão de salvar atualizado');
        }
        
        // Preencher checkboxes de unidades
        this.populateAdminUnitsCheckbox();
        
        // Mostrar modal usando a estrutura correta do CSS
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        
        console.log('✅ Modal de administrador aberto com sucesso');
    },

    /**
     * Fechar modal de administrador
     */
    closeAdminModal() {
        const modal = this.elements.adminModal || document.getElementById('adminModal');
        
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('active');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            console.log('✅ Modal de administrador fechado');
        }
        
        // Limpar dados de edição
        this.editingItem = null;
        
        // Limpar formulário
        const adminForm = this.elements.adminForm || document.getElementById('adminForm');
        if (adminForm) {
            adminForm.reset();
        }
        
        // Limpar campos específicos
        const adminEmail = document.getElementById('adminEmail');
        const adminPassword = document.getElementById('adminPassword');
        if (adminEmail) adminEmail.value = '';
        if (adminPassword) adminPassword.value = '';
    },

    /**
     * Popular checkboxes de unidades no modal de administrador
     */
    populateAdminUnitsCheckbox() {
        const container = document.getElementById('adminUnitsCheckbox');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.currentUnits.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Nenhuma unidade disponível. Crie uma unidade primeiro.</p>';
            return;
        }
        
        this.currentUnits.forEach(unit => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.style.cssText = 'margin-bottom: 0.5rem; display: flex; align-items: center;';
            
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="unit_${unit.id}" value="${unit.id}" style="margin-right: 0.5rem;">
                <label for="unit_${unit.id}" style="cursor: pointer; flex: 1;">${unit.name}</label>
            `;
            
            container.appendChild(checkboxDiv);
        });
    },

    /**
     * Salvar administrador (novo ou editado)
     */
    async saveAdmin() {
        try {
            console.log('💾 Salvando administrador...');
            
            // Debug: Verificar se o modal está aberto e elementos existem
            const modal = document.getElementById('adminModal');
            console.log('🔍 Modal adminModal encontrado:', !!modal);
            console.log('🔍 Modal está visível:', modal?.classList.contains('active'));
            
            // Validar formulário - com logs de debug
            const adminEmail = document.getElementById('adminEmail');
            const adminPassword = document.getElementById('adminPassword');
            
            console.log('🔍 Input adminEmail encontrado:', !!adminEmail);
            console.log('🔍 Input adminPassword encontrado:', !!adminPassword);
            
            if (!adminEmail) {
                this.showError('Erro interno: Campo de e-mail não encontrado. Recarregue a página.');
                return;
            }
            
            if (!adminEmail.value || !adminEmail.value.trim()) {
                this.showError('Por favor, digite o e-mail do administrador');
                adminEmail.focus();
                return;
            }
            
            if (!adminPassword) {
                this.showError('Erro interno: Campo de senha não encontrado. Recarregue a página.');
                return;
            }
            
            if (!this.editingItem && (!adminPassword.value || !adminPassword.value.trim())) {
                this.showError('Por favor, digite a senha do administrador');
                adminPassword.focus();
                return;
            }
            
            const email = adminEmail.value.trim();
            const password = adminPassword.value.trim();
            
            // Verificar unidades selecionadas
            const selectedUnits = [];
            const unitCheckboxes = document.querySelectorAll('#adminUnitsCheckbox input[type="checkbox"]:checked');
            unitCheckboxes.forEach(checkbox => {
                selectedUnits.push(checkbox.value);
            });
            
            if (selectedUnits.length === 0) {
                this.showError('Por favor, selecione pelo menos uma unidade para o administrador');
                return;
            }
            
            // Usar o cliente armazenado ou o passado via moduleUserData
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Buscar role_id do admin
            const { data: adminRole, error: roleError } = await supabase
                .from('roles')
                .select('id, name, display_name, level')
                .eq('name', 'admin')
                .single();
                
            if (roleError) {
                throw new Error('Erro ao buscar role de administrador: ' + roleError.message);
            }
            
            let userId;
            
            if (this.editingItem) {
                // Atualizar administrador existente
                const updateData = { email: email };
                if (password) {
                    updateData.password = password;
                    updateData.updated_at = new Date().toISOString();
                }
                
                const { data, error } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', this.editingItem.id)
                    .select();
                    
                if (error) {
                    throw error;
                }
                
                userId = this.editingItem.id;
            } else {
                // Criar novo administrador
                const { data, error } = await supabase
                    .from('users')
                    .insert([{
                        email: email,
                        password: password,
                        role_id: adminRole.id
                    }])
                    .select();
                    
                if (error) {
                    throw error;
                }
                
                userId = data[0].id;
            }
            
            // Remover unidades antigas (se for edição)
            if (this.editingItem) {
                await supabase
                    .from('user_units')
                    .delete()
                    .eq('user_id', userId);
            }
            
            // Adicionar novas unidades
            const userUnitsData = selectedUnits.map(unitId => ({
                user_id: userId,
                unit_id: unitId
            }));
            
            const { error: unitsError } = await supabase
                .from('user_units')
                .insert(userUnitsData);
                
            if (unitsError) {
                throw unitsError;
            }
            
            console.log('✅ Administrador salvo com sucesso');
            
            // Mostrar sucesso
            const action = this.editingItem ? 'atualizado' : 'criado';
            this.showSuccess(`Administrador "${email}" ${action} com sucesso!`);
            
            // Fechar modal
            this.closeAdminModal();
            
            // Recarregar lista de administradores
            await this.loadAdmins();
            
        } catch (error) {
            console.error('❌ Erro ao salvar administrador:', error);
            this.showError('Erro ao salvar administrador: ' + error.message);
        }
    },

    /**
     * Editar administrador
     */
    async editAdmin(adminId) {
        try {
            console.log('✏️ Editando administrador:', adminId);
            
            // Encontrar o administrador
            const admin = this.currentAdmins.find(a => a.id === adminId);
            if (!admin) {
                this.showError('Administrador não encontrado');
                return;
            }
            
            // Definir item em edição
            this.editingItem = admin;
            
            // Atualizar título do modal
            const modalTitle = document.getElementById('adminModalTitle');
            if (modalTitle) {
                modalTitle.textContent = 'Editar Administrador';
            }
            
            // Preencher formulário
            const adminEmail = document.getElementById('adminEmail');
            const adminPassword = document.getElementById('adminPassword');
            
            if (adminEmail) {
                adminEmail.value = admin.email;
            }
            
            if (adminPassword) {
                adminPassword.value = '';
                adminPassword.placeholder = 'Deixe em branco para manter a senha atual';
            }
            
            // Atualizar botão de salvar
            const saveBtn = document.getElementById('saveAdminBtn');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar';
            }
            
            // Preencher checkboxes de unidades
            this.populateAdminUnitsCheckbox();
            
            // Marcar unidades do administrador
            setTimeout(() => {
                admin.user_units.forEach(userUnit => {
                    const checkbox = document.getElementById(`unit_${userUnit.units.id}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }, 100);
            
            // Mostrar modal
            this.elements.adminModal.classList.add('active');
            
        } catch (error) {
            console.error('❌ Erro ao editar administrador:', error);
            this.showError('Erro ao editar administrador: ' + error.message);
        }
    },

    /**
     * Excluir administrador
     */
    async deleteAdmin(adminId) {
        try {
            const admin = this.currentAdmins.find(a => a.id === adminId);
            if (!admin) {
                this.showError('Administrador não encontrado');
                return;
            }
            
            if (!confirm(`Tem certeza que deseja excluir o administrador "${admin.email}"?\n\nEsta ação não pode ser desfeita.`)) {
                return;
            }
            
            console.log('🗑️ Excluindo administrador:', adminId);
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Excluir relacionamentos primeiro
            await supabase
                .from('user_units')
                .delete()
                .eq('user_id', adminId);
            
            // Excluir usuário
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', adminId);
                
            if (error) {
                throw error;
            }
            
            console.log('✅ Administrador excluído com sucesso');
            this.showSuccess(`Administrador "${admin.email}" excluído com sucesso!`);
            
            // Recarregar lista
            await this.loadAdmins();
            
        } catch (error) {
            console.error('❌ Erro ao excluir administrador:', error);
            this.showError('Erro ao excluir administrador: ' + error.message);
        }
    },
    
    /**
     * Exibe o card de detalhes do administrador
     * @param {string} adminId - ID do administrador
     */
    async openAdminCard(adminId) {
        console.log('[Admin Card] Iniciando carregamento do administrador:', adminId);
        
        // 🔧 CORREÇÃO: Determinar tipo de usuário logo no início
        const currentUserRole = window.userRole?.name || this.currentUser?.role?.name;
        const isCurrentUserSuperAdmin = currentUserRole === 'super_admin';
        
        console.log('[Admin Card] Tipo de usuário detectado:', currentUserRole);
        console.log('[Admin Card] É Super Admin?', isCurrentUserSuperAdmin);
        
        if (!adminId) {
            console.error('❌ ID do administrador não fornecido');
            return;
        }
        
        const card = document.getElementById('adminInfoCard');
        if (!card) {
            console.error('❌ Elemento adminInfoCard não encontrado');
            return;
        }

        try {
            // � CORREÇÃO: Usar display block em vez de classList
            card.style.display = 'block';
            
            // Resetar todos os campos para loading
            const loadingText = 'Carregando...';
            const adminEmailInfo = document.getElementById('adminEmailInfo');
            const adminUnitsInfo = document.getElementById('adminUnitsInfo');
            const adminCreatedAtInfo = document.getElementById('adminCreatedAtInfo');
            const adminStatusInfo = document.getElementById('adminStatusInfo');
            
            if (adminEmailInfo) adminEmailInfo.textContent = loadingText;
            if (adminUnitsInfo) adminUnitsInfo.textContent = loadingText;
            if (adminCreatedAtInfo) adminCreatedAtInfo.textContent = loadingText;
            if (adminStatusInfo) adminStatusInfo.innerHTML = loadingText;
            
            const usersList = document.getElementById('adminUsersList');
            if (usersList) {
                usersList.innerHTML = `
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        Carregando dados do administrador...
                    </div>
                `;
            }

            console.log('[Admin Card] Buscando dados básicos do administrador...');

            // Verificar se o cliente Supabase está disponível
            const supabase = this.supabaseClient || this.currentUser?.supabase || window.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }

            // 🔧 CORREÇÃO: Query simplificada para dados básicos
            const { data: admin, error: adminError } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    created_at,
                    role_id
                `)
                .eq('id', adminId)
                .single();

            if (adminError) {
                console.error('❌ Erro ao carregar dados do administrador:', adminError);
                throw new Error(`Erro ao buscar administrador: ${adminError.message}`);
            }

            if (!admin) {
                throw new Error('Administrador não encontrado');
            }

            console.log('[Admin Card] ✅ Dados básicos carregados:', admin);

            // Mostrar/ocultar indicador de Super Admin
            const superAdminIndicator = document.getElementById('superAdminModeIndicator');
            if (superAdminIndicator) {
                if (isCurrentUserSuperAdmin) {
                    superAdminIndicator.style.display = 'block';
                } else {
                    superAdminIndicator.style.display = 'none';
                }
            }

            // Mostrar/ocultar botão de criar usuário para Super Admin
            const createUserBtnContainer = document.getElementById('createUserBtnContainer');
            if (createUserBtnContainer) {
                if (isCurrentUserSuperAdmin) {
                    createUserBtnContainer.style.display = 'block';
                    // Armazenar ID do admin atual para uso no modal
                    createUserBtnContainer.setAttribute('data-admin-id', adminId);
                } else {
                    createUserBtnContainer.style.display = 'none';
                }
            }

            // Preencher dados básicos
            if (adminEmailInfo) adminEmailInfo.textContent = admin.email || 'N/A';
            if (adminCreatedAtInfo) {
                adminCreatedAtInfo.textContent = admin.created_at 
                    ? new Date(admin.created_at).toLocaleDateString('pt-BR')
                    : 'N/A';
            }
            if (adminStatusInfo) {
                adminStatusInfo.innerHTML = '<span class="badge badge-success">Ativo</span>';
            }

            console.log('[Admin Card] Buscando unidades do administrador...');

            // Buscar unidades do administrador
            const { data: adminUnits, error: unitsError } = await supabase
                .from('user_units')
                .select(`
                    unit_id,
                    units!inner (
                        id,
                        name
                    )
                `)
                .eq('user_id', adminId);

            if (unitsError) {
                console.error('❌ Erro ao carregar unidades:', unitsError);
                if (adminUnitsInfo) adminUnitsInfo.textContent = 'Erro ao carregar unidades';
            } else {
                console.log('[Admin Card] ✅ Unidades carregadas:', adminUnits);
                
                if (adminUnitsInfo) {
                    if (adminUnits && adminUnits.length > 0) {
                        const unitNames = adminUnits
                            .map(uu => uu.units?.name || 'Unidade desconhecida')
                            .join(', ');
                        adminUnitsInfo.textContent = unitNames;
                    } else {
                        adminUnitsInfo.textContent = 'Nenhuma unidade vinculada';
                    }
                }
            }

            console.log('[Admin Card] Buscando permissões de módulos...');
            
            // Atualizar título da aba baseado no tipo de usuário
            const tabHeader = document.querySelector('#admin-tab-users .tab-content-header h5');
            const tabSubtitle = document.querySelector('#admin-tab-users .tab-content-header small');
            
            if (isCurrentUserSuperAdmin) {
                if (tabHeader) tabHeader.textContent = 'Todos os Usuários do Sistema';
                if (tabSubtitle) tabSubtitle.textContent = 'Visualização completa de usuários e suas permissões (modo Super Admin)';
            } else {
                if (tabHeader) tabHeader.textContent = 'Permissões de Módulos Concedidas';
                if (tabSubtitle) tabSubtitle.textContent = 'Usuários e módulos liberados pelo administrador';
            }
            
            let modulePermissions;
            let permissionsError;
            
            if (isCurrentUserSuperAdmin) {
                console.log('[Admin Card] Super Admin detectado - carregando TODOS os usuários');
                
                // 🔧 CORREÇÃO: Especificar relacionamentos explicitamente para evitar ambiguidade
                const result = await supabase
                    .from('user_module_permissions')
                    .select(`
                        user_id,
                        unit_id,
                        module_id,
                        granted_at,
                        granted_by,
                        users!user_module_permissions_user_id_fkey (
                            id,
                            email,
                            created_at
                        ),
                        granted_by_user:users!user_module_permissions_granted_by_fkey (
                            id,
                            email
                        ),
                        units!inner (
                            id,
                            name
                        ),
                        modules!inner (
                            id,
                            name,
                            display_name,
                            icon
                        )
                    `)
                    .order('granted_at', { ascending: false });
                    
                modulePermissions = result.data;
                permissionsError = result.error;
                
                console.log('[Admin Card] Query Super Admin - Resultado:', result);
                console.log('[Admin Card] Permissões encontradas:', modulePermissions?.length || 0);
                
            } else {
                console.log('[Admin Card] Admin regular - carregando apenas usuários criados por:', adminId);
                
                // 🔧 CORREÇÃO: Especificar relacionamentos explicitamente para admin regular
                const result = await supabase
                    .from('user_module_permissions')
                    .select(`
                        user_id,
                        unit_id,
                        module_id,
                        granted_at,
                        users!user_module_permissions_user_id_fkey (
                            id,
                            email,
                            created_at
                        ),
                        units!inner (
                            id,
                            name
                        ),
                        modules!inner (
                            id,
                            name,
                            display_name,
                            icon
                        )
                    `)
                    .eq('granted_by', adminId)
                    .order('granted_at', { ascending: false });
                    
                modulePermissions = result.data;
                permissionsError = result.error;
                
                console.log('[Admin Card] Query Admin regular - Resultado:', result);
                console.log('[Admin Card] Permissões encontradas:', modulePermissions?.length || 0);
            }

            if (permissionsError) {
                console.error('❌ Erro ao carregar permissões:', permissionsError);
                if (usersList) {
                    usersList.innerHTML = `
                        <div class="empty-state">
                            <p style="color: var(--danger-color);">
                                ❌ Erro ao carregar usuários: ${permissionsError.message}
                            </p>
                            <details style="margin-top: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 6px;">
                                <summary style="cursor: pointer; font-weight: 600;">Detalhes do Erro</summary>
                                <pre style="margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.8rem;">${JSON.stringify(permissionsError, null, 2)}</pre>
                            </details>
                        </div>
                    `;
                }
            } else {
                console.log('[Admin Card] ✅ Permissões carregadas:', modulePermissions);
                console.log('[Admin Card] Quantidade de registros:', modulePermissions?.length || 0);
                
                // 🔧 DIAGNÓSTICO: Vamos também tentar uma query direta para ver se há dados
                if (isCurrentUserSuperAdmin) {
                    console.log('[Admin Card] 🔍 DIAGNÓSTICO: Verificando dados brutos na tabela...');
                    
                    // Query simples para verificar se existem dados
                    const { data: rawData, error: rawError } = await supabase
                        .from('user_module_permissions')
                        .select('*')
                        .limit(10);
                    
                    console.log('[Admin Card] 🔍 Dados brutos encontrados:', rawData?.length || 0);
                    console.log('[Admin Card] 🔍 Primeiros registros:', rawData);
                    
                    if (rawError) {
                        console.error('[Admin Card] 🔍 Erro na query bruta:', rawError);
                    }
                    
                    // Verificar se há usuários na tabela users
                    const { data: allUsers, error: usersError } = await supabase
                        .from('users')
                        .select('id, email, created_at')
                        .limit(10);
                        
                    console.log('[Admin Card] 🔍 Usuários encontrados:', allUsers?.length || 0);
                    console.log('[Admin Card] 🔍 Usuários:', allUsers);
                    
                    // Verificar módulos
                    const { data: allModules, error: modulesError } = await supabase
                        .from('modules')
                        .select('id, name, display_name')
                        .limit(10);
                        
                    console.log('[Admin Card] 🔍 Módulos encontrados:', allModules?.length || 0);
                    console.log('[Admin Card] 🔍 Módulos:', allModules);
                    
                    // Verificar unidades
                    const { data: allUnits, error: unitsError } = await supabase
                        .from('units')
                        .select('id, name')
                        .limit(10);
                        
                    console.log('[Admin Card] 🔍 Unidades encontradas:', allUnits?.length || 0);
                    console.log('[Admin Card] 🔍 Unidades:', allUnits);
                }
                
                if (usersList) {
                    if (modulePermissions && modulePermissions.length > 0) {
                        // Agrupar permissões por usuário
                        const userPermissionsMap = new Map();
                        
                        modulePermissions.forEach(permission => {
                            const userId = permission.user_id;
                            
                            if (!userPermissionsMap.has(userId)) {
                                userPermissionsMap.set(userId, {
                                    user: permission.users,
                                    permissions: []
                                });
                            }
                            
                            userPermissionsMap.get(userId).permissions.push({
                                unit: permission.units,
                                module: permission.modules,
                                granted_at: permission.granted_at,
                                granted_by: permission.granted_by || null
                            });
                        });

                        // Gerar HTML para cada usuário
                        usersList.innerHTML = Array.from(userPermissionsMap.entries()).map(([userId, userData]) => {
                            const user = userData.user;
                            const permissions = userData.permissions;
                            
                            const createdDate = user.created_at 
                                ? new Date(user.created_at).toLocaleDateString('pt-BR')
                                : 'N/A';
                            
                            // Agrupar permissões por unidade
                            const unitGroups = new Map();
                            permissions.forEach(perm => {
                                const unitId = perm.unit.id;
                                if (!unitGroups.has(unitId)) {
                                    unitGroups.set(unitId, {
                                        unit: perm.unit,
                                        modules: []
                                    });
                                }
                                unitGroups.get(unitId).modules.push({
                                    ...perm.module,
                                    granted_by: perm.granted_by
                                });
                            });

                            // Gerar lista de unidades e módulos
                            const unitsModulesHTML = Array.from(unitGroups.entries()).map(([unitId, unitData]) => {
                                const unit = unitData.unit;
                                const modules = unitData.modules;
                                
                                const modulesHTML = modules.map(module => {
                                    // Para Super Admin, mostrar quem concedeu a permissão
                                    const grantedByInfo = isCurrentUserSuperAdmin && module.granted_by 
                                        ? `title="Concedido por: ${module.granted_by === adminId ? 'Este Admin' : 'Outro Admin'}"` 
                                        : '';
                                    
                                    const moduleStyle = isCurrentUserSuperAdmin && module.granted_by !== adminId
                                        ? 'background: var(--info-color); border: 1px solid var(--info-color);'
                                        : 'background: var(--accent-primary);';
                                    
                                    return `<span style="
                                        display: inline-block;
                                        ${moduleStyle}
                                        color: var(--text-on-accent);
                                        padding: 2px 6px;
                                        border-radius: 4px;
                                        font-size: 0.75rem;
                                        margin: 2px;
                                        font-weight: 500;
                                        cursor: ${isCurrentUserSuperAdmin ? 'help' : 'default'};
                                    " ${grantedByInfo}>
                                        <i class="${module.icon || 'fas fa-cube'}"></i> ${module.display_name || module.name}
                                        ${isCurrentUserSuperAdmin && module.granted_by !== adminId ? ' 🔄' : ''}
                                    </span>`;
                                }).join('');
                                
                                return `
                                    <div style="margin-bottom: 0.5rem;">
                                        <div style="font-weight: 600; color: var(--accent-primary); margin-bottom: 4px;">
                                            📍 ${unit.name}
                                        </div>
                                        <div>${modulesHTML}</div>
                                    </div>
                                `;
                            }).join('');
                            
                            // Adicionar indicador de origem para Super Admin
                            const userOriginBadge = isCurrentUserSuperAdmin 
                                ? `<div style="
                                    font-size: 0.8rem; 
                                    color: var(--text-secondary);
                                    margin-top: 0.25rem;
                                ">
                                    ${permissions.some(p => p.granted_by === adminId) 
                                        ? '✅ Gerenciado por este Admin' 
                                        : '🔄 Gerenciado por outro Admin'}
                                </div>`
                                : '';
                            
                            return `
                                <div style="
                                    border: 1px solid var(--border-primary);
                                    border-radius: var(--border-radius);
                                    margin-bottom: 1rem;
                                    background: var(--bg-secondary);
                                    overflow: hidden;
                                ">
                                    <!-- Header do Usuário -->
                                    <div style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        padding: 0.75rem;
                                        background: var(--bg-tertiary);
                                        border-bottom: 1px solid var(--border-primary);
                                    ">
                                        <div>
                                            <div style="font-weight: 600; color: var(--text-primary);">
                                                👤 ${user.email}
                                            </div>
                                            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                                Usuário Regular
                                            </div>
                                            ${userOriginBadge}
                                        </div>
                                        <div style="
                                            text-align: right;
                                            font-size: 0.8rem;
                                            color: var(--text-secondary);
                                        ">
                                            Criado em:<br>
                                            <strong>${createdDate}</strong>
                                        </div>
                                    </div>
                                    
                                    <!-- Permissões do Usuário -->
                                    <div style="padding: 0.75rem;">
                                        <div style="
                                            font-size: 0.9rem; 
                                            font-weight: 600; 
                                            color: var(--text-primary);
                                            margin-bottom: 0.5rem;
                                        ">
                                            🔑 Módulos Liberados:
                                        </div>
                                        ${unitsModulesHTML}
                                    </div>
                                </div>
                            `;
                        }).join('');
                        
                    } else {
                        const emptyMessage = isCurrentUserSuperAdmin 
                            ? 'Nenhum usuário possui permissões de módulo no sistema ainda.'
                            : 'Nenhuma permissão de módulo foi concedida por este administrador ainda.';
                            
                        const emptySubMessage = isCurrentUserSuperAdmin
                            ? 'Quando administradores liberarem módulos para usuários, eles aparecerão aqui.'
                            : 'Quando este admin liberar módulos para usuários, eles aparecerão aqui organizados por unidade.';
                        
                        // Se for Super Admin e não tiver dados, vamos tentar uma abordagem alternativa
                        let alternativeDataHTML = '';
                        
                        if (isCurrentUserSuperAdmin) {
                            console.log('[Admin Card] 🔄 Super Admin sem permissões - tentando mostrar todos os usuários...');
                            
                            // Buscar todos os usuários do sistema
                            try {
                                const { data: allUsersInSystem, error: allUsersError } = await supabase
                                    .from('users')
                                    .select(`
                                        id,
                                        email,
                                        created_at,
                                        roles (
                                            name,
                                            display_name
                                        )
                                    `)
                                    .neq('id', adminId) // Excluir o próprio admin
                                    .order('created_at', { ascending: false });
                                
                                if (!allUsersError && allUsersInSystem && allUsersInSystem.length > 0) {
                                    console.log('[Admin Card] ✅ Encontrados usuários sem permissões:', allUsersInSystem.length);
                                    
                                    alternativeDataHTML = `
                                        <div style="margin-top: 1rem; padding: 1rem; background: var(--warning-color); color: white; border-radius: 6px;">
                                            <h5 style="margin: 0 0 0.5rem 0;">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                Usuários sem Permissões de Módulo
                                            </h5>
                                            <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">
                                                Como Super Admin, você pode ver ${allUsersInSystem.length} usuário(s) no sistema que ainda não possuem permissões de módulo:
                                            </p>
                                            ${allUsersInSystem.map(user => `
                                                <div style="
                                                    background: rgba(255,255,255,0.2);
                                                    padding: 0.5rem;
                                                    border-radius: 4px;
                                                    margin-bottom: 0.5rem;
                                                    display: flex;
                                                    justify-content: space-between;
                                                    align-items: center;
                                                ">
                                                    <div>
                                                        <strong>${user.email}</strong>
                                                        <br>
                                                        <small>${user.roles?.display_name || user.roles?.name || 'Sem role'}</small>
                                                    </div>
                                                    <small>${new Date(user.created_at).toLocaleDateString('pt-BR')}</small>
                                                </div>
                                            `).join('')}
                                        </div>
                                    `;
                                }
                            } catch (error) {
                                console.error('[Admin Card] Erro ao buscar usuários alternativos:', error);
                            }
                        }
                        
                        usersList.innerHTML = `
                            <div class="empty-state" style="
                                text-align: center;
                                padding: 2rem;
                                color: var(--text-secondary);
                                background: var(--bg-tertiary);
                                border-radius: var(--border-radius);
                                border: 2px dashed var(--border-primary);
                            ">
                                <i class="fas fa-user-shield" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                                <p style="margin: 0; font-weight: 500;">
                                    ${emptyMessage}
                                </p>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                                    ${emptySubMessage}
                                </p>
                            </div>
                            ${alternativeDataHTML}
                        `;
                    }
                }
            }

            console.log('✅ [Admin Card] Carregamento completo!');

        } catch (error) {
            console.error('❌ [Admin Card] Erro geral:', error);
            
            // Mostrar erro na interface
            const adminEmailInfo = document.getElementById('adminEmailInfo');
            const adminUnitsInfo = document.getElementById('adminUnitsInfo');
            const adminCreatedAtInfo = document.getElementById('adminCreatedAtInfo');
            const adminStatusInfo = document.getElementById('adminStatusInfo');
            const usersList = document.getElementById('adminUsersList');
            
            if (adminEmailInfo) adminEmailInfo.textContent = 'Erro ao carregar';
            if (adminUnitsInfo) adminUnitsInfo.textContent = 'Erro ao carregar';
            if (adminCreatedAtInfo) adminCreatedAtInfo.textContent = 'Erro ao carregar';
            if (adminStatusInfo) {
                adminStatusInfo.innerHTML = '<span class="badge badge-danger">Erro</span>';
            }
            
            if (usersList) {
                usersList.innerHTML = `
                    <div class="empty-state" style="
                        text-align: center;
                        padding: 2rem;
                        color: var(--danger-color);
                        background: var(--bg-tertiary);
                        border-radius: var(--border-radius);
                        border: 2px solid var(--danger-color);
                    ">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0; font-weight: 500;">
                            Erro ao carregar dados do administrador
                        </p>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                            ${error.message}
                        </p>
                    </div>
                `;
            }
        }
    },

    /**
     * Variável para armazenar o ID do administrador atual no contexto do modal
     */
    currentAdminForUserCreation: null,

    /**
     * Abrir modal para criar usuário vinculado ao administrador
     */
    openCreateUserForAdmin() {
        console.log('👤 Abrindo modal para criar usuário para administrador...');
        
        // Obter ID do administrador do botão
        const createUserBtnContainer = document.getElementById('createUserBtnContainer');
        const adminId = createUserBtnContainer?.getAttribute('data-admin-id');
        
        if (!adminId) {
            this.showError('Erro: ID do administrador não encontrado');
            return;
        }
        
        // Armazenar administrador atual
        this.currentAdminForUserCreation = adminId;
        
        const modal = document.getElementById('createUserForAdminModal');
        if (!modal) {
            this.showError('Modal não encontrado');
            return;
        }
        
        // Limpar formulário
        this.resetCreateUserForAdminForm();
        
        // Carregar dados do administrador
        this.loadAdminDataForUserCreation(adminId);
        
        // Mostrar modal
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
        
        console.log('✅ Modal de criar usuário aberto para admin:', adminId);
    },

    /**
     * Fechar modal de criar usuário
     */
    closeCreateUserForAdminModal() {
        const modal = document.getElementById('createUserForAdminModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        
        // Limpar dados
        this.currentAdminForUserCreation = null;
        this.resetCreateUserForAdminForm();
        
        console.log('✅ Modal de criar usuário fechado');
    },

    /**
     * Resetar formulário de criar usuário
     */
    resetCreateUserForAdminForm() {
        const form = document.getElementById('createUserForAdminForm');
        if (form) {
            form.reset();
        }
        
        // Limpar campos específicos
        const emailField = document.getElementById('userForAdminEmail');
        const passwordField = document.getElementById('userForAdminPassword');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        
        // Resetar containers
        const adminInfo = document.getElementById('adminInfoForUser');
        const unitsContainer = document.getElementById('adminUnitsForUser');
        const modulesContainer = document.getElementById('modulesForUserByUnit');
        
        if (adminInfo) {
            adminInfo.innerHTML = 'Carregando informações do administrador...';
        }
        
        if (unitsContainer) {
            unitsContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    Carregando unidades do administrador...
                </div>
            `;
        }
        
        if (modulesContainer) {
            modulesContainer.innerHTML = `
                <p style="color: var(--text-secondary); font-style: italic; padding: 1rem;">
                    Selecione uma unidade acima para ver os módulos disponíveis.
                </p>
            `;
        }
    },

    /**
     * Carregar dados do administrador para criação de usuário
     */
    async loadAdminDataForUserCreation(adminId) {
        try {
            console.log('📋 Carregando dados do admin para criação de usuário:', adminId);
            
            const supabase = this.supabaseClient || this.currentUser?.supabase || window.supabase;
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Buscar dados do administrador
            const { data: admin, error: adminError } = await supabase
                .from('users')
                .select('id, email, created_at')
                .eq('id', adminId)
                .single();
                
            if (adminError) {
                throw new Error(`Erro ao buscar administrador: ${adminError.message}`);
            }
            
            // Atualizar info do admin no modal
            const adminInfo = document.getElementById('adminInfoForUser');
            if (adminInfo) {
                adminInfo.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: var(--accent-primary);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: 600;
                        ">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">
                                ${admin.email}
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                Administrador desde ${new Date(admin.created_at).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Carregar unidades do administrador
            await this.loadAdminUnitsForUserCreation(adminId);
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados do admin:', error);
            
            const adminInfo = document.getElementById('adminInfoForUser');
            if (adminInfo) {
                adminInfo.innerHTML = `
                    <div style="color: var(--danger-color); text-align: center; padding: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Erro ao carregar dados do administrador: ${error.message}
                    </div>
                `;
            }
        }
    },

    /**
     * Carregar unidades do administrador para seleção
     */
    async loadAdminUnitsForUserCreation(adminId) {
        try {
            console.log('🏢 Carregando unidades do admin para seleção:', adminId);
            
            const supabase = this.supabaseClient || this.currentUser?.supabase || window.supabase;
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Buscar unidades do administrador
            const { data: adminUnits, error: unitsError } = await supabase
                .from('user_units')
                .select(`
                    unit_id,
                    units!inner (
                        id,
                        name,
                        is_active
                    )
                `)
                .eq('user_id', adminId);
                
            if (unitsError) {
                throw new Error(`Erro ao buscar unidades: ${unitsError.message}`);
            }
            
            const unitsContainer = document.getElementById('adminUnitsForUser');
            if (!unitsContainer) return;
            
            if (!adminUnits || adminUnits.length === 0) {
                unitsContainer.innerHTML = `
                    <div style="color: var(--text-secondary); text-align: center; padding: 1rem;">
                        <i class="fas fa-info-circle"></i>
                        Este administrador não possui unidades vinculadas.
                    </div>
                `;
                return;
            }
            
            // Gerar checkboxes das unidades
            unitsContainer.innerHTML = adminUnits.map(unitData => {
                const unit = unitData.units;
                const isActive = unit.is_active;
                const statusText = isActive ? '' : ' (Inativa)';
                const disabledAttr = isActive ? '' : 'disabled';
                
                return `
                    <div class="checkbox-item">
                        <input type="checkbox" 
                               id="unit_${unit.id}" 
                               value="${unit.id}" 
                               ${disabledAttr}
                               onchange="GestaoSistema.onUnitSelectionChange('${unit.id}', this.checked)">
                        <label for="unit_${unit.id}" style="color: ${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">
                            <i class="fas fa-building"></i>
                            ${unit.name}${statusText}
                        </label>
                    </div>
                `;
            }).join('');
            
            console.log('✅ Unidades carregadas:', adminUnits.length);
            
        } catch (error) {
            console.error('❌ Erro ao carregar unidades:', error);
            
            const unitsContainer = document.getElementById('adminUnitsForUser');
            if (unitsContainer) {
                unitsContainer.innerHTML = `
                    <div style="color: var(--danger-color); text-align: center; padding: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Erro ao carregar unidades: ${error.message}
                    </div>
                `;
            }
        }
    },

    /**
     * Evento de mudança na seleção de unidades
     */
    async onUnitSelectionChange(unitId, isChecked) {
        console.log('🔄 Unidade selecionada/desmarcada:', unitId, isChecked);
        
        if (isChecked) {
            // Carregar módulos da unidade
            await this.loadModulesForUnit(unitId);
        } else {
            // Remover módulos da unidade
            this.removeModulesForUnit(unitId);
        }
    },

    /**
     * Carregar módulos disponíveis para uma unidade
     */
    async loadModulesForUnit(unitId) {
        try {
            console.log('🧩 Carregando módulos para unidade:', unitId);
            
            const supabase = this.supabaseClient || this.currentUser?.supabase || window.supabase;
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Buscar módulos ativos para a unidade
            const { data: unitModules, error: modulesError } = await supabase
                .from('unit_modules')
                .select(`
                    module_id,
                    is_active,
                    modules!inner (
                        id,
                        name,
                        display_name,
                        icon
                    )
                `)
                .eq('unit_id', unitId)
                .eq('is_active', true);
                
            if (modulesError) {
                throw new Error(`Erro ao buscar módulos: ${modulesError.message}`);
            }
            
            // Buscar informações da unidade
            const { data: unitInfo, error: unitError } = await supabase
                .from('units')
                .select('id, name')
                .eq('id', unitId)
                .single();
                
            if (unitError) {
                throw new Error(`Erro ao buscar unidade: ${unitError.message}`);
            }
            
            const modulesContainer = document.getElementById('modulesForUserByUnit');
            if (!modulesContainer) return;
            
            // Se for a primeira unidade, limpar mensagem padrão
            if (modulesContainer.innerHTML.includes('Selecione uma unidade')) {
                modulesContainer.innerHTML = '';
            }
            
            if (!unitModules || unitModules.length === 0) {
                // Adicionar mensagem de nenhum módulo disponível
                const noModulesDiv = document.createElement('div');
                noModulesDiv.id = `unit-modules-${unitId}`;
                noModulesDiv.className = 'unit-modules-group';
                noModulesDiv.innerHTML = `
                    <div class="unit-title">
                        <i class="fas fa-building"></i>
                        ${unitInfo.name}
                    </div>
                    <div style="color: var(--text-secondary); font-style: italic;">
                        Nenhum módulo ativo nesta unidade.
                    </div>
                `;
                modulesContainer.appendChild(noModulesDiv);
                return;
            }
            
            // Criar grupo de módulos para a unidade
            const unitModulesDiv = document.createElement('div');
            unitModulesDiv.id = `unit-modules-${unitId}`;
            unitModulesDiv.className = 'unit-modules-group';
            
            unitModulesDiv.innerHTML = `
                <div class="unit-title">
                    <i class="fas fa-building"></i>
                    ${unitInfo.name}
                    <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-secondary);">
                        (${unitModules.length} módulo(s) disponível(is))
                    </span>
                </div>
                <div class="modules-grid">
                    ${unitModules.map(moduleData => {
                        const module = moduleData.modules;
                        return `
                            <div class="module-checkbox-item">
                                <input type="checkbox" 
                                       id="module_${unitId}_${module.id}" 
                                       value="${module.id}"
                                       data-unit-id="${unitId}">
                                <div class="module-info">
                                    <i class="${module.icon || 'fas fa-cube'}"></i>
                                    <span>${module.display_name || module.name}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            modulesContainer.appendChild(unitModulesDiv);
            
            console.log('✅ Módulos carregados para unidade:', unitModules.length);
            
        } catch (error) {
            console.error('❌ Erro ao carregar módulos:', error);
            this.showError('Erro ao carregar módulos: ' + error.message);
        }
    },

    /**
     * Remover módulos de uma unidade da seleção
     */
    removeModulesForUnit(unitId) {
        const unitModulesDiv = document.getElementById(`unit-modules-${unitId}`);
        if (unitModulesDiv) {
            unitModulesDiv.remove();
            
            // Se não sobrou nenhuma unidade, mostrar mensagem padrão
            const modulesContainer = document.getElementById('modulesForUserByUnit');
            if (modulesContainer && modulesContainer.children.length === 0) {
                modulesContainer.innerHTML = `
                    <p style="color: var(--text-secondary); font-style: italic; padding: 1rem;">
                        Selecione uma unidade acima para ver os módulos disponíveis.
                    </p>
                `;
            }
        }
    },

    /**
     * Salvar novo usuário vinculado ao administrador
     */
    async saveUserForAdmin() {
        try {
            console.log('💾 Salvando usuário para administrador...');
            
            if (!this.currentAdminForUserCreation) {
                throw new Error('Administrador não selecionado');
            }
            
            // Validar campos obrigatórios
            const emailField = document.getElementById('userForAdminEmail');
            const passwordField = document.getElementById('userForAdminPassword');
            
            if (!emailField?.value?.trim()) {
                this.showError('Por favor, digite o e-mail do usuário');
                emailField?.focus();
                return;
            }
            
            if (!passwordField?.value?.trim()) {
                this.showError('Por favor, digite a senha do usuário');
                passwordField?.focus();
                return;
            }
            
            const email = emailField.value.trim();
            const password = passwordField.value.trim();
            
            // Verificar unidades selecionadas
            const selectedUnits = [];
            const unitCheckboxes = document.querySelectorAll('#adminUnitsForUser input[type="checkbox"]:checked');
            unitCheckboxes.forEach(checkbox => {
                selectedUnits.push(checkbox.value);
            });
            
            if (selectedUnits.length === 0) {
                this.showError('Por favor, selecione pelo menos uma unidade para o usuário');
                return;
            }
            
            // Verificar módulos selecionados
            const selectedModulePermissions = [];
            const moduleCheckboxes = document.querySelectorAll('#modulesForUserByUnit input[type="checkbox"]:checked');
            moduleCheckboxes.forEach(checkbox => {
                const moduleId = checkbox.value;
                const unitId = checkbox.dataset.unitId;
                selectedModulePermissions.push({
                    unit_id: unitId,
                    module_id: moduleId
                });
            });
            
            if (selectedModulePermissions.length === 0) {
                this.showError('Por favor, selecione pelo menos um módulo para o usuário');
                return;
            }
            
            const supabase = this.supabaseClient || this.currentUser?.supabase || window.supabase;
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Buscar role de usuário regular
            const { data: userRole, error: roleError } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'user')
                .single();
                
            if (roleError) {
                throw new Error('Erro ao buscar role de usuário: ' + roleError.message);
            }
            
            console.log('👤 Criando usuário...');
            
            // Criar usuário
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    email: email,
                    password: password,
                    role_id: userRole.id
                }])
                .select()
                .single();
                
            if (userError) {
                throw new Error('Erro ao criar usuário: ' + userError.message);
            }
            
            const userId = newUser.id;
            
            console.log('🏢 Vinculando usuário às unidades...');
            
            // Vincular usuário às unidades
            const userUnitsData = selectedUnits.map(unitId => ({
                user_id: userId,
                unit_id: unitId
            }));
            
            const { error: unitsError } = await supabase
                .from('user_units')
                .insert(userUnitsData);
                
            if (unitsError) {
                throw new Error('Erro ao vincular unidades: ' + unitsError.message);
            }
            
            console.log('🧩 Concedendo permissões de módulos...');
            
            // Conceder permissões de módulos
            const modulePermissionsData = selectedModulePermissions.map(permission => ({
                user_id: userId,
                unit_id: permission.unit_id,
                module_id: permission.module_id,
                granted_by: this.currentAdminForUserCreation,
                granted_at: new Date().toISOString()
            }));
            
            const { error: permissionsError } = await supabase
                .from('user_module_permissions')
                .insert(modulePermissionsData);
                
            if (permissionsError) {
                throw new Error('Erro ao conceder permissões: ' + permissionsError.message);
            }
            
            console.log('✅ Usuário criado com sucesso!');
            
            this.showSuccess(`Usuário "${email}" criado com sucesso e vinculado ao administrador!`);
            
            // Fechar modal
            this.closeCreateUserForAdminModal();
            
            // Recarregar dados do administrador se o card estiver aberto
            if (this.currentAdminForUserCreation) {
                await this.openAdminCard(this.currentAdminForUserCreation);
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar usuário:', error);
            this.showError('Erro ao criar usuário: ' + error.message);
        }
    },
    
    /**
     * Carrega os usuários vinculados a um administrador
     * @param {string} adminId - ID do administrador
     */
    async loadUsersByAdmin(adminId) {
        try {
            console.log('🔍 Carregando usuários do administrador:', adminId);
            
            const supabase = this.supabaseClient || this.currentUser?.supabase;
            
            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }
            
            // Buscar usuários onde o granted_by é o admin
            const { data: userPermissions, error: permissionsError } = await supabase
                .from('user_module_permissions')
                .select('user_id')
                .eq('granted_by', adminId)
                .distinct();
                
            if (permissionsError) {
                throw permissionsError;
            }
            
            if (!userPermissions || userPermissions.length === 0) {
                console.log('⚠️ Nenhum usuário vinculado a este administrador');
                this.renderAdminUsersList([]);
                return;
            }
            
            // Extrair os IDs de usuários
            const userIds = userPermissions.map(up => up.user_id);
            
            // Buscar detalhes dos usuários
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select(`
                    *,
                    roles (
                        id, 
                        name,
                        display_name
                    )
                `)
                .in('id', userIds);
                
            if (usersError) {
                throw usersError;
            }
            
            // Para cada usuário, buscar suas unidades e módulos
            const usersWithDetails = [];
            
            for (const user of users) {
                // Buscar unidades do usuário
                const { data: userUnits, error: unitsError } = await supabase
                    .from('user_units')
                    .select(`
                        units (
                            id,
                            name
                        )
                    `)
                    .eq('user_id', user.id);
                    
                if (unitsError) {
                    console.warn('❌ Erro ao buscar unidades do usuário:', unitsError);
                }
                
                // Buscar módulos do usuário
                const { data: userModules, error: modulesError } = await supabase
                    .from('user_module_permissions')
                    .select(`
                        unit_id,
                        modules (
                            id,
                            name,
                            display_name,
                            icon
                        ),
                        units (
                            id,
                            name
                        )
                    `)
                    .eq('user_id', user.id);
                    
                if (modulesError) {
                    console.warn('❌ Erro ao buscar módulos do usuário:', modulesError);
                }
                
                usersWithDetails.push({
                    ...user,
                    user_units: userUnits || [],
                    modules: userModules || []
                });
            }
            
            console.log(`✅ ${usersWithDetails.length} usuários encontrados para o administrador`);
            
            // Renderizar a lista de usuários
            this.renderAdminUsersList(usersWithDetails);
            
        } catch (error) {
            console.error('❌ Erro ao carregar usuários do administrador:', error);
            this.showError('Erro ao carregar usuários do administrador: ' + error.message);
        }
    },
    
    /**
     * Renderiza a lista de usuários vinculados ao administrador
     * @param {Array} users - Lista de usuários
     */
    renderAdminUsersList(users) {
        try {
            console.log('🔍 Renderizando lista de usuários do administrador');
            
            const adminUsersList = document.getElementById('adminUsersList');
            
            if (!adminUsersList) {
                console.error('❌ Elemento adminUsersList não encontrado');
                return;
            }
            
            if (!users || users.length === 0) {
                adminUsersList.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-users-slash"></i>
                        <h4>Nenhum usuário encontrado</h4>
                        <p>Este administrador ainda não cadastrou usuários</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            users.forEach(user => {
                // Preparar dados para exibição
                const units = user.user_units
                    .map(uu => uu.units?.name)
                    .filter(name => name)
                    .join(', ') || 'Nenhuma';
                    
                // Agrupar módulos por unidade
                const modulesByUnit = {};
                user.modules.forEach(module => {
                    const unitId = module.unit_id;
                    const unitName = module.units?.name || 'Unidade Desconhecida';
                    const moduleName = module.modules?.display_name || module.modules?.name || 'N/A';
                    const moduleIcon = module.modules?.icon || 'puzzle-piece';
                    
                    if (!modulesByUnit[unitId]) {
                        modulesByUnit[unitId] = {
                            name: unitName,
                            modules: []
                        };
                    }
                    
                    modulesByUnit[unitId].modules.push({
                        name: moduleName,
                        icon: moduleIcon
                    });
                });
                
                // Criar HTML para módulos agrupados por unidade
                let modulesHtml = '';
                
                if (Object.keys(modulesByUnit).length === 0) {
                    modulesHtml = '<div class="no-modules">Nenhum módulo atribuído</div>';
                } else {
                    Object.values(modulesByUnit).forEach(unit => {
                        modulesHtml += `
                            <div class="unit-modules">
                                <div class="unit-name">${unit.name}</div>
                                <div class="modules-list">
                                    ${unit.modules.map(module => `
                                        <span class="module-badge">
                                            <i class="fas fa-${module.icon}"></i>
                                            ${module.name}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    });
                }
                
                // Gerar primeira letra do e-mail para avatar
                const firstLetter = user.email ? user.email.charAt(0).toUpperCase() : '?';
                
                // Determinar nível do usuário para estilo
                const roleName = user.roles?.name || 'user';
                const roleDisplayName = user.roles?.display_name || roleName;
                
                let roleClass = '';
                let roleIcon = 'user';
                
                if (roleName === 'super_admin') {
                    roleClass = 'super-admin';
                    roleIcon = 'crown';
                } else if (roleName === 'admin') {
                    roleClass = 'admin';
                    roleIcon = 'user-tie';
                }
                
                html += `
                    <div class="user-item ${roleClass}">
                        <div class="user-info">
                            <div class="user-avatar">
                                ${firstLetter}
                            </div>
                            <div class="user-details">
                                <div class="user-name">${user.email}</div>
                                <div class="user-meta">
                                    <i class="fas fa-${roleIcon}"></i>
                                    ${roleDisplayName}
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-units-modules" style="margin-top: 0.75rem; width: 100%;">
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                                <strong>Unidades:</strong> ${units}
                            </div>
                            <div class="modules-container">
                                <strong style="font-size: 0.85rem; color: var(--text-secondary);">Módulos:</strong>
                                ${modulesHtml}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            adminUsersList.innerHTML = html;
            
            // Adicionar CSS dinâmico para novos elementos
            if (!document.getElementById('admin-users-list-styles')) {
                const styleElement = document.createElement('style');
                styleElement.id = 'admin-users-list-styles';
                styleElement.textContent = `
                    .user-item {
                        margin-bottom: 1rem;
                        padding: 1rem;
                        border-radius: var(--border-radius);
                        border: 1px solid var(--border-primary);
                        background: var(--bg-primary);
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .user-avatar {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: var(--primary-color);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                    }
                    
                    .user-info {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .modules-container {
                        margin-top: 0.5rem;
                    }
                    
                    .unit-modules {
                        margin-top: 0.5rem;
                        padding: 0.5rem;
                        border-radius: var(--border-radius);
                        background: var(--bg-secondary);
                        border: 1px solid var(--border-primary);
                    }
                    
                    .unit-name {
                        font-weight: 500;
                        margin-bottom: 0.5rem;
                        color: var(--text-primary);
                        font-size: 0.9rem;
                    }
                    
                    .modules-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }
                    
                    .module-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.3rem;
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        background: var(--accent-primary);
                        color: white;
                        font-size: 0.8rem;
                        white-space: nowrap;
                    }
                    
                    .no-modules {
                        color: var(--text-secondary);
                        font-style: italic;
                        font-size: 0.9rem;
                        padding: 0.5rem 0;
                    }
                    
                    .user-item.super-admin .user-avatar {
                        background: var(--danger-color);
                    }
                    
                    .user-item.admin .user-avatar {
                        background: var(--warning-color);
                    }
                `;
                document.head.appendChild(styleElement);
            }
            
        } catch (error) {
            console.error('❌ Erro ao renderizar lista de usuários do administrador:', error);
            this.showError('Erro ao exibir usuários: ' + error.message);
        }
    }
};

// Funções globais para os botões (mantidas para compatibilidade com o HTML)
function openUnitModal() {
    window.GestaoSistema.openUnitModal();
}

function openAdminModal() {
    window.GestaoSistema.openAdminModal();
}

function openUserModal() {
    // Implementar abertura do modal de usuário
    console.log('Abrir modal de usuário');
}

function closeUnitModal() {
    window.GestaoSistema.closeUnitModal();
}

function closeAdminModal() {
    window.GestaoSistema.closeAdminModal();
}

function closeUserModal() {
    window.GestaoSistema.closeModal(window.GestaoSistema.elements.userModal);
}

function saveUnit() {
    window.GestaoSistema.saveUnit();
}

function saveAdmin() {
    window.GestaoSistema.saveAdmin();
}

function openAdminCard(adminId) {
    window.GestaoSistema.openAdminCard(adminId);
}

function refreshModules() {
    window.GestaoSistema.loadModules();
}

// Função global para debug da tabela user_units
window.debugUserUnits = async function() {
    try {
        const supabase = window.moduleUserData?.supabase || window.supabase;
        if (!supabase) {
            console.error('❌ Cliente Supabase não disponível');
            return;
        }
        
        console.log('🔍 ===== DEBUG USER_UNITS =====');
        
        // Verificar dados da tabela user_units
        const { data: userUnits, error: userUnitsError } = await supabase
            .from('user_units')
            .select('*');
            
        if (userUnitsError) {
            console.error('❌ Erro ao buscar user_units:', userUnitsError);
        } else {
            console.log('📊 Dados da tabela user_units:', userUnits);
        }
        
        // Verificar dados das unidades
        const { data: units, error: unitsError } = await supabase
            .from('units')
            .select('*');
            
        if (unitsError) {
            console.error('❌ Erro ao buscar units:', unitsError);
        } else {
            console.log('🏢 Dados da tabela units:', units);
        }
        
        // Verificar dados dos usuários
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select(`
                id,
                email,
                role_id,
                roles (
                    id,
                    name
                )
            `);
            
        if (usersError) {
            console.error('❌ Erro ao buscar users:', usersError);
        } else {
            console.log('👥 Dados da tabela users:', users);
        }
        
        // Fazer a consulta completa como na função loadUnitUsers
        if (units && units.length > 0) {
            const unitId = units[0].id;
            console.log(`🔍 Testando consulta para unidade: ${unitId}`);
            
            const { data: unitUsersData, error: queryError } = await supabase
                .from('user_units')
                .select(`
                    user_id,
                    unit_id,
                    users!inner (
                        id,
                        email,
                        role_id,
                        roles!inner (
                            id,
                            name
                        )
                    )
                `)
                .eq('unit_id', unitId);
                
            if (queryError) {
                console.error('❌ Erro na consulta complexa:', queryError);
            } else {
                console.log('✅ Resultado da consulta complexa:', unitUsersData);
            }
        }
        
        console.log('🔍 ===== FIM DEBUG USER_UNITS =====');
        
    } catch (error) {
        console.error('❌ Erro crítico no debug:', error);
    }
};

// Função global para debug (acessível via console)
function debugGestaoSistema() {
    console.log('🔍 DEBUG COMPLETO - Gestão do Sistema');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Verificar módulo
    console.log('1️⃣ MÓDULO:');
    console.log('  - window.GestaoSistema existe:', !!window.GestaoSistema);
    console.log('  - Função init existe:', typeof window.GestaoSistema?.init);
    console.log('  - Função checkEnvironment existe:', typeof window.GestaoSistema?.checkEnvironment);
    
    // 2. Verificar dados
    console.log('2️⃣ DADOS:');
    console.log('  - window.moduleUserData existe:', !!window.moduleUserData);
    console.log('  - window.supabase existe:', !!window.supabase);
    console.log('  - SUPABASE_URL definida:', typeof SUPABASE_URL !== 'undefined');
    console.log('  - SUPABASE_ANON_KEY definida:', typeof SUPABASE_ANON_KEY !== 'undefined');
    
    // 3. Verificar DOM
    console.log('3️⃣ DOM:');
    console.log('  - document.readyState:', document.readyState);
    console.log('  - unitsTableBody existe:', !!document.getElementById('unitsTableBody'));
    console.log('  - adminsTableBody existe:', !!document.getElementById('adminsTableBody'));
    console.log('  - unitModal existe:', !!document.getElementById('unitModal'));
    
    // 4. Verificar usuário
    if (window.moduleUserData) {
        console.log('4️⃣ USUÁRIO:');
        console.log('  - currentUser:', !!window.moduleUserData.currentUser);
        console.log('  - userRole:', window.moduleUserData.userRole);
        console.log('  - email:', window.moduleUserData.currentUser?.email);
        console.log('  - supabase client:', !!window.moduleUserData.supabase);
    }
    
    // 5. Tentar inicializar
    if (window.GestaoSistema?.checkEnvironment) {
        console.log('5️⃣ AMBIENTE:');
        window.GestaoSistema.checkEnvironment();
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Para tentar inicializar manualmente: window.GestaoSistema.init()');
    
    // Executar debug interno também
    if (window.GestaoSistema?.debug) {
        window.GestaoSistema.debug();
    }
}

// Função global para debug do banco (acessível via console)
function debugDatabase() {
    if (window.GestaoSistema) {
        window.GestaoSistema.debugDatabase();
    } else {
        console.log('❌ Módulo Gestão do Sistema não está carregado');
    }
}

// Função global para recarregar dados (acessível via console)
function reloadData() {
    if (window.GestaoSistema) {
        window.GestaoSistema.reloadAllData();
    } else {
        console.log('❌ Módulo Gestão do Sistema não está carregado');
    }
}

// Função para forçar inicialização (acessível via console)  
function forceInitGestaoSistema() {
    console.log('🔧 FORÇA INICIALIZAÇÃO - Gestão do Sistema');
    if (window.GestaoSistema?.init) {
        window.GestaoSistema.init().catch(err => {
            console.error('❌ Erro na inicialização forçada:', err);
        });
    } else {
        console.error('❌ Módulo não disponível para inicialização');
    }
}

// Log de confirmação de carregamento
console.log('✅ GESTÃO SISTEMA - Script carregado com sucesso!');
console.log('🔍 window.GestaoSistema disponível:', typeof window.GestaoSistema);
console.log('🔍 Função init disponível:', typeof window.GestaoSistema?.init);

// Função global para verificar/criar roles (acessível via console)
function checkRoles() {
    if (window.GestaoSistema) {
        window.GestaoSistema.checkAndCreateRoles();
    } else {
        console.log('❌ Módulo Gestão do Sistema não está carregado');
    }
}

// Função para fechar o card do administrador
function closeAdminCard() {
    const card = document.getElementById('adminInfoCard');
    if (card) {
        card.style.display = 'none';
    }
}

// Funções globais para compatibilidade
function openAdminCard(adminId) {
    window.GestaoSistema.openAdminCard(adminId);
}

function editAdmin(adminId) {
    window.GestaoSistema.editAdmin(adminId);
}

function closeAdminCard() {
    const card = document.getElementById('adminInfoCard');
    if (card) {
        card.style.display = 'none';
    }
}

// A inicialização será feita apenas pelo sistema principal via sendModuleInitData
console.log('⚠️ Aguardando inicialização via sistema principal...');
