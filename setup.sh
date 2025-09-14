#!/bin/bash

echo "🚀 Configurando Sistema de Gestión de Deudas..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL no está instalado. Por favor instala MySQL 8.0+ primero."
    exit 1
fi

echo "✅ Prerrequisitos verificados"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Configurar archivo de entorno
if [ ! -f .env.local ]; then
    echo "⚙️ Configurando variables de entorno..."
    cp .env.local .env.local.example
    echo "📝 Por favor edita .env.local con tus credenciales de MySQL"
else
    echo "✅ Archivo .env.local ya existe"
fi

# Configurar base de datos
echo "🗄️ ¿Deseas configurar la base de datos ahora? (y/n)"
read -r setup_db

if [ "$setup_db" = "y" ] || [ "$setup_db" = "Y" ]; then
    echo "Ingresa tu contraseña de MySQL root:"
    mysql -u root -p < scripts/create-database.sql
    echo "✅ Base de datos configurada"
fi

echo ""
echo "🎉 ¡Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita .env.local con tus credenciales de MySQL"
echo "2. Ejecuta: npm run dev"
echo "3. Visita: http://localhost:3000"
echo "4. Login: admin@debttracker.com / admin123"
echo ""
echo "📚 Lee README.md para más información"
