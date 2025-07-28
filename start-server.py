#!/usr/bin/env python3
"""
Servidor HTTP simples para DromeFlow MVP
Para resolver problemas de CORS ao acessar arquivos locais
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configurações do servidor
PORT = 8080
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler customizado para adicionar headers CORS se necessário"""
    
    def end_headers(self):
        # Adicionar headers CORS para evitar problemas futuros
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server():
    """Iniciar o servidor HTTP"""
    
    # Verificar se estamos no diretório correto
    if not os.path.exists('index.html'):
        print("❌ Erro: arquivo index.html não encontrado no diretório atual")
        print(f"   Diretório atual: {os.getcwd()}")
        print("   Certifique-se de executar este script na pasta do projeto")
        sys.exit(1)
    
    # Configurar o servidor
    try:
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            url = f"http://{HOST}:{PORT}"
            
            print("🚀 ===== DROMEFLOW MVP SERVER =====")
            print(f"🌐 Servidor iniciado em: {url}")
            print(f"📁 Servindo arquivos de: {os.getcwd()}")
            print("💡 Para parar o servidor: Ctrl+C")
            print("=" * 40)
            
            # Tentar abrir automaticamente no navegador
            try:
                print(f"🔓 Abrindo navegador automaticamente...")
                webbrowser.open(url)
            except Exception as e:
                print(f"⚠️  Não foi possível abrir o navegador automaticamente: {e}")
                print(f"   Abra manualmente: {url}")
            
            print(f"✅ Servidor rodando - acesse {url}")
            print("   Pressione Ctrl+C para parar")
            
            # Manter o servidor rodando
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Erro: Porta {PORT} já está em uso")
            print("   Tente fechar outros servidores ou use outra porta")
            print("   Ou mate o processo: lsof -ti:8080 | xargs kill")
        else:
            print(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Servidor interrompido pelo usuário")
        print("✅ Servidor parado com sucesso")

if __name__ == "__main__":
    start_server()
