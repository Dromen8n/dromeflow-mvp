# DromeFlow MVP - Servidor Local

Este projeto inclui scripts para iniciar um servidor HTTP local e resolver problemas de CORS.

## 🚀 Como Iniciar o Servidor

### Opção 1: Script Automático (Recomendado)
```bash
./start.sh
```

### Opção 2: Python Direto
```bash
python3 start-server.py
```

### Opção 3: Servidor HTTP Simples
```bash
python3 -m http.server 8080
```

## 🌐 Acessar o Sistema

Após iniciar o servidor, acesse:
- **URL**: http://localhost:8080
- **Arquivo principal**: index.html será carregado automaticamente

## ⚡ Funcionalidades do Servidor

- ✅ **Resolve problemas de CORS**
- ✅ **Suporte completo ao Supabase**
- ✅ **Carregamento de módulos dinâmicos**
- ✅ **Abertura automática do navegador**
- ✅ **Headers de segurança apropriados**

## 🛑 Parar o Servidor

Pressione `Ctrl + C` no terminal onde o servidor está rodando.

## 🔧 Solução de Problemas

### Porta ocupada:
```bash
# Verificar o que está usando a porta
lsof -i :8080

# Matar processo na porta (se necessário)
lsof -ti:8080 | xargs kill
```

### Python não encontrado:
- **macOS**: Python 3 já vem instalado
- **Verificar**: `python3 --version`

## 📁 Estrutura de Arquivos

```
DromeFlow - MVP/
├── index.html              # Arquivo principal
├── start.sh               # Script de inicialização
├── start-server.py        # Servidor Python customizado
├── modules/               # Módulos do sistema
├── js/                    # JavaScript
└── css/                   # Estilos
```
