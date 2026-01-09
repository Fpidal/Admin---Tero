# Administración Tero

Dashboard de gestión financiera y administrativa para el restaurante Tero.

## Características

- **Dashboard** - Vista general con métricas financieras, gráficos de gastos y próximos vencimientos
- **Facturas** - CRUD completo con filtros por estado, proveedor, mes y año
- **Proveedores** - Gestión con categorías, condiciones de pago y datos de contacto
- **Pago Proveedores** - Registro de pagos totales o parciales de facturas
- **Órdenes de Pago** - Sistema de órdenes de pago para control de egresos
- **Notas de Crédito** - Gestión de NC con asignación opcional a facturas
- **Empleados** - CRUD con datos personales, puesto, sueldo y datos bancarios
- **Pago Empleados** - Registro de pagos de sueldos por mes
- **Pagos** - Historial completo de pagos con filtros
- **Informes** - Saldo por proveedor, anulaciones, modificaciones, compras por proveedor/rubro, pagos del mes

## Tecnologías

- **Frontend**: React 18 + Vite
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **PDF**: jsPDF + jspdf-autotable

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/admin-tero.git

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Iniciar servidor de desarrollo
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Genera build de producción |
| `npm run preview` | Preview del build de producción |

## Base de Datos

### Tablas principales

- **proveedores** - Datos de proveedores (nombre, categoría, condición de pago, contacto, datos bancarios)
- **facturas** - Facturas de proveedores (número, monto, fecha, vencimiento, estado)
- **empleados** - Datos de empleados (nombre, documento, puesto, sueldo, datos bancarios)
- **pagos** - Registro de todos los pagos (facturas, sueldos, otros)
- **notas_credito** - Notas de crédito de proveedores
- **ordenes_pago** - Órdenes de pago generadas
- **anulaciones** - Registro de pagos anulados
- **modificaciones** - Historial de modificaciones de montos

### Categorías de Proveedores

- Pescadería
- Carnes
- Bodega
- Almacén
- Verduras
- Arreglos
- Bebidas
- Otros

### Condiciones de Pago

- Contado
- 7 días
- 15 días
- 21 días
- 30 días
- 45 días
- 60 días

## Funcionalidades Destacadas

- Autenticación con contraseña
- Auto-cálculo de vencimiento según condición de pago del proveedor
- Detección de facturas duplicadas
- Registro automático de anulaciones y modificaciones
- Generación de informes en PDF
- Separador de miles en campos numéricos
- Filtros avanzados por fecha, proveedor, categoría y estado
- Responsive design para móviles

## Deploy

Push a `main` → Vercel hace deploy automático

## Estructura del Proyecto

```
admin-tero/
├── src/
│   ├── App.jsx        # Componente principal con toda la lógica
│   ├── main.jsx       # Punto de entrada de React
│   ├── supabase.js    # Configuración de Supabase
│   └── index.css      # Estilos globales y Tailwind
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Licencia

Proyecto privado - Restaurante Tero
