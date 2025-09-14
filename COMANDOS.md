# Comandos de Instalación y Configuración

## Requisitos Previos
- Node.js 18+ instalado
- MySQL Server corriendo en 192.168.1.50:3306
- Git (opcional)

## Instalación del Proyecto

### 1. Clonar o descargar el proyecto
\`\`\`bash
# Si tienes el código en Git
git clone <tu-repositorio>
cd debt-tracker

# O si descargaste el ZIP
unzip debt-tracker.zip
cd debt-tracker
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
# Instalar todas las dependencias del proyecto
npm install

# O si prefieres yarn
yarn install
\`\`\`

### 3. Configurar variables de entorno
\`\`\`bash
# El archivo .env.local ya está configurado con tus credenciales:
# DB_HOST=192.168.1.50
# DB_USER=root
# DB_PASSWORD=user123$
# DB_NAME=cobros_db
# DB_PORT=3306
# JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# IMPORTANTE: Cambia JWT_SECRET por una clave segura en producción
\`\`\`

### 4. Configurar la base de datos
\`\`\`bash
# Ejecutar el script de creación de base de datos
mysql -h 192.168.1.50 -u root -p < scripts/create-database.sql

# Te pedirá la contraseña: user123$
\`\`\`

### 5. Iniciar el proyecto en desarrollo
\`\`\`bash
# Iniciar el servidor de desarrollo
npm run dev

# O con yarn
yarn dev
\`\`\`

### 6. Acceder a la aplicación
\`\`\`
Abre tu navegador en: http://localhost:3000

Credenciales de prueba:
- Email: admin@debttracker.com
- Password: admin123
\`\`\`

## Comandos Adicionales

### Desarrollo
\`\`\`bash
# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm run start

# Linting del código
npm run lint
\`\`\`

### Base de Datos
\`\`\`bash
# Recrear la base de datos (CUIDADO: borra todos los datos)
npm run db:setup
\`\`\`

### Librerías Externas Incluidas
- **jsPDF**: Generación de PDFs
- **html2canvas**: Captura de HTML para PDF
- **mysql2**: Conexión a MySQL
- **recharts**: Gráficos y charts
- **date-fns**: Manejo de fechas
- **zod**: Validación de datos
- **react-hook-form**: Formularios
- **lucide-react**: Iconos
- **tailwindcss**: Estilos

### Instalación Manual de Librerías (si es necesario)
\`\`\`bash
# Para PDFs
npm install jspdf html2canvas

# Para base de datos
npm install mysql2

# Para formularios
npm install react-hook-form @hookform/resolvers zod

# Para gráficos
npm install recharts

# Para fechas
npm install date-fns

# Para iconos
npm install lucide-react
\`\`\`

## Estructura del Proyecto
\`\`\`
debt-tracker/
├── app/                    # Páginas de Next.js
├── components/            # Componentes reutilizables
├── contexts/             # Contextos de React
├── lib/                  # Utilidades y configuración
├── scripts/              # Scripts de base de datos
├── .env.local           # Variables de entorno
└── package.json         # Dependencias
\`\`\`

## Solución de Problemas

### Error de conexión a MySQL
1. Verifica que MySQL esté corriendo en 192.168.1.50:3306
2. Confirma las credenciales en .env.local
3. Asegúrate de que el usuario 'root' tenga permisos remotos

### Error de dependencias
\`\`\`bash
# Limpiar cache e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Puerto ocupado
\`\`\`bash
# Cambiar puerto (por defecto 3000)
npm run dev -- -p 3001
