#!/bin/bash

# Script para iniciar o servidor DromeFlow MVP
# Resolve problemas de CORS ao acessar arquivos locais

echo "🚀 Iniciando DromeFlow MVP Server..."

# Verificar se Python está disponível
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python não encontrado. Instale Python 3 para continuar."
    exit 1
fi

echo "🐍 Usando: $PYTHON_CMD"

# Verificar se estamos no diretório correto
if [ ! -f "index.html" ]; then
    echo "❌ Erro: arquivo index.html não encontrado"
    echo "   Execute este script na pasta do projeto DromeFlow MVP"
    exit 1
fi

# Iniciar servidor
echo "🌐 Iniciando servidor HTTP..."
echo "💡 Para parar: Ctrl+C"
echo ""

$PYTHON_CMD start-server.py
