# Instrucciones para Claude Code - Administración Tero

## Contexto del Proyecto

Dashboard de **gestión financiera/administrativa** para el restaurante Tero. Permite:
- Gestionar proveedores y facturas
- Controlar vencimientos de pagos
- Administrar empleados y sueldos
- Registrar pagos realizados
- Ver estadísticas financieras

## Archivos Principales

| Archivo | Descripción |
|---------|-------------|
| `src/App.jsx` | Componente principal con todo el dashboard |
| `src/supabase.js` | Configuración de conexión a Supabase |
| `src/index.css` | Estilos globales y clases custom |

## Tecnologías

- React 18 + Hooks (useState, useEffect, useMemo)
- Tailwind CSS para estilos
- Supabase para base de datos (PostgreSQL)
- Recharts para gráficos
- Lucide React para iconos

## Base de Datos - Supabase

### Tablas necesarias:

```sql
-- Proveedores
CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT, -- pescaderia, carnes, bodega, almacen, verduras, arreglos, bebidas, otros
  condicion_pago INTEGER DEFAULT 0, -- 0=contado, 7, 15, 30, 45, 60 días
  cuit TEXT,
  telefono TEXT,
  email TEXT,
  banco TEXT,
  cbu TEXT,
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
  concepto TEXT,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas de Crédito
CREATE TABLE notas_credito (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER REFERENCES proveedores(id),
  factura_id INTEGER REFERENCES facturas(id), -- opcional, para asignar a una factura
  numero TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  concepto TEXT,
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
   - Gráfico de gastos por proveedor
   - Últimos pagos

2. **Facturas** - CRUD de facturas con:
   - Búsqueda y filtros por estado
   - Alerta de vencimientos
   - Marcar como pagada

3. **Proveedores** - CRUD de proveedores con:
   - Categorías (Pescadería, Carnes, Bodega, Almacén, Verduras, Arreglos, Bebidas, Otros)
   - Condiciones de pago (Contado, 7, 15, 30, 45, 60 días)
   - Datos de contacto y bancarios
   - Filtro por categoría

4. **Notas de Crédito** - CRUD de notas de crédito con:
   - Asignación a factura específica (opcional)
   - Gestión por proveedor

5. **Empleados** - CRUD de empleados con:
   - Datos personales
   - Puesto y sueldo
   - Datos bancarios
   - Seguimiento de pagos por mes

6. **Pagos** - Historial de pagos con:
   - Registro de pagos de facturas (total/parcial)
   - Registro de pagos de sueldos
   - Filtro por mes, tipo y forma de pago

## Estado Actual

- ✅ Estructura base creada
- ✅ Supabase conectado (tablas: proveedores, facturas, empleados, pagos, notas_credito)
- ✅ Formularios de creación/edición (modales)
- ✅ CRUD completo para todas las entidades
- ✅ Categorías y condiciones de pago en proveedores
- ✅ Auto-cálculo de vencimiento en facturas
- ✅ Notas de crédito con asignación a facturas
- ✅ Filtros por forma de pago, categoría, mes
- ⏳ Pendiente: Autenticación

## Deploy

Push a main → Vercel hace deploy automático
