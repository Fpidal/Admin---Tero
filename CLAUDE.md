# Instrucciones para Claude Code - Administración Tero

## Contexto del Proyecto

Dashboard de **gestión financiera/administrativa** para el restaurante Tero. Permite:
- Gestionar proveedores y facturas
- Controlar vencimientos de pagos
- Administrar empleados y sueldos
- Registrar pagos realizados
- Generar órdenes de pago
- Ver estadísticas e informes financieros

## Archivos Principales

| Archivo | Descripción |
|---------|-------------|
| `src/App.jsx` | Componente principal con todo el dashboard |
| `src/supabase.js` | Configuración de conexión a Supabase |
| `src/index.css` | Estilos globales y clases custom |

## Tecnologías

- React 18 + Hooks (useState, useEffect, useMemo)
- Vite como bundler
- Tailwind CSS para estilos
- Supabase para base de datos (PostgreSQL)
- Recharts para gráficos
- Lucide React para iconos
- jsPDF + jspdf-autotable para generación de PDFs

## Base de Datos - Supabase

### Tablas:

```sql
-- Proveedores
CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT, -- pescaderia, carnes, bodega, almacen, verduras, arreglos, bebidas, otros
  condicion_pago INTEGER DEFAULT 0, -- 0=contado, 7, 15, 21, 30, 45, 60 días
  cuit TEXT,
  telefono TEXT,
  email TEXT,
  banco TEXT,
  cbu TEXT,
  contacto TEXT, -- persona de contacto
  celular TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facturas
CREATE TABLE facturas (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER REFERENCES proveedores(id),
  numero TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  vencimiento DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida')),
  concepto TEXT, -- observaciones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Empleados
CREATE TABLE empleados (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  documento TEXT,
  puesto TEXT,
  sueldo NUMERIC,
  fecha_ingreso DATE,
  banco TEXT,
  cbu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pagos
CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  tipo TEXT CHECK (tipo IN ('factura', 'sueldo', 'otro')),
  referencia_id INTEGER,
  descripcion TEXT,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  metodo TEXT, -- Efectivo, Transferencia, Mercado Pago
  estado TEXT DEFAULT 'confirmado', -- confirmado, anulado
  conciliado BOOLEAN DEFAULT FALSE, -- para conciliación bancaria
  conciliado_nota TEXT, -- observación de conciliación (ej: "Banco OP 123")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas de Crédito
CREATE TABLE notas_credito (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER REFERENCES proveedores(id),
  factura_id INTEGER REFERENCES facturas(id), -- opcional
  numero TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  concepto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Órdenes de Pago
CREATE TABLE ordenes_pago (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  fecha DATE NOT NULL,
  pagos JSONB, -- array de IDs de pagos incluidos
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anulaciones (registro de pagos anulados)
CREATE TABLE anulaciones (
  id SERIAL PRIMARY KEY,
  pago_id INTEGER,
  descripcion TEXT,
  monto NUMERIC,
  fecha_anulacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  motivo TEXT
);

-- Modificaciones (historial de cambios de monto)
CREATE TABLE modificaciones (
  id SERIAL PRIMARY KEY,
  tipo TEXT, -- 'factura' o 'pago'
  referencia_id INTEGER,
  monto_anterior NUMERIC,
  monto_nuevo NUMERIC,
  fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  descripcion TEXT
);

-- Clientes (para ingresos/ventas)
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cuit TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  condicion_iva TEXT, -- Responsable Inscripto, Monotributista, Consumidor Final, Exento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facturas de Venta
CREATE TABLE facturas_venta (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  numero TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  vencimiento DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cobrada', 'vencida')),
  concepto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cobros (pagos de clientes)
CREATE TABLE cobros (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  factura_venta_id INTEGER REFERENCES facturas_venta(id),
  descripcion TEXT,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  metodo TEXT, -- Efectivo, Transferencia, Mercado Pago, Tarjeta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Módulos del Dashboard

1. **Dashboard** - Vista general con:
   - Total por pagar (facturas pendientes)
   - Total vencido
   - Sueldos del mes
   - Total pagado este mes
   - Próximos vencimientos
   - Gráfico de gastos por proveedor (con filtro por categoría)
   - Compras del mes (con filtros mes/año)
   - Últimos pagos

2. **Ingresos** - Gestión de ventas con 3 subsecciones:
   - **Facturas**: CRUD de facturas de venta con cliente, vencimiento y estado
   - **Cobros**: Registro de cobros asociados a facturas o clientes
   - **Clientes**: CRUD completo (nombre, CUIT, teléfono, email, dirección, condición IVA)

3. **Facturas** - CRUD de facturas de proveedores con:
   - Búsqueda y filtros por estado, proveedor, mes, año
   - Alerta de vencimientos
   - Detección de facturas duplicadas
   - Marcar como pagada
   - Totales de facturas filtradas

4. **Proveedores** - CRUD de proveedores con:
   - Categorías (Pescadería, Carnes, Bodega, Almacén, Verduras, Arreglos, Bebidas, Otros)
   - Condiciones de pago (Contado, 7, 15, 21, 30, 45, 60 días)
   - Datos de contacto (persona de contacto, celular)
   - Datos bancarios
   - Filtro por categoría

5. **Pago Proveedores** - Registro de pagos con:
   - Pagos totales o parciales de facturas
   - Filtros por proveedor, mes, año
   - Vista de facturas pendientes con saldo
   - Solapa de Conciliación bancaria (marcar pagos como conciliados)

6. **Órdenes de Pago** - Sistema de órdenes:
   - Generación de órdenes de pago
   - Agrupación de pagos por orden
   - Numeración automática

7. **Notas de Crédito** - CRUD de NC con:
   - Asignación a factura específica (opcional)
   - Gestión por proveedor

8. **Empleados** - CRUD de empleados con:
   - Datos personales
   - Puesto y sueldo
   - Datos bancarios

9. **Pago Empleados** - Pagos de sueldos con:
   - Registro por mes
   - Diferentes conceptos (sueldo, aguinaldo, etc.)
   - Filtros por mes y concepto

10. **Pagos** - Historial de pagos con:
    - Todos los pagos registrados
    - Filtro por mes, tipo y forma de pago
    - Edición y anulación de pagos

11. **Informes** - Reportes con:
    - Saldo por Proveedor
    - Anulaciones
    - Modificaciones (de montos en facturas y pagos)
    - Compras por Proveedor
    - Compras por Rubro
    - Pagos del Mes
    - Generación de PDF por proveedor

## Estado Actual

- ✅ Estructura base creada
- ✅ Supabase conectado
- ✅ Autenticación con contraseña
- ✅ CRUD completo para todas las entidades
- ✅ Categorías y condiciones de pago en proveedores (incluyendo 21 días)
- ✅ Auto-cálculo de vencimiento en facturas
- ✅ Detección de facturas duplicadas
- ✅ Notas de crédito con asignación a facturas
- ✅ Sistema de órdenes de pago
- ✅ Registro de anulaciones y modificaciones
- ✅ Múltiples informes y reportes
- ✅ Generación de PDF
- ✅ Filtros avanzados en todas las secciones
- ✅ Separador de miles en inputs numéricos
- ✅ Responsive design
- ✅ Conciliación bancaria en Pago Proveedores
- ✅ Módulo de Ingresos (Clientes, Facturas de Venta, Cobros)

## Deploy

Push a main → Vercel hace deploy automático
