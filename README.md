# Administración Tero

Dashboard de gestión financiera y administrativa para el restaurante Tero.

## Características

- **Dashboard** - Vista general con métricas financieras, gráficos de gastos y próximos vencimientos
- **Ingresos** - Gestión de ventas con facturas, cobros, clientes y cuenta corriente
- **Facturas** - CRUD completo con filtros por estado, proveedor, mes y año
- **Proveedores** - Gestión con categorías, condiciones de pago, código autogenerado (PROV-0001)
- **Pago Proveedores** - Registro de pagos con filtros (ayer, últimos 7 días, mes, año) y conciliación bancaria
- **Órdenes de Pago** - Sistema de órdenes de pago para control de egresos
- **Notas de Crédito** - Gestión de NC con asignación opcional a facturas
- **Empleados** - CRUD con datos personales, puesto, sueldo y datos bancarios
- **Pago Empleados** - Registro de pagos de sueldos por mes
- **Pagos** - Historial completo de pagos con filtros
- **Informes** - Saldo por proveedor, anulaciones, modificaciones, compras por proveedor/rubro, pagos del mes

## Tecnologías

- **Frontend**: React 18 + Vite
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL) con RLS habilitado
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **PDF**: jsPDF + jspdf-autotable

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Fpidal/Admin---Tero.git

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

**Egresos:**
- **proveedores** - Datos de proveedores con código autogenerado (PROV-0001, PROV-0002, etc.)
- **facturas** - Facturas de proveedores (número, monto, fecha, vencimiento, estado)
- **pagos** - Registro de todos los pagos (facturas, sueldos, otros) con conciliación bancaria
- **notas_credito** - Notas de crédito de proveedores
- **ordenes_pago** - Órdenes de pago generadas

**Ingresos:**
- **clientes** - Datos de clientes con código autogenerado (CLI-0001, CLI-0002, etc.)
- **facturas_venta** - Facturas de venta con estado automático al cobrar
- **cobros** - Registro de cobros de clientes
- **notas_credito_venta** - Notas de crédito de venta

**Empleados:**
- **empleados** - Datos de empleados (nombre, documento, puesto, sueldo, datos bancarios)

**Auditoría:**
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
- Códigos autogenerados para proveedores (PROV-0001) y clientes (CLI-0001)
- Auto-cálculo de vencimiento según condición de pago del proveedor
- Estado de factura de venta actualizado automáticamente al cobrar
- Detección de facturas duplicadas
- Conciliación bancaria en Pago Proveedores
- Registro automático de anulaciones y modificaciones
- Generación de informes en PDF
- Separador de miles en campos numéricos
- Filtros avanzados (ayer, últimos 7 días, mes, año, proveedor, categoría, estado)
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
