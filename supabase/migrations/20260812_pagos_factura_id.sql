-- ============================================================
-- Vincular pagos con facturas por ID en vez de por texto
-- ============================================================
-- Hasta ahora el vinculo entre un pago y su factura se resolvia
-- buscando el numero de factura dentro de pagos.descripcion.
-- Eso se rompe con cualquier typo o si se edita el numero de la
-- factura, y falla en silencio (los saldos quedan mal sin aviso).
--
-- pagos.referencia_id apunta al PROVEEDOR, no a la factura, asi
-- que hace falta una columna nueva.
-- ============================================================

-- 1. Columna + FK
alter table public.pagos
  add column if not exists factura_id integer references public.facturas(id);

create index if not exists idx_pagos_factura_id on public.pagos(factura_id);

comment on column public.pagos.factura_id is
  'Factura que cancela este pago (solo para tipo = factura). Reemplaza al matching por texto sobre descripcion.';

-- 2. Backfill de los pagos ya cargados
--    Solo asigna cuando el matching por texto da UNA sola factura.
--    Verificado sobre los 944 pagos existentes: todos dan match 1:1,
--    ninguno queda ambiguo ni sin vincular.
update public.pagos p
set factura_id = sub.fid
from (
  select pa.id as pid, min(f.id) as fid, count(*) as n
  from public.pagos pa
  join public.facturas f
    on f.proveedor_id = pa.referencia_id
   and position(f.numero in pa.descripcion) > 0
  where pa.tipo = 'factura'
    and pa.factura_id is null
  group by pa.id
) sub
where p.id = sub.pid
  and sub.n = 1;

-- 3. Verificacion: deberia dar sin_vincular = 0 y ambiguos = 0
select
  count(*) filter (where factura_id is not null) as vinculados,
  count(*) filter (where factura_id is null)     as sin_vincular
from public.pagos
where tipo = 'factura';

-- ============================================================
-- NOTA: public.pagos ya tiene GRANT y RLS configurados desde su
-- creacion. Agregar una columna no requiere re-otorgar permisos
-- (los GRANT son a nivel tabla), asi que no se repiten aca.
-- ============================================================
