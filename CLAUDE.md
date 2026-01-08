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
  metodo TEXT,
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
   - Datos de contacto
   - Datos bancarios

4. **Empleados** - CRUD de empleados con:
   - Datos personales
   - Puesto y sueldo
   - Datos bancarios

5. **Pagos** - Historial de pagos con:
   - Registro de pagos de facturas
   - Registro de pagos de sueldos

## Estado Actual

- ✅ Estructura base creada
- ✅ Supabase conectado (tablas: proveedores, facturas, empleados, pagos)
- ✅ Formularios de creación/edición (modales)
- ✅ CRUD completo para todas las entidades
- ⏳ Pendiente: Autenticación

## Deploy

Push a main → Vercel hace deploy automático
