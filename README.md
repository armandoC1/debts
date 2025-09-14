# Sistema de Gestión de Deudas de Clientes

Una aplicación web completa desarrollada en Next.js para gestionar deudas y pagos de clientes con sistema de roles y dashboard interactivo.

## Características

- **Sistema de Autenticación**: Login con roles (Admin/Superadmin) y sesiones de 30 días
- **Dashboard Interactivo**: Gráficas de pagos diarios y estadísticas en tiempo real
- **Gestión de Usuarios**: Solo superadmins pueden crear y gestionar usuarios
- **Gestión de Clientes**: CRUD completo con búsqueda y filtros
- **Gestión de Deudas**: Registro automático de fecha/hora y usuario creador
- **Gestión de Pagos**: Comparativa con deudas y registro de usuario receptor
- **Historial Detallado**: Visualización completa por cliente con gráficos

## Tecnologías

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Base de Datos**: MySQL
- **Gráficos**: Recharts
- **Formularios**: React Hook Form + Zod

## Instalación

### Prerrequisitos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
\`\`\`bash
git clone <tu-repositorio>
cd debt-tracker-app
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

3. **Configurar base de datos**
\`\`\`bash
# Crear la base de datos MySQL
mysql -u root -p < scripts/create-database.sql
\`\`\`

4. **Configurar variables de entorno**
\`\`\`bash
# Copiar el archivo de ejemplo
cp .env.local.example .env.local

# Editar .env.local con tus credenciales
DATABASE_URL="mysql://tu_usuario:tu_password@localhost:3306/debt_tracker"
JWT_SECRET="tu-clave-secreta-jwt-aqui"
\`\`\`

5. **Ejecutar en desarrollo**
\`\`\`bash
npm run dev
\`\`\`

6. **Acceder a la aplicación**
- URL: http://localhost:3000
- Usuario: admin@debttracker.com
- Contraseña: admin123

## Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en producción
- `npm run lint` - Verificar código
- `npm run db:setup` - Configurar base de datos

## Estructura del Proyecto

\`\`\`
├── app/                    # Páginas de Next.js App Router
│   ├── dashboard/         # Dashboard principal
│   ├── clients/           # Gestión de clientes
│   ├── debts/            # Gestión de deudas
│   ├── payments/         # Gestión de pagos
│   └── users/            # Gestión de usuarios
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes de UI (shadcn)
│   └── ...
├── contexts/            # Contextos de React
├── lib/                # Utilidades y configuración
├── scripts/            # Scripts de base de datos
└── data/              # Datos de ejemplo (desarrollo)
\`\`\`

## Roles y Permisos

### Superadmin
- Crear y gestionar usuarios
- Asignar roles a usuarios
- Todas las funciones de Admin

### Admin
- Gestionar clientes (crear, ver, editar)
- Gestionar deudas (crear, ver)
- Gestionar pagos (crear, ver)
- Ver dashboard y estadísticas

## Paleta de Colores

- **Primario**: Azul oscuro profesional (#1e40af)
- **Secundario**: Gris claro (#f8fafc)
- **Acento**: Verde éxito (#10b981)
- **Destructivo**: Rojo alerta (#ef4444)
- **Neutros**: Blancos y grises para fondos y texto

## Sugerencias de Mejora

1. **Notificaciones Push**: Alertas para pagos vencidos
2. **Exportación de Reportes**: PDF/Excel de estadísticas
3. **Sistema de Recordatorios**: Emails automáticos a clientes
4. **Backup Automático**: Respaldo programado de datos
5. **API REST**: Endpoints para integraciones externas
6. **Modo Offline**: Funcionalidad básica sin conexión
7. **Auditoría**: Log de todas las acciones de usuarios

## Soporte

Para soporte técnico o reportar bugs, contacta al administrador del sistema.
