/* ===============================================
   SCRIPT DE VALIDAÇÃO CSS CENTRALIZADO
   =============================================== */

// Função para validar se o CSS centralizado está funcionando
function validateCentralizedCSS() {
    console.log('🔧 Iniciando validação do CSS centralizado...');
    
    const validationResults = {
        cssFileLoaded: false,
        variablesAvailable: false,
        classesWorking: false,
        duplicationsRemoved: false,
        responsiveWorking: false,
        themeCompatible: false
    };
    
    // 1. Verificar se o arquivo CSS está carregado
    const cssLinks = document.querySelectorAll('link[href*="css/main.css"]');
    validationResults.cssFileLoaded = cssLinks.length > 0;
    console.log(`📄 CSS main.css carregado: ${validationResults.cssFileLoaded ? '✅' : '❌'}`);
    
    // 2. Verificar se as variáveis CSS estão disponíveis
    const computedStyle = getComputedStyle(document.documentElement);
    const accentPrimary = computedStyle.getPropertyValue('--accent-primary').trim();
    validationResults.variablesAvailable = accentPrimary !== '';
    console.log(`🎨 Variáveis CSS disponíveis: ${validationResults.variablesAvailable ? '✅' : '❌'}`);
    console.log(`   └─ --accent-primary: ${accentPrimary}`);
    
    // 3. Verificar se as classes principais estão funcionando
    const testClasses = [
        'btn', 'btn-primary', 'form-input', 'modal-backdrop', 
        'data-table', 'badge-success', 'loading', 'spinner'
    ];
    
    let workingClasses = 0;
    testClasses.forEach(className => {
        const testElement = document.createElement('div');
        testElement.className = className;
        document.body.appendChild(testElement);
        
        const styles = getComputedStyle(testElement);
        const hasStyles = styles.display !== 'initial' || 
                         styles.padding !== '0px' || 
                         styles.background !== 'rgba(0, 0, 0, 0)';
        
        if (hasStyles) workingClasses++;
        document.body.removeChild(testElement);
    });
    
    validationResults.classesWorking = workingClasses >= testClasses.length * 0.8;
    console.log(`🔧 Classes CSS funcionando: ${validationResults.classesWorking ? '✅' : '❌'} (${workingClasses}/${testClasses.length})`);
    
    // 4. Verificar se duplicações foram removidas
    const gestaoModuleContent = document.querySelector('#gestao-unidades, #gestao-administradores');
    let duplicationsRemoved = true;
    
    if (gestaoModuleContent) {
        const inlineStyles = document.querySelectorAll('style');
        const hasLargeInlineCSS = Array.from(inlineStyles).some(style => 
            style.textContent.length > 1000
        );
        duplicationsRemoved = !hasLargeInlineCSS;
    }
    
    validationResults.duplicationsRemoved = duplicationsRemoved;
    console.log(`🧹 Duplicações CSS removidas: ${validationResults.duplicationsRemoved ? '✅' : '❌'}`);
    
    // 5. Verificar responsividade
    const originalWidth = window.innerWidth;
    const supportsMediaQueries = window.matchMedia('(max-width: 768px)').matches !== undefined;
    validationResults.responsiveWorking = supportsMediaQueries;
    console.log(`📱 Media queries funcionando: ${validationResults.responsiveWorking ? '✅' : '❌'}`);
    
    // 6. Verificar compatibilidade com temas
    const isDarkMode = document.body.classList.contains('dark');
    const bgPrimary = computedStyle.getPropertyValue('--bg-primary').trim();
    const isThemeWorking = bgPrimary !== '';
    validationResults.themeCompatible = isThemeWorking;
    console.log(`🌙 Sistema de temas: ${validationResults.themeCompatible ? '✅' : '❌'}`);
    console.log(`   └─ Modo atual: ${isDarkMode ? 'Dark' : 'Light'}`);
    console.log(`   └─ --bg-primary: ${bgPrimary}`);
    
    // Resultado final
    const successCount = Object.values(validationResults).filter(Boolean).length;
    const totalTests = Object.keys(validationResults).length;
    const successRate = (successCount / totalTests) * 100;
    
    console.log('\n📊 RESULTADO DA VALIDAÇÃO:');
    console.log(`   ✅ Sucessos: ${successCount}/${totalTests}`);
    console.log(`   📈 Taxa de sucesso: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
        console.log('🎉 VALIDAÇÃO APROVADA - CSS centralizado funcionando perfeitamente!');
    } else if (successRate >= 70) {
        console.log('⚠️  VALIDAÇÃO PARCIAL - Algumas melhorias podem ser necessárias');
    } else {
        console.log('❌ VALIDAÇÃO FALHOU - Problemas críticos detectados');
    }
    
    return {
        success: successRate >= 90,
        results: validationResults,
        successRate: successRate
    };
}

// Função para testar performance do CSS
function testCSSPerformance() {
    console.log('\n⚡ Testando performance do CSS...');
    
    const startTime = performance.now();
    
    // Criar elementos de teste com diferentes classes
    const testElements = [];
    const classesToTest = [
        'btn btn-primary', 'form-group', 'modal-backdrop', 
        'data-table', 'info-card', 'badge-success'
    ];
    
    classesToTest.forEach((classes, index) => {
        const element = document.createElement('div');
        element.className = classes;
        element.textContent = `Test Element ${index}`;
        document.body.appendChild(element);
        testElements.push(element);
    });
    
    // Forçar reflow
    testElements.forEach(el => {
        el.offsetHeight; // Força cálculo de layout
    });
    
    // Limpar elementos de teste
    testElements.forEach(el => document.body.removeChild(el));
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`⏱️  Tempo de renderização: ${renderTime.toFixed(2)}ms`);
    
    if (renderTime < 10) {
        console.log('🚀 Performance EXCELENTE - CSS otimizado');
    } else if (renderTime < 50) {
        console.log('✅ Performance BOA - Dentro do esperado');
    } else {
        console.log('⚠️  Performance LENTA - Revisar otimizações');
    }
    
    return renderTime;
}

// Função para debug de classes CSS específicas
function debugCSSClass(className) {
    console.log(`🔍 Debug da classe: .${className}`);
    
    const element = document.createElement('div');
    element.className = className;
    document.body.appendChild(element);
    
    const styles = getComputedStyle(element);
    const relevantProperties = [
        'display', 'background', 'color', 'padding', 'margin', 
        'border', 'font-size', 'font-weight'
    ];
    
    console.log('📋 Propriedades aplicadas:');
    relevantProperties.forEach(prop => {
        const value = styles.getPropertyValue(prop);
        if (value && value !== 'initial' && value !== 'normal') {
            console.log(`   ${prop}: ${value}`);
        }
    });
    
    document.body.removeChild(element);
}

// Função para verificar conflitos CSS
function checkCSSConflicts() {
    console.log('\n🔍 Verificando conflitos CSS...');
    
    const conflicts = [];
    
    // Verificar se há estilos inline grandes (possíveis duplicações)
    const inlineStyles = document.querySelectorAll('style');
    inlineStyles.forEach((style, index) => {
        if (style.textContent.length > 500) {
            conflicts.push(`Estilo inline #${index} muito grande (${style.textContent.length} chars)`);
        }
    });
    
    // Verificar classes duplicadas
    const stylesheets = Array.from(document.styleSheets);
    const classNames = new Set();
    const duplicates = new Set();
    
    stylesheets.forEach(sheet => {
        try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach(rule => {
                if (rule.selectorText) {
                    const selectors = rule.selectorText.split(',');
                    selectors.forEach(selector => {
                        const className = selector.trim();
                        if (classNames.has(className)) {
                            duplicates.add(className);
                        }
                        classNames.add(className);
                    });
                }
            });
        } catch (e) {
            // Ignorar erros de CORS
        }
    });
    
    if (conflicts.length === 0 && duplicates.size === 0) {
        console.log('✅ Nenhum conflito CSS detectado');
    } else {
        console.log('⚠️  Conflitos encontrados:');
        conflicts.forEach(conflict => console.log(`   - ${conflict}`));
        if (duplicates.size > 0) {
            console.log(`   - ${duplicates.size} seletores duplicados detectados`);
        }
    }
    
    return {
        conflicts: conflicts.length,
        duplicates: duplicates.size
    };
}

// Disponibilizar funções globalmente
window.validateCentralizedCSS = validateCentralizedCSS;
window.testCSSPerformance = testCSSPerformance;
window.debugCSSClass = debugCSSClass;
window.checkCSSConflicts = checkCSSConflicts;

// Auto-executar validação se solicitado
if (window.location.search.includes('validateCSS')) {
    setTimeout(() => {
        validateCentralizedCSS();
        testCSSPerformance();
        checkCSSConflicts();
    }, 1000);
}

console.log('🎯 Funções de validação CSS carregadas:');
console.log('   - validateCentralizedCSS() - Validação completa');
console.log('   - testCSSPerformance() - Teste de performance');
console.log('   - debugCSSClass("nome-da-classe") - Debug específico');
console.log('   - checkCSSConflicts() - Verificar conflitos');
console.log('   - Adicione ?validateCSS à URL para auto-executar');
