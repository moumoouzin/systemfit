#!/bin/bash

echo "🚀 DEPLOY SYSTEMFIT PWA NO VERCEL"
echo "=================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

echo "✅ Node.js e npm encontrados"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Instalar canvas se necessário
echo "🎨 Verificando canvas..."
if ! npm list canvas &> /dev/null; then
    echo "📦 Instalando canvas..."
    npm install canvas
fi

# Criar ícones PNG
echo "🖼️  Criando ícones PNG..."
node criar-icones.js

# Verificar se os ícones foram criados
if [ ! -f "public/pwa-192x192.png" ] || [ ! -f "public/pwa-512x512.png" ]; then
    echo "❌ Erro: Ícones PNG não foram criados"
    echo "💡 Use o arquivo gerar-icones.html como alternativa"
    exit 1
fi

echo "✅ Ícones PNG criados com sucesso"

# Build de produção
echo "🔨 Fazendo build de produção..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou - pasta dist não encontrada"
    exit 1
fi

echo "✅ Build concluído com sucesso"

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

echo "🚀 Iniciando deploy no Vercel..."
echo "💡 Siga as instruções na tela:"
echo "   1. Faça login na sua conta Vercel"
echo "   2. Selecione 'Create new project'"
echo "   3. Escolha o repositório systemfit"
echo "   4. Configure:"
echo "      - Framework: Vite"
echo "      - Build Command: npm run build"
echo "      - Output Directory: dist"
echo "   5. Clique em 'Deploy'"

vercel --prod

echo "🎉 Deploy concluído!"
echo "📱 Teste o PWA na URL fornecida pelo Vercel"
echo "🔍 Verifique: https://sua-url.vercel.app/settings" 