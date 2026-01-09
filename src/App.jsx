import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, DollarSign, Users, FileText, AlertTriangle,
  Calendar, Plus, X, Search, ChevronDown, ChevronUp,
  Building2, CreditCard, Clock, CheckCircle, AlertCircle,
  Truck, User, Edit3, Trash2, Filter, Download,
  TrendingUp, TrendingDown, Loader2, LogOut, Eye, Printer
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from './supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
};

// Formatear número con separador de miles para inputs
const formatInputMonto = (value) => {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString();
  if (!num) return '';
  return new Intl.NumberFormat('es-AR').format(parseInt(num));
};

// Parsear monto formateado a número
const parseInputMonto = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CATEGORIAS_PROVEEDOR = [
  { value: 'pescaderia', label: 'Pescadería' },
  { value: 'carnes', label: 'Carnes' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'verduras', label: 'Verduras' },
  { value: 'arreglos', label: 'Arreglos de local' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'otros', label: 'Otros' }
];

const CONDICIONES_PAGO = [
  { value: 0, label: 'Contado' },
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 45, label: '45 días' },
  { value: 60, label: '60 días' }
];

// Modal Informe Proveedor
function ModalInformeProveedor({ onClose, proveedores, facturas, pagos, notasCredito }) {
  const [proveedorId, setProveedorId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);
  const [generando, setGenerando] = useState(false);

  const proveedor = proveedores.find(p => p.id === parseInt(proveedorId));

  const generarPDF = () => {
    if (!proveedorId) return;
    setGenerando(true);

    try {
    const doc = new jsPDF();
    const prov = proveedores.find(p => p.id === parseInt(proveedorId));

    // Filtrar datos por proveedor y fechas
    const facturasProveedor = facturas
      .filter(f => f.proveedor_id === parseInt(proveedorId))
      .filter(f => {
        if (!fechaDesde) return true;
        return f.fecha >= fechaDesde && f.fecha <= fechaHasta;
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const pagosProveedor = pagos
      .filter(p => p.tipo === 'factura' && p.descripcion?.includes(prov?.nombre))
      .filter(p => {
        if (!fechaDesde) return true;
        return p.fecha >= fechaDesde && p.fecha <= fechaHasta;
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const ncProveedor = notasCredito
      .filter(nc => nc.proveedor_id === parseInt(proveedorId))
      .filter(nc => {
        if (!fechaDesde) return true;
        return nc.fecha >= fechaDesde && nc.fecha <= fechaHasta;
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE PROVEEDOR', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(prov?.nombre || 'Proveedor', 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const periodoTexto = fechaDesde
      ? `Período: ${formatDate(fechaDesde)} - ${formatDate(fechaHasta)}`
      : `Hasta: ${formatDate(fechaHasta)}`;
    doc.text(periodoTexto, 105, 38, { align: 'center' });

    let yPos = 50;

    // Datos del proveedor
    doc.setFontSize(10);
    if (prov?.cuit) doc.text(`CUIT: ${prov.cuit}`, 14, yPos);
    if (prov?.telefono) doc.text(`Tel: ${prov.telefono}`, 100, yPos);
    if (prov?.cuit || prov?.telefono) yPos += 10;

    // FACTURAS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURAS', 14, yPos);
    yPos += 5;

    if (facturasProveedor.length > 0) {
      const facturasData = facturasProveedor.map(f => [
        formatDate(f.fecha),
        f.numero || '-',
        f.concepto || '-',
        formatDate(f.vencimiento),
        f.estado ? f.estado.charAt(0).toUpperCase() + f.estado.slice(1) : '-',
        formatCurrencyPDF(f.monto)
      ]);

      const totalFacturas = facturasProveedor.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Número', 'Concepto', 'Vencimiento', 'Estado', 'Monto']],
        body: facturasData,
        foot: [['', '', '', '', 'TOTAL:', formatCurrencyPDF(totalFacturas)]],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 5: { halign: 'right' } }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No hay facturas en el período seleccionado', 14, yPos + 5);
      yPos += 15;
    }

    // PAGOS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAGOS REALIZADOS', 14, yPos);
    yPos += 5;

    if (pagosProveedor.length > 0) {
      const pagosData = pagosProveedor.map(p => {
        // Extraer número de factura de la descripción
        const facturaMatch = p.descripcion?.match(/Fact[ura]*\.?\s*([A-Za-z0-9-]+)/i);
        const facturaNum = facturaMatch ? facturaMatch[1] : '-';
        return [
          formatDate(p.fecha),
          p.descripcion || '-',
          facturaNum,
          p.metodo || '-',
          formatCurrencyPDF(p.monto)
        ];
      });

      const totalPagos = pagosProveedor.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Descripción', 'Factura', 'Método', 'Monto']],
        body: pagosData,
        foot: [['', '', '', 'TOTAL:', formatCurrencyPDF(totalPagos)]],
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 4: { halign: 'right' } }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No hay pagos en el período seleccionado', 14, yPos + 5);
      yPos += 15;
    }

    // NOTAS DE CRÉDITO
    if (ncProveedor.length > 0) {
      // Nueva página si no hay espacio
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTAS DE CRÉDITO', 14, yPos);
      yPos += 5;

      const ncData = ncProveedor.map(nc => {
        const factura = facturas.find(f => f.id === nc.factura_id);
        return [
          formatDate(nc.fecha),
          nc.numero || '-',
          nc.motivo || '-',
          factura?.numero || '-',
          formatCurrencyPDF(nc.monto)
        ];
      });

      const totalNC = ncProveedor.reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Número NC', 'Motivo', 'Factura Aplicada', 'Monto']],
        body: ncData,
        foot: [['', '', '', 'TOTAL:', formatCurrencyPDF(totalNC)]],
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 4: { halign: 'right' } }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // RESUMEN
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN', 14, yPos);
    yPos += 8;

    const totalFacturasSum = facturasProveedor.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
    const totalPagosSum = pagosProveedor.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const totalNCSum = ncProveedor.reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);
    const saldoPendiente = totalFacturasSum - totalPagosSum - totalNCSum;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Facturas: ${formatCurrencyPDF(totalFacturasSum)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Pagos: ${formatCurrencyPDF(totalPagosSum)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total NC: ${formatCurrencyPDF(totalNCSum)}`, 14, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`SALDO PENDIENTE: ${formatCurrencyPDF(saldoPendiente)}`, 14, yPos);

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }

    // Guardar PDF
    const fileName = `Informe_${prov?.nombre?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    setGenerando(false);
    onClose();
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert(`Error al generar el PDF: ${error.message || error}`);
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Informe de Proveedor</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Proveedor *</label>
            <select
              required
              value={proveedorId}
              onChange={e => setProveedorId(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Seleccionar proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Desde (opcional)</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {proveedor && (
            <div className="p-3 bg-slate-50 rounded-xl text-sm">
              <p className="font-medium">{proveedor.nombre}</p>
              {proveedor.cuit && <p className="text-slate-500">CUIT: {proveedor.cuit}</p>}
              {proveedor.categoria && <p className="text-slate-500">Categoría: {CATEGORIAS_PROVEEDOR.find(c => c.value === proveedor.categoria)?.label || proveedor.categoria}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={generarPDF}
              disabled={!proveedorId || generando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {generando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {generando ? 'Generando...' : 'Generar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Función auxiliar para formato de moneda en PDF (sin símbolo raro)
const formatCurrencyPDF = (value) => {
  const num = parseFloat(value) || 0;
  return '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(num);
};

// Modal Proveedor
function ModalProveedor({ proveedor, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    categoria: proveedor?.categoria || '',
    condicion_pago: proveedor?.condicion_pago ?? 0,
    cuit: proveedor?.cuit || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    banco: proveedor?.banco || '',
    cbu: proveedor?.cbu || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    // Solo enviar categoria y condicion_pago si tienen valor
    const dataToSave = { ...form };
    if (!dataToSave.categoria) delete dataToSave.categoria;
    if (dataToSave.condicion_pago === 0) delete dataToSave.condicion_pago;
    const result = await onSave(dataToSave);
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar. Verificá los permisos de la base de datos.');
    }
  };

  const handleDelete = () => {
    if (onDelete && proveedor) {
      onDelete(proveedor.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
            <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Categoría</label>
              <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                <option value="">Sin categoría</option>
                {CATEGORIAS_PROVEEDOR.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Condición Pago</label>
              <select value={form.condicion_pago} onChange={e => setForm({...form, condicion_pago: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                {CONDICIONES_PAGO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">CUIT</label>
            <input type="text" value={form.cuit} onChange={e => setForm({...form, cuit: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" placeholder="XX-XXXXXXXX-X" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
              <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Banco</label>
              <input type="text" value={form.banco} onChange={e => setForm({...form, banco: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">CBU</label>
              <input type="text" value={form.cbu} onChange={e => setForm({...form, cbu: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            {proveedor && onDelete && (
              <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all text-sm">
                Eliminar
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {proveedor ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Factura
function ModalFactura({ factura, proveedores, facturas = [], onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    proveedor_id: factura?.proveedor_id || '',
    numero: factura?.numero || '',
    monto: factura?.monto || '',
    fecha: factura?.fecha || new Date().toISOString().split('T')[0],
    dias_vencimiento: factura ? null : 0,
    vencimiento: factura?.vencimiento || '',
    estado: factura?.estado || 'pendiente',
    concepto: factura?.concepto || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Validar si ya existe una factura con el mismo número para el mismo proveedor
  const facturaExistente = () => {
    if (!form.proveedor_id || !form.numero) return false;
    return facturas.some(f =>
      f.proveedor_id === parseInt(form.proveedor_id) &&
      f.numero.toLowerCase() === form.numero.toLowerCase() &&
      (!factura || f.id !== factura.id) // Excluir la factura actual si estamos editando
    );
  };

  const handleDelete = () => {
    if (onDelete && factura) {
      const motivo = prompt('Ingresá el motivo de la anulación:');
      if (motivo && motivo.trim()) {
        onDelete(factura.id, motivo.trim());
      } else if (motivo !== null) {
        alert('Debés ingresar un motivo para anular la factura');
      }
    }
  };

  // Calcular vencimiento cuando cambia la fecha o los días
  const calcularVencimiento = (fecha, dias) => {
    if (!fecha || dias === null || dias === undefined) return '';
    const fechaBase = new Date(fecha + 'T12:00:00');
    fechaBase.setDate(fechaBase.getDate() + dias);
    return fechaBase.toISOString().split('T')[0];
  };

  const handleProveedorChange = (proveedorId) => {
    const proveedor = proveedores.find(p => p.id === parseInt(proveedorId));
    const dias = proveedor?.condicion_pago || 0;
    const vencimiento = calcularVencimiento(form.fecha, dias);
    setForm({
      ...form,
      proveedor_id: parseInt(proveedorId),
      dias_vencimiento: dias,
      vencimiento: vencimiento
    });
  };

  const handleFechaChange = (fecha) => {
    const vencimiento = calcularVencimiento(fecha, form.dias_vencimiento);
    setForm({
      ...form,
      fecha: fecha,
      vencimiento: vencimiento
    });
  };

  const handleDiasChange = (dias) => {
    const vencimiento = calcularVencimiento(form.fecha, parseInt(dias));
    setForm({
      ...form,
      dias_vencimiento: parseInt(dias),
      vencimiento: vencimiento
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar factura duplicada
    if (facturaExistente()) {
      setError('Ya existe una factura con este número para este proveedor');
      return;
    }

    setSaving(true);
    // Quitar dias_vencimiento del form antes de guardar
    const { dias_vencimiento, ...dataToSave } = form;
    // Si es nueva factura, siempre pendiente
    if (!factura) {
      dataToSave.estado = 'pendiente';
    }
    const result = await onSave({ ...dataToSave, monto: parseFloat(form.monto) });
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar. Verificá los permisos de la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{factura ? 'Editar Factura' : 'Nueva Factura'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Proveedor *</label>
            <select required value={form.proveedor_id} onChange={e => handleProveedorChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
              <option value="">Seleccionar proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Número Factura *</label>
              <input type="text" required value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none text-sm ${facturaExistente() ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500/50'}`} placeholder="A-0001-00000001" />
              {facturaExistente() && (
                <p className="text-xs text-red-500 mt-1">Ya existe esta factura para este proveedor</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Monto *</label>
              <input
                type="text"
                required
                value={formatInputMonto(form.monto)}
                onChange={e => setForm({...form, monto: parseInputMonto(e.target.value)})}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm text-right"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Factura *</label>
            <input type="date" required value={form.fecha} onChange={e => handleFechaChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Días Vencimiento</label>
              <select value={form.dias_vencimiento ?? ''} onChange={e => handleDiasChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                {CONDICIONES_PAGO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Vencimiento</label>
              <input type="date" required value={form.vencimiento} onChange={e => setForm({...form, vencimiento: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          {/* Solo mostrar estado si es edición */}
          {factura && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Concepto</label>
            <input type="text" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            {factura && onDelete && (
              <button type="button" onClick={handleDelete} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all text-sm">
                Eliminar
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {factura ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Empleado
function ModalEmpleado({ empleado, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    nombre: empleado?.nombre || '',
    documento: empleado?.documento || '',
    puesto: empleado?.puesto || '',
    sueldo: empleado?.sueldo || '',
    fecha_ingreso: empleado?.fecha_ingreso || '',
    banco: empleado?.banco || '',
    cbu: empleado?.cbu || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await onSave({ ...form, sueldo: parseFloat(form.sueldo) });
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar. Verificá los permisos de la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{empleado ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
            <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Documento</label>
            <input type="text" value={form.documento} onChange={e => setForm({...form, documento: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" placeholder="XX.XXX.XXX" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Puesto</label>
            <input type="text" value={form.puesto} onChange={e => setForm({...form, puesto: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Sueldo *</label>
            <input type="text" required value={formatInputMonto(form.sueldo)} onChange={e => setForm({...form, sueldo: parseInputMonto(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-right" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha de Ingreso</label>
            <input type="date" value={form.fecha_ingreso} onChange={e => setForm({...form, fecha_ingreso: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Banco</label>
            <input type="text" value={form.banco} onChange={e => setForm({...form, banco: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">CBU</label>
            <input type="text" value={form.cbu} onChange={e => setForm({...form, cbu: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {empleado ? 'Guardar' : 'Crear'}
            </button>
          </div>
          {empleado && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Estás seguro de eliminar este empleado?')) {
                  onDelete(empleado.id);
                  onClose();
                }
              }}
              className="w-full mt-3 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar empleado
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// Modal Pago
const CONCEPTOS_EMPLEADO = [
  { value: 'sueldo', label: 'Sueldo' },
  { value: 'anticipo', label: 'Anticipo' },
  { value: 'aguinaldo', label: 'Aguinaldo' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'evento_completo', label: 'Evento Completo' },
  { value: 'evento_parcial', label: 'Evento Parcial' }
];

function ModalPago({ onClose, onSave, tipoDefault, proveedores = [], empleados = [], facturas = [], pagos = [], notasCredito = [], onMarcarFacturaPagada }) {
  const [form, setForm] = useState({
    tipo: tipoDefault || 'otro',
    referencia_id: '',
    factura_id: '',
    concepto_empleado: '',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'Efectivo'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [tipoPago, setTipoPago] = useState(null); // 'total' o 'parcial'
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  const getTitulo = () => {
    if (tipoDefault === 'factura') return 'Registrar Pago a Proveedor';
    if (tipoDefault === 'sueldo') return 'Registrar Pago a Empleado';
    return 'Registrar Pago';
  };

  // Calcular saldo de cada factura (monto - pagos - NC)
  const facturasDelProveedor = proveedorSeleccionado
    ? facturas
        .filter(f => f.proveedor_id === proveedorSeleccionado && f.estado !== 'pagada')
        .map(f => {
          // Calcular pagos de esta factura
          const pagosFactura = pagos
            .filter(p => p.tipo === 'factura' && p.descripcion && p.descripcion.includes(f.numero))
            .reduce((sum, p) => sum + p.monto, 0);
          // Calcular NC de esta factura
          const ncFactura = notasCredito
            .filter(nc => nc.factura_id === f.id)
            .reduce((sum, nc) => sum + nc.monto, 0);
          const saldo = f.monto - pagosFactura - ncFactura;
          return { ...f, pagado: pagosFactura, nc: ncFactura, saldo };
        })
        .filter(f => f.saldo > 0) // Solo mostrar facturas con saldo pendiente
    : [];

  const handleProveedorChange = (proveedorId) => {
    const proveedor = proveedores.find(p => p.id === parseInt(proveedorId));
    setProveedorSeleccionado(parseInt(proveedorId));
    setForm({
      ...form,
      referencia_id: proveedorId,
      factura_id: '',
      descripcion: proveedor ? `Pago a ${proveedor.nombre}` : '',
      monto: ''
    });
  };

  const handleFacturaSelect = (facturaId) => {
    // Buscar en facturasDelProveedor que ya tiene el saldo calculado
    const factura = facturasDelProveedor.find(f => f.id === parseInt(facturaId));
    setFacturaSeleccionada(factura);
    setTipoPago(null); // Reset tipo de pago cuando cambia la factura
    setForm({
      ...form,
      factura_id: facturaId,
      descripcion: '',
      monto: ''
    });
  };

  const handleTipoPagoChange = (tipo) => {
    setTipoPago(tipo);
    const proveedor = proveedores.find(p => p.id === proveedorSeleccionado);
    if (tipo === 'total' && facturaSeleccionada) {
      setForm({
        ...form,
        descripcion: `Pago Saldo ${proveedor?.nombre} - Factura ${facturaSeleccionada.numero}`,
        monto: facturaSeleccionada.saldo || facturaSeleccionada.monto
      });
    } else if (tipo === 'parcial') {
      setForm({
        ...form,
        descripcion: `Pago Parcial ${proveedor?.nombre} - Factura ${facturaSeleccionada?.numero || ''}`,
        monto: ''
      });
    }
  };

  const handleEmpleadoChange = (empleadoId) => {
    setForm({
      ...form,
      referencia_id: empleadoId,
      concepto_empleado: '',
      descripcion: '',
      monto: ''
    });
  };

  const handleConceptoEmpleadoChange = (concepto) => {
    const empleado = empleados.find(e => e.id === parseInt(form.referencia_id));
    const conceptoLabel = CONCEPTOS_EMPLEADO.find(c => c.value === concepto)?.label || '';

    let monto = '';
    // Si es sueldo, autocompletar con el sueldo del empleado
    if (concepto === 'sueldo' && empleado) {
      monto = empleado.sueldo;
    }

    setForm({
      ...form,
      concepto_empleado: concepto,
      descripcion: empleado ? `${conceptoLabel} - ${empleado.nombre}` : '',
      monto: monto
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Si es pago total, marcar la factura como pagada
    if (tipoPago === 'total' && facturaSeleccionada && onMarcarFacturaPagada) {
      await onMarcarFacturaPagada(facturaSeleccionada.id);
    }

    const result = await onSave({ ...form, monto: parseFloat(form.monto) });
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar el pago. Verificá los permisos de la tabla "pagos" en Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{getTitulo()}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tipoDefault === 'factura' && (
            <>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Proveedor *</label>
                <select required value={form.referencia_id} onChange={e => handleProveedorChange(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {proveedorSeleccionado && facturasDelProveedor.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-500 mb-2">Facturas Pendientes</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2">
                    {facturasDelProveedor.map(f => (
                      <label key={f.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${form.factura_id === String(f.id) ? 'bg-blue-50 border border-blue-300' : 'bg-slate-50 hover:bg-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="factura"
                            value={f.id}
                            checked={form.factura_id === String(f.id)}
                            onChange={e => handleFacturaSelect(e.target.value)}
                            className="w-4 h-4 text-blue-500"
                          />
                          <div>
                            <p className="font-medium text-sm">{f.numero}</p>
                            <p className="text-xs text-slate-500">{f.concepto || 'Sin concepto'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm mono text-amber-600">Saldo: {formatCurrency(f.saldo)}</p>
                          {(f.pagado > 0 || f.nc > 0) && (
                            <p className="text-xs text-slate-400">
                              Total: {formatCurrency(f.monto)}
                              {f.pagado > 0 && ` | Pagado: ${formatCurrency(f.pagado)}`}
                              {f.nc > 0 && ` | NC: ${formatCurrency(f.nc)}`}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Selección de tipo de pago: Total o Parcial */}
              {facturaSeleccionada && (
                <div>
                  <label className="block text-sm text-slate-500 mb-2">Tipo de Pago</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTipoPagoChange('total')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        tipoPago === 'total'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold">Pagar Saldo</p>
                      <p className="text-sm mono mt-1">{formatCurrency(facturaSeleccionada.saldo || facturaSeleccionada.monto)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTipoPagoChange('parcial')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        tipoPago === 'parcial'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold">Pago Parcial</p>
                      <p className="text-sm text-slate-500 mt-1">Ingresar monto</p>
                    </button>
                  </div>
                </div>
              )}

              {proveedorSeleccionado && facturasDelProveedor.length === 0 && (
                <p className="text-sm text-slate-500 italic">No hay facturas pendientes para este proveedor</p>
              )}
            </>
          )}
          {tipoDefault === 'sueldo' && (
            <>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Empleado *</label>
                <select required value={form.referencia_id} onChange={e => handleEmpleadoChange(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
                  <option value="">Seleccionar empleado</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} - {e.puesto || 'Sin puesto'}</option>)}
                </select>
              </div>

              {form.referencia_id && (
                <div>
                  <label className="block text-sm text-slate-500 mb-2">Concepto *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONCEPTOS_EMPLEADO.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleConceptoEmpleadoChange(c.value)}
                        className={`p-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                          form.concepto_empleado === c.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mostrar campos solo si: es pago a empleado con concepto seleccionado, O es pago a proveedor con tipo de pago seleccionado */}
          {((tipoDefault === 'sueldo' && form.concepto_empleado) || (tipoDefault === 'factura' && tipoPago)) && (
            <>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Descripción *</label>
                <input type="text" required value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Monto * {tipoPago === 'parcial' && facturaSeleccionada && <span className="text-amber-600">(Máx: {formatCurrency(facturaSeleccionada.saldo || facturaSeleccionada.monto)})</span>}</label>
                <input
                  type="text"
                  required
                  value={formatInputMonto(form.monto)}
                  onChange={e => setForm({...form, monto: parseInputMonto(e.target.value)})}
                  readOnly={tipoPago === 'total'}
                  className={`w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-right ${tipoPago === 'total' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha *</label>
                <input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Método</label>
                <select value={form.metodo} onChange={e => setForm({...form, metodo: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                </select>
              </div>
            </>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
            <button
              type="submit"
              disabled={saving || (tipoDefault === 'factura' && !tipoPago) || (tipoDefault === 'sueldo' && !form.concepto_empleado) || !form.monto}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {tipoPago === 'total' ? 'Pagar Total' : tipoPago === 'parcial' ? 'Pagar Parcial' : form.concepto_empleado ? 'Registrar Pago' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Editar Pago
function ModalEditPago({ pago, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    fecha: pago?.fecha || '',
    descripcion: pago?.descripcion || '',
    metodo: pago?.metodo || 'Efectivo',
    monto: pago?.monto || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await onSave(pago.id, { ...form, monto: parseFloat(form.monto) });
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar');
    }
  };

  const handleDelete = () => {
    const motivo = prompt('Ingresá el motivo de la anulación:');
    if (motivo && motivo.trim()) {
      onDelete(pago.id, motivo.trim());
    } else if (motivo !== null) {
      alert('Debés ingresar un motivo para anular el pago');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Editar Pago</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm({...form, fecha: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Descripción</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={e => setForm({...form, descripcion: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Método de pago</label>
            <select
              value={form.metodo}
              onChange={e => setForm({...form, metodo: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Monto</label>
            <input
              type="text"
              value={formatInputMonto(form.monto)}
              onChange={e => setForm({...form, monto: parseInputMonto(e.target.value)})}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-right"
              placeholder="0"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar pago
          </button>
        </form>
      </div>
    </div>
  );
}

// Modal Nota de Crédito
function ModalNotaCredito({ nota, proveedores, facturas, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    proveedor_id: nota?.proveedor_id || '',
    factura_id: nota?.factura_id || '',
    numero: nota?.numero || '',
    monto: nota?.monto || '',
    fecha: nota?.fecha || new Date().toISOString().split('T')[0],
    concepto: nota?.concepto || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = () => {
    if (nota && onDelete) {
      onDelete(nota.id);
    }
  };

  // Facturas pendientes del proveedor seleccionado
  const facturasProveedor = form.proveedor_id
    ? facturas.filter(f => f.proveedor_id === parseInt(form.proveedor_id) && f.estado !== 'pagada')
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const dataToSave = {
      ...form,
      monto: parseFloat(form.monto),
      factura_id: form.factura_id ? parseInt(form.factura_id) : null,
      proveedor_id: parseInt(form.proveedor_id)
    };
    const result = await onSave(dataToSave);
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar. Verificá los permisos de la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{nota ? 'Editar Nota de Crédito' : 'Nueva Nota de Crédito'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Proveedor *</label>
            <select required value={form.proveedor_id} onChange={e => setForm({...form, proveedor_id: e.target.value, factura_id: ''})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
              <option value="">Seleccionar proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asignar a Factura (opcional)</label>
            <select value={form.factura_id} onChange={e => setForm({...form, factura_id: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
              <option value="">Sin asignar</option>
              {facturasProveedor.map(f => <option key={f.id} value={f.id}>{f.numero} - {formatCurrency(f.monto)}</option>)}
            </select>
            {form.proveedor_id && facturasProveedor.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No hay facturas pendientes para este proveedor</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Número NC *</label>
              <input type="text" required value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" placeholder="NC-0001" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Monto *</label>
              <input
                type="text"
                required
                value={formatInputMonto(form.monto)}
                onChange={e => setForm({...form, monto: parseInputMonto(e.target.value)})}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm text-right"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha *</label>
            <input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Concepto</label>
            <input type="text" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" placeholder="Devolución, descuento, etc." />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            {nota && onDelete && (
              <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {nota ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [proveedores, setProveedores] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [notasCredito, setNotasCredito] = useState([]);
  const [anulaciones, setAnulaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showModal, setShowModal] = useState(null); // 'proveedor', 'factura', 'empleado', 'pago'
  const [selectedItem, setSelectedItem] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroMesPago, setFiltroMesPago] = useState('todos');
  const [filtroTipoPago, setFiltroTipoPago] = useState('todos');
  const [filtroMesEmpleado, setFiltroMesEmpleado] = useState(new Date().getMonth().toString()); // Mes actual por defecto
  const [filtroConceptoEmpleado, setFiltroConceptoEmpleado] = useState('todos');
  const [filtroCategoriaProveedor, setFiltroCategoriaProveedor] = useState('todos');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('todos');
  const [filtroProveedorFactura, setFiltroProveedorFactura] = useState('todos');
  const [filtroMesFactura, setFiltroMesFactura] = useState('todos');
  const [filtroAnioFactura, setFiltroAnioFactura] = useState(new Date().getFullYear().toString());

  // Filtros Informes
  const [informeActivo, setInformeActivo] = useState('anulaciones');
  const [filtroMesInforme, setFiltroMesInforme] = useState('todos');
  const [filtroAnioInforme, setFiltroAnioInforme] = useState(new Date().getFullYear().toString());

  // Cargar datos desde Supabase
  const fetchProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('nombre');
    if (!error) {
      // Cargar extras desde localStorage (categoria, condicion_pago)
      const extras = JSON.parse(localStorage.getItem('proveedores_extras') || '{}');
      const proveedoresConExtras = (data || []).map(p => ({
        ...p,
        categoria: extras[p.id]?.categoria || '',
        condicion_pago: extras[p.id]?.condicion_pago || ''
      }));
      setProveedores(proveedoresConExtras);
    }
  };

  const fetchFacturas = async () => {
    const { data, error } = await supabase
      .from('facturas')
      .select('*, proveedores(nombre)')
      .order('vencimiento', { ascending: true });
    if (!error) {
      const facturasConProveedor = (data || []).map(f => ({
        ...f,
        proveedor: f.proveedores?.nombre || 'Sin proveedor'
      }));
      setFacturas(facturasConProveedor);
    }
  };

  const fetchEmpleados = async () => {
    const { data, error } = await supabase.from('empleados').select('*').order('nombre');
    if (!error) setEmpleados(data || []);
  };

  const fetchPagos = async () => {
    const { data, error } = await supabase.from('pagos').select('*').order('fecha', { ascending: false });
    console.log('Pagos cargados:', data, 'Error:', error);
    if (!error) setPagos(data || []);
  };

  const fetchNotasCredito = async () => {
    try {
      const { data, error } = await supabase
        .from('notas_credito')
        .select('*, proveedores(nombre), facturas(numero)')
        .order('fecha', { ascending: false });
      if (!error && data) {
        const notasConRelaciones = data.map(nc => ({
          ...nc,
          proveedor: nc.proveedores?.nombre || 'Sin proveedor',
          factura_numero: nc.facturas?.numero || null
        }));
        setNotasCredito(notasConRelaciones);
      } else {
        // Si la tabla no existe, simplemente dejamos el array vacío
        setNotasCredito([]);
      }
    } catch (e) {
      // Si hay error (tabla no existe), dejamos vacío
      setNotasCredito([]);
    }
  };

  const fetchAnulaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('anulaciones')
        .select('*')
        .order('fecha_anulacion', { ascending: false });
      if (!error && data) {
        setAnulaciones(data);
      } else {
        setAnulaciones([]);
      }
    } catch (e) {
      setAnulaciones([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchProveedores(), fetchFacturas(), fetchEmpleados(), fetchPagos(), fetchNotasCredito(), fetchAnulaciones()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // CRUD Proveedores
  const createProveedor = async (proveedor) => {
    console.log('Creando proveedor:', proveedor);
    // Excluir campos que no existen en Supabase (categoria, condicion_pago se guardan en localStorage)
    const { categoria, condicion_pago, ...proveedorDB } = proveedor;
    const { data, error } = await supabase.from('proveedores').insert([proveedorDB]).select();
    console.log('Respuesta Supabase:', { data, error });
    if (error) {
      console.error('Error completo:', JSON.stringify(error, null, 2));
    } else {
      // Guardar categoria y condicion_pago en localStorage
      if (data && data[0]) {
        const extras = JSON.parse(localStorage.getItem('proveedores_extras') || '{}');
        extras[data[0].id] = { categoria, condicion_pago };
        localStorage.setItem('proveedores_extras', JSON.stringify(extras));
      }
      await fetchProveedores();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateProveedor = async (id, proveedor) => {
    console.log('Actualizando proveedor:', id, proveedor);
    // Excluir campos que no existen en Supabase
    const { categoria, condicion_pago, ...proveedorDB } = proveedor;
    const { data, error } = await supabase.from('proveedores').update(proveedorDB).eq('id', id).select();
    console.log('Respuesta Supabase:', { data, error });
    if (error) {
      console.error('Error completo:', JSON.stringify(error, null, 2));
    } else {
      // Guardar categoria y condicion_pago en localStorage
      const extras = JSON.parse(localStorage.getItem('proveedores_extras') || '{}');
      extras[id] = { categoria, condicion_pago };
      localStorage.setItem('proveedores_extras', JSON.stringify(extras));
      await fetchProveedores();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteProveedor = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) await fetchProveedores();
  };

  // CRUD Facturas
  const createFactura = async (factura) => {
    const { error } = await supabase.from('facturas').insert([factura]);
    if (!error) {
      await fetchFacturas();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateFactura = async (id, factura) => {
    const { error } = await supabase.from('facturas').update(factura).eq('id', id);
    if (!error) {
      await fetchFacturas();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteFactura = async (id, motivo) => {
    // Buscar la factura para guardar sus datos
    const factura = facturas.find(f => f.id === id);
    if (!factura) return;

    // Guardar en anulaciones
    const { error: errorAnulacion } = await supabase.from('anulaciones').insert([{
      tipo: 'factura',
      datos_originales: factura,
      motivo: motivo
    }]);

    if (errorAnulacion) {
      alert('Error al registrar la anulación');
      return;
    }

    // Eliminar la factura
    const { error } = await supabase.from('facturas').delete().eq('id', id);
    if (!error) {
      await fetchFacturas();
      await fetchAnulaciones();
      setShowModal(null);
      setSelectedItem(null);
    }
  };

  const marcarFacturaPagada = async (factura) => {
    // Crear pago
    const pago = {
      tipo: 'factura',
      referencia_id: factura.id,
      descripcion: `Pago ${factura.proveedor} - Factura ${factura.numero}`,
      monto: factura.monto,
      fecha: new Date().toISOString().split('T')[0],
      metodo: 'Transferencia'
    };
    await supabase.from('pagos').insert([pago]);
    // Actualizar estado factura
    await supabase.from('facturas').update({ estado: 'pagada' }).eq('id', factura.id);
    await Promise.all([fetchFacturas(), fetchPagos()]);
  };

  // CRUD Empleados
  const createEmpleado = async (empleado) => {
    const { error } = await supabase.from('empleados').insert([empleado]);
    if (!error) {
      await fetchEmpleados();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateEmpleado = async (id, empleado) => {
    const { error } = await supabase.from('empleados').update(empleado).eq('id', id);
    if (!error) {
      await fetchEmpleados();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteEmpleado = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
    const { error } = await supabase.from('empleados').delete().eq('id', id);
    if (!error) await fetchEmpleados();
  };

  const pagarSueldo = async (empleado) => {
    const pago = {
      tipo: 'sueldo',
      referencia_id: empleado.id,
      descripcion: `Sueldo ${MESES[new Date().getMonth()]} - ${empleado.nombre}`,
      monto: empleado.sueldo,
      fecha: new Date().toISOString().split('T')[0],
      metodo: 'Transferencia'
    };
    const { error } = await supabase.from('pagos').insert([pago]);
    if (!error) await fetchPagos();
  };

  // CRUD Pagos
  const createPago = async (pago) => {
    // Quitar campos que no existen en la tabla
    const { factura_id, concepto_empleado, ...pagoData } = pago;
    console.log('Creando pago:', pagoData);
    const { data, error } = await supabase.from('pagos').insert([pagoData]).select();
    console.log('Respuesta Supabase pagos:', { data, error });
    if (error) {
      console.error('Error al crear pago:', JSON.stringify(error, null, 2));
    } else {
      await fetchPagos();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updatePago = async (id, pago) => {
    const { error } = await supabase.from('pagos').update(pago).eq('id', id);
    if (!error) {
      await fetchPagos();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deletePago = async (id, motivo) => {
    // Buscar el pago para guardar sus datos
    const pago = pagos.find(p => p.id === id);
    if (!pago) return;

    // Guardar en anulaciones
    const { error: errorAnulacion } = await supabase.from('anulaciones').insert([{
      tipo: 'pago',
      datos_originales: pago,
      motivo: motivo
    }]);

    if (errorAnulacion) {
      alert('Error al registrar la anulación');
      return;
    }

    // Eliminar el pago
    const { error } = await supabase.from('pagos').delete().eq('id', id);
    if (!error) {
      await fetchPagos();
      await fetchAnulaciones();
      setShowModal(null);
      setSelectedItem(null);
    }
  };

  // CRUD Notas de Crédito
  const createNotaCredito = async (nota) => {
    const { error } = await supabase.from('notas_credito').insert([nota]);
    if (!error) {
      await fetchNotasCredito();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateNotaCredito = async (id, nota) => {
    const { error } = await supabase.from('notas_credito').update(nota).eq('id', id);
    if (!error) {
      await fetchNotasCredito();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteNotaCredito = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta nota de crédito?')) return;
    const { error } = await supabase.from('notas_credito').delete().eq('id', id);
    if (!error) await fetchNotasCredito();
  };

  // Stats calculados
  const stats = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    // Facturas pendientes (no vencidas)
    const facturasPendientes = facturas.filter(f => {
      if (f.estado === 'pagada') return false;
      const venc = new Date(f.vencimiento + 'T12:00:00');
      return venc >= hoy;
    });

    // Facturas vencidas (fecha pasada y no pagadas)
    const facturasVencidas = facturas.filter(f => {
      if (f.estado === 'pagada') return false;
      const venc = new Date(f.vencimiento + 'T12:00:00');
      return venc < hoy;
    });

    const totalPendiente = facturasPendientes.reduce((sum, f) => sum + f.monto, 0);
    const totalVencido = facturasVencidas.reduce((sum, f) => sum + f.monto, 0);

    // Sueldos pagados este mes
    const pagosSueldosMes = pagos.filter(p => {
      if (p.tipo !== 'sueldo') return false;
      const fechaPago = new Date(p.fecha);
      return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual;
    });
    const totalSueldosPagados = pagosSueldosMes.reduce((sum, p) => sum + p.monto, 0);

    const totalPagadoMes = pagos
      .filter(p => {
        const fechaPago = new Date(p.fecha);
        return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual;
      })
      .reduce((sum, p) => sum + p.monto, 0);

    // Total de sueldos fijos
    const totalSueldosFijos = empleados.reduce((sum, e) => sum + (e.sueldo || 0), 0);

    return {
      facturasPendientes: facturasPendientes.length,
      facturasVencidas: facturasVencidas.length,
      totalPendiente,
      totalVencido,
      totalSueldosPagados,
      totalSueldosFijos,
      totalPagadoMes,
      totalProveedores: proveedores.length,
      totalEmpleados: empleados.length
    };
  }, [facturas, empleados, pagos, proveedores]);

  // Facturas próximas a vencer (7 días)
  const facturasProximas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7dias = new Date();
    en7dias.setDate(hoy.getDate() + 7);

    return facturas
      .filter(f => f.estado === 'pendiente' || f.estado === 'vencida')
      .filter(f => {
        const venc = new Date(f.vencimiento + 'T12:00:00');
        return venc >= hoy && venc <= en7dias;
      })
      .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  }, [facturas]);

  // Facturas vencidas para el dashboard
  const facturasVencidasDash = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return facturas
      .filter(f => f.estado === 'pendiente' || f.estado === 'vencida')
      .filter(f => {
        const venc = new Date(f.vencimiento + 'T12:00:00');
        return venc < hoy;
      })
      .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  }, [facturas]);

  // Datos para gráficos
  const datosPorCategoria = useMemo(() => {
    const categorias = {};
    facturas.forEach(f => {
      const prov = f.proveedor;
      categorias[prov] = (categorias[prov] || 0) + f.monto;
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  }, [facturas]);

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899'];

  // Calcular pagos por empleado (filtrado por mes)
  const pagosPorEmpleado = useMemo(() => {
    const pagosMap = {};
    pagos
      .filter(p => p.tipo === 'sueldo')
      .filter(p => {
        if (filtroMesEmpleado === 'todos') return true;
        const fechaPago = new Date(p.fecha);
        return fechaPago.getMonth() === parseInt(filtroMesEmpleado);
      })
      .forEach(p => {
        // Buscar empleado por nombre en la descripción
        empleados.forEach(e => {
          if (p.descripcion && p.descripcion.includes(e.nombre)) {
            pagosMap[e.id] = (pagosMap[e.id] || 0) + p.monto;
          }
        });
      });
    return pagosMap;
  }, [pagos, empleados, filtroMesEmpleado]);

  // Total pagado a empleados en el mes seleccionado
  const totalPagadoEmpleadosMes = useMemo(() => {
    return Object.values(pagosPorEmpleado).reduce((sum, monto) => sum + monto, 0);
  }, [pagosPorEmpleado]);

  // Calcular pagos por factura (pagos normales)
  const pagosPorFactura = useMemo(() => {
    const pagosMap = {};
    pagos.filter(p => p.tipo === 'factura').forEach(p => {
      // Buscar en la descripción el número de factura para asociar el pago
      facturas.forEach(f => {
        if (p.descripcion && p.descripcion.includes(f.numero)) {
          pagosMap[f.id] = (pagosMap[f.id] || 0) + p.monto;
        }
      });
    });
    return pagosMap;
  }, [pagos, facturas]);

  // Calcular NC por factura
  const ncPorFactura = useMemo(() => {
    const ncMap = {};
    notasCredito.filter(nc => nc.factura_id).forEach(nc => {
      ncMap[nc.factura_id] = (ncMap[nc.factura_id] || 0) + nc.monto;
    });
    return ncMap;
  }, [notasCredito]);

  // Combinar pagos y NC aplicadas para mostrar en sección Pagos
  const pagosYNC = useMemo(() => {
    const ncAplicadas = notasCredito
      .filter(nc => nc.factura_id) // Solo NC aplicadas a facturas
      .map(nc => {
        const factura = facturas.find(f => f.id === nc.factura_id);
        const proveedor = proveedores.find(p => p.id === nc.proveedor_id);
        return {
          id: `nc-${nc.id}`,
          tipo: 'nc',
          fecha: nc.fecha,
          descripcion: `NC ${nc.numero} - ${proveedor?.nombre || 'Proveedor'} - Fact. ${factura?.numero || ''}`,
          metodo: 'Nota de Crédito',
          monto: nc.monto
        };
      });
    return [...pagos, ...ncAplicadas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [pagos, notasCredito, facturas, proveedores]);

  // Facturas filtradas con saldo calculado (incluye pagos + NC)
  const facturasFiltradas = useMemo(() => {
    return facturas
      .map(f => {
        const pagado = pagosPorFactura[f.id] || 0;
        const nc = ncPorFactura[f.id] || 0;
        const saldo = f.monto - pagado - nc;
        // Determinar estado visual: si hay pagos parciales y no está pagada, mostrar "parcial"
        let estadoDisplay = f.estado;
        if (f.estado === 'pendiente' && (pagado > 0 || nc > 0) && saldo > 0) {
          estadoDisplay = 'parcial';
        }
        return {
          ...f,
          pagado,
          nc,
          totalPagado: pagado + nc,
          saldo,
          estadoDisplay
        };
      })
      .filter(f => {
        const matchSearch = f.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           f.numero.toLowerCase().includes(searchTerm.toLowerCase());
        // Para filtro, "parcial" se considera como "pendiente"
        const estadoParaFiltro = f.estadoDisplay === 'parcial' ? 'pendiente' : f.estado;
        const matchEstado = filtroEstado === 'todos' || estadoParaFiltro === filtroEstado || (filtroEstado === 'parcial' && f.estadoDisplay === 'parcial');
        const matchProveedor = filtroProveedorFactura === 'todos' || f.proveedor_id === parseInt(filtroProveedorFactura);
        const fechaFactura = new Date(f.fecha);
        const matchAnio = filtroAnioFactura === 'todos' || fechaFactura.getFullYear() === parseInt(filtroAnioFactura);
        const matchMes = filtroMesFactura === 'todos' || fechaFactura.getMonth() === parseInt(filtroMesFactura);
        return matchSearch && matchEstado && matchProveedor && matchAnio && matchMes;
      });
  }, [facturas, searchTerm, filtroEstado, filtroProveedorFactura, filtroAnioFactura, filtroMesFactura, pagosPorFactura, ncPorFactura]);

  const getDiasVencimiento = (vencimiento) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(vencimiento + 'T12:00:00');
    const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { texto: `Vencida hace ${Math.abs(diff)} días`, clase: 'text-red-400' };
    if (diff === 0) return { texto: 'Vence hoy', clase: 'text-red-400' };
    if (diff === 1) return { texto: 'Vence mañana', clase: 'text-amber-400' };
    if (diff <= 7) return { texto: `Vence en ${diff} días`, clase: 'text-amber-400' };
    return { texto: `Vence en ${diff} días`, clase: 'text-slate-400' };
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center glow">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                  Administración Tero
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">Gestión Financiera</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-2 text-slate-500 hover:text-slate-800 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 py-3">
        <div className="flex flex-wrap gap-1 p-1 glass rounded-xl">
          {[
            { id: 'dashboard', label: 'Dashboard', short: 'Dash', icon: BarChart3 },
            { id: 'facturas', label: 'Facturas', short: 'Fact', icon: FileText },
            { id: 'proveedores', label: 'Proveedores', short: 'Prov', icon: Building2 },
            { id: 'pago-proveedores', label: 'Pago Prov.', short: 'PagProv', icon: DollarSign },
            { id: 'notas-credito', label: 'NC', short: 'NC', icon: FileText },
            { id: 'empleados', label: 'Empleados', short: 'Empl', icon: Users },
            { id: 'pago-empleados', label: 'Pago Empl.', short: 'PagEmpl', icon: DollarSign },
            { id: 'pagos', label: 'Pagos', short: 'Pagos', icon: CreditCard },
            { id: 'informes', label: 'Informes', short: 'Inf', icon: AlertCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                activeTab === tab.id ? 'tab-active text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card glass rounded-2xl p-4 sm:p-5 glow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-1">Por Pagar</p>
                    <p className="text-lg sm:text-2xl font-bold mono text-amber-400">{formatCurrency(stats.totalPendiente)}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.facturasPendientes} facturas</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="stat-card glass rounded-2xl p-4 sm:p-5 glow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-1">Vencido</p>
                    <p className="text-lg sm:text-2xl font-bold mono text-red-400">{formatCurrency(stats.totalVencido)}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.facturasVencidas} facturas</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="stat-card glass rounded-2xl p-4 sm:p-5 glow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-1">Sueldos Mes</p>
                    <p className="text-lg sm:text-2xl font-bold mono">{formatCurrency(stats.totalSueldosPagados)}</p>
                    <p className="text-xs text-slate-500 mt-1">pagados este mes</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="stat-card glass rounded-2xl p-4 sm:p-5 glow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-1">Pagado este Mes</p>
                    <p className="text-lg sm:text-2xl font-bold mono text-emerald-400">{formatCurrency(stats.totalPagadoMes)}</p>
                    <p className="text-xs text-slate-500 mt-1">{pagos.length} pagos</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Alertas de Vencimientos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facturas Vencidas */}
              <div className="glass rounded-2xl p-4 glow border-l-4 border-red-400">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    Facturas Vencidas
                    {facturasVencidasDash.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-medium">
                        {facturasVencidasDash.length}
                      </span>
                    )}
                  </h3>
                  {facturasVencidasDash.length > 0 && (
                    <p className="text-sm font-bold text-red-600 mono">
                      {formatCurrency(facturasVencidasDash.reduce((sum, f) => sum + f.monto, 0))}
                    </p>
                  )}
                </div>
                {facturasVencidasDash.length === 0 ? (
                  <p className="text-slate-400 text-xs">No hay facturas vencidas</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {facturasVencidasDash.map(f => {
                      const dias = getDiasVencimiento(f.vencimiento);
                      return (
                        <div key={f.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-xs">{f.proveedor}</p>
                            <p className="text-[10px] text-slate-400">{f.numero}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold mono text-xs text-red-600">{formatCurrency(f.monto)}</p>
                            <p className={`text-[10px] ${dias.clase}`}>{dias.texto}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Próximos vencimientos (7 días) */}
              <div className="glass rounded-2xl p-4 glow border-l-4 border-amber-400">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Vencen en 7 días
                    {facturasProximas.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[10px] font-medium">
                        {facturasProximas.length}
                      </span>
                    )}
                  </h3>
                  {facturasProximas.length > 0 && (
                    <p className="text-sm font-bold text-amber-600 mono">
                      {formatCurrency(facturasProximas.reduce((sum, f) => sum + f.monto, 0))}
                    </p>
                  )}
                </div>
                {facturasProximas.length === 0 ? (
                  <p className="text-slate-400 text-xs">No hay facturas por vencer en los próximos 7 días</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {facturasProximas.map(f => {
                      const dias = getDiasVencimiento(f.vencimiento);
                      return (
                        <div key={f.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                          <div>
                            <p className="font-medium text-xs">{f.proveedor}</p>
                            <p className="text-[10px] text-slate-400">{f.numero}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold mono text-xs">{formatCurrency(f.monto)}</p>
                            <p className={`text-[10px] ${dias.clase}`}>{dias.texto}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico por proveedor */}
            <div className="glass rounded-2xl p-5 glow">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Gastos por Proveedor
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={datosPorCategoria}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {datosPorCategoria.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Últimos pagos */}
            <div className="glass rounded-2xl p-5 glow">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Últimos Pagos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-200">
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Descripción</th>
                      <th className="pb-3 font-medium">Método</th>
                      <th className="pb-3 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.slice(0, 5).map(p => (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-3 text-sm">{formatDate(p.fecha)}</td>
                        <td className="py-3 text-sm">{p.descripcion}</td>
                        <td className="py-3 text-sm text-slate-400">{p.metodo}</td>
                        <td className="py-3 text-sm text-right font-semibold mono text-emerald-400">
                          {formatCurrency(p.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Facturas */}
        {activeTab === 'facturas' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 w-full sm:w-40 text-sm"
                  />
                </div>
                <select
                  value={filtroAnioFactura}
                  onChange={(e) => setFiltroAnioFactura(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los años</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <select
                  value={filtroMesFactura}
                  onChange={(e) => setFiltroMesFactura(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los meses</option>
                  {MESES.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
                <select
                  value={filtroProveedorFactura}
                  onChange={(e) => setFiltroProveedorFactura(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los proveedores</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="pagada">Pagadas</option>
                  <option value="vencida">Vencidas</option>
                </select>
              </div>
              <button
                onClick={() => { setSelectedItem(null); setShowModal('factura'); }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Nueva Factura
              </button>
            </div>

            {/* Resumen de totales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Facturas</p>
                <p className="text-lg font-bold text-blue-500 mono">
                  {formatCurrency(facturasFiltradas.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0))}
                </p>
                <p className="text-xs text-slate-400">{facturasFiltradas.length} facturas</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Pendiente</p>
                <p className="text-lg font-bold text-amber-500 mono">
                  {formatCurrency(facturasFiltradas.filter(f => f.estado !== 'pagada').reduce((sum, f) => sum + (parseFloat(f.saldo) || 0), 0))}
                </p>
                <p className="text-xs text-slate-400">{facturasFiltradas.filter(f => f.estado !== 'pagada').length} facturas</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Pagado</p>
                <p className="text-lg font-bold text-emerald-500 mono">
                  {formatCurrency(facturasFiltradas.reduce((sum, f) => sum + (parseFloat(f.totalPagado) || 0), 0))}
                </p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Vencido</p>
                <p className="text-lg font-bold text-red-500 mono">
                  {formatCurrency(facturasFiltradas.filter(f => f.estado === 'vencida' || (f.estado === 'pendiente' && new Date(f.vencimiento) < new Date())).reduce((sum, f) => sum + (parseFloat(f.saldo) || 0), 0))}
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-200">
                      <th className="px-5 py-4 font-medium">Proveedor</th>
                      <th className="px-5 py-4 font-medium">Número</th>
                      <th className="px-5 py-4 font-medium">Concepto</th>
                      <th className="px-5 py-4 font-medium">Vencimiento</th>
                      <th className="px-5 py-4 font-medium">Estado</th>
                      <th className="px-5 py-4 font-medium text-right">Monto</th>
                      <th className="px-5 py-4 font-medium text-right">Saldo</th>
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasFiltradas.map(f => {
                      const dias = getDiasVencimiento(f.vencimiento);
                      const tienePagos = f.pagado > 0;
                      const tieneNC = f.nc > 0;
                      return (
                        <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-medium">{f.proveedor}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{f.numero}</td>
                          <td className="px-5 py-4 text-sm">{f.concepto}</td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm">{formatDate(f.vencimiento)}</p>
                              {f.estado === 'pendiente' && (
                                <p className={`text-xs ${dias.clase}`}>{dias.texto}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium badge-${f.estadoDisplay}`}>
                              {f.estadoDisplay.charAt(0).toUpperCase() + f.estadoDisplay.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold mono">{formatCurrency(f.monto)}</td>
                          <td className="px-5 py-4 text-right">
                            <div>
                              <p className={`font-semibold mono ${f.saldo > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {formatCurrency(f.saldo)}
                              </p>
                              {tienePagos && (
                                <p className="text-xs text-slate-400">Pagado: {formatCurrency(f.pagado)}</p>
                              )}
                              {tieneNC && (
                                <p className="text-xs text-purple-500">NC: {formatCurrency(f.nc)}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => { setSelectedItem(f); setShowModal('factura'); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Proveedores */}
        {activeTab === 'proveedores' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold">Proveedores</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={filtroCategoriaProveedor}
                  onChange={(e) => setFiltroCategoriaProveedor(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todas las categorías</option>
                  {CATEGORIAS_PROVEEDOR.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <button
                  onClick={() => setShowModal('informe-proveedor')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Informe
                </button>
                <button
                  onClick={() => { setSelectedItem(null); setShowModal('proveedor'); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {proveedores
                .filter(p => filtroCategoriaProveedor === 'todos' || p.categoria === filtroCategoriaProveedor)
                .map(p => {
                  const categoriaLabel = CATEGORIAS_PROVEEDOR.find(c => c.value === p.categoria)?.label || 'Sin categoría';
                  const condicionLabel = CONDICIONES_PAGO.find(c => c.value === p.condicion_pago)?.label || 'Contado';
                  return (
                    <div key={p.id} className="glass rounded-xl p-3 glow hover:border-blue-500/30 border border-transparent transition-all cursor-pointer" onClick={() => { setSelectedItem(p); setShowModal('proveedor'); }}>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoriaLabel !== 'Sin categoría' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{categoriaLabel}</span>
                        <Edit3 className="w-3 h-3 text-slate-400" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1 truncate">{p.nombre}</h3>
                      <p className="text-xs text-slate-400 truncate">{p.cuit || 'Sin CUIT'}</p>
                      {condicionLabel !== 'Contado' && <p className="text-xs text-slate-500 mt-1">{condicionLabel}</p>}
                      {p.telefono && <p className="text-xs text-slate-400 truncate mt-1">{p.telefono}</p>}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Empleados */}
        {activeTab === 'empleados' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold">Empleados</h2>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <select
                  value={filtroMesEmpleado}
                  onChange={(e) => setFiltroMesEmpleado(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="todos">Todos los meses</option>
                  {MESES.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setSelectedItem(null); setShowModal('empleado'); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Empleado
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-200">
                      <th className="px-5 py-4 font-medium">Nombre</th>
                      <th className="px-5 py-4 font-medium">Documento</th>
                      <th className="px-5 py-4 font-medium">Puesto</th>
                      <th className="px-5 py-4 font-medium">Ingreso</th>
                      <th className="px-5 py-4 font-medium">Banco</th>
                      <th className="px-5 py-4 font-medium text-right">Sueldo</th>
                      <th className="px-5 py-4 font-medium text-right">Pagado {filtroMesEmpleado !== 'todos' ? MESES[parseInt(filtroMesEmpleado)] : ''}</th>
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map(e => {
                      const pagadoMes = pagosPorEmpleado[e.id] || 0;
                      return (
                        <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">{e.nombre.split(' ').map(n => n[0]).join('')}</span>
                              </div>
                              <span className="font-medium">{e.nombre}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-400">{e.documento || '-'}</td>
                          <td className="px-5 py-4 text-sm">{e.puesto || '-'}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{formatDate(e.fecha_ingreso)}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{e.banco || '-'}</td>
                          <td className="px-5 py-4 text-right font-semibold mono">{formatCurrency(e.sueldo)}</td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-semibold mono ${pagadoMes > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                              {formatCurrency(pagadoMes)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => { setSelectedItem(e); setShowModal('empleado'); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen de sueldos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5 glow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Sueldos Mensuales</h3>
                    <p className="text-slate-400 text-sm">{empleados.length} empleados</p>
                  </div>
                  <p className="text-2xl font-bold mono text-slate-600">{formatCurrency(stats.totalSueldosFijos)}</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 glow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Pagado {filtroMesEmpleado !== 'todos' ? MESES[parseInt(filtroMesEmpleado)] : 'Total'}</h3>
                    <p className="text-slate-400 text-sm">{Object.keys(pagosPorEmpleado).length} empleados con pagos</p>
                  </div>
                  <p className="text-2xl font-bold mono text-emerald-500">{formatCurrency(totalPagadoEmpleadosMes)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pago Proveedores */}
        {activeTab === 'pago-proveedores' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Pago a Proveedores</h2>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Total pagado</p>
                  <p className="text-lg font-bold text-emerald-500 mono">{formatCurrency(pagos.filter(p => p.tipo === 'factura').reduce((sum, p) => sum + p.monto, 0))}</p>
                </div>
                <button
                  onClick={() => { setSelectedItem({ tipo: 'factura' }); setShowModal('pago'); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Pago
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                      <th className="px-3 py-3 font-medium">Fecha</th>
                      <th className="px-3 py-3 font-medium">Proveedor / Factura</th>
                      <th className="px-3 py-3 font-medium">Método</th>
                      <th className="px-3 py-3 font-medium text-right">Monto</th>
                      <th className="px-3 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.filter(p => p.tipo === 'factura').length === 0 ? (
                      <tr><td colSpan="5" className="px-3 py-8 text-center text-slate-400 text-xs">No hay pagos a proveedores registrados</td></tr>
                    ) : (
                      pagos.filter(p => p.tipo === 'factura').map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-xs">{formatDate(p.fecha)}</td>
                          <td className="px-3 py-2.5 text-xs">{p.descripcion}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{p.metodo}</td>
                          <td className="px-3 py-2.5 text-right font-semibold mono text-emerald-500 text-xs">{formatCurrency(p.monto)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button onClick={() => { setSelectedItem(p); setShowModal('edit-pago'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Ver detalle">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Notas de Crédito */}
        {activeTab === 'notas-credito' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Notas de Crédito Proveedores</h2>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Total NC</p>
                  <p className="text-lg font-bold text-purple-500 mono">{formatCurrency(notasCredito.reduce((sum, nc) => sum + nc.monto, 0))}</p>
                </div>
                <button
                  onClick={() => { setSelectedItem(null); setShowModal('nota-credito'); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nueva NC
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                      <th className="px-3 py-3 font-medium">Fecha</th>
                      <th className="px-3 py-3 font-medium">Número</th>
                      <th className="px-3 py-3 font-medium">Proveedor</th>
                      <th className="px-3 py-3 font-medium">Factura Asignada</th>
                      <th className="px-3 py-3 font-medium">Concepto</th>
                      <th className="px-3 py-3 font-medium text-right">Monto</th>
                      <th className="px-3 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasCredito.length === 0 ? (
                      <tr><td colSpan="7" className="px-3 py-8 text-center text-slate-400 text-xs">No hay notas de crédito registradas</td></tr>
                    ) : (
                      notasCredito.map(nc => (
                        <tr key={nc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-xs">{formatDate(nc.fecha)}</td>
                          <td className="px-3 py-2.5 text-xs font-medium">{nc.numero}</td>
                          <td className="px-3 py-2.5 text-xs">{nc.proveedor}</td>
                          <td className="px-3 py-2.5 text-xs">
                            {nc.factura_numero ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{nc.factura_numero}</span>
                            ) : (
                              <span className="text-slate-400">Sin asignar</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{nc.concepto || '-'}</td>
                          <td className="px-3 py-2.5 text-right font-semibold mono text-purple-500 text-xs">{formatCurrency(nc.monto)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button onClick={() => { setSelectedItem(nc); setShowModal('nota-credito'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pago Empleados */}
        {activeTab === 'pago-empleados' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold">Pago a Empleados</h2>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filtroConceptoEmpleado}
                  onChange={(e) => setFiltroConceptoEmpleado(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los conceptos</option>
                  {CONCEPTOS_EMPLEADO.map(c => <option key={c.value} value={c.label}>{c.label}</option>)}
                </select>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Total filtrado</p>
                  <p className="text-lg font-bold text-emerald-500 mono">
                    {formatCurrency(pagos
                      .filter(p => p.tipo === 'sueldo')
                      .filter(p => filtroConceptoEmpleado === 'todos' || p.descripcion?.includes(filtroConceptoEmpleado))
                      .reduce((sum, p) => sum + p.monto, 0))}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedItem({ tipo: 'sueldo' }); setShowModal('pago'); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Pago
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                      <th className="px-3 py-3 font-medium">Fecha</th>
                      <th className="px-3 py-3 font-medium">Empleado / Concepto</th>
                      <th className="px-3 py-3 font-medium">Método</th>
                      <th className="px-3 py-3 font-medium text-right">Monto</th>
                      <th className="px-3 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos
                      .filter(p => p.tipo === 'sueldo')
                      .filter(p => filtroConceptoEmpleado === 'todos' || p.descripcion?.includes(filtroConceptoEmpleado))
                      .length === 0 ? (
                      <tr><td colSpan="5" className="px-3 py-8 text-center text-slate-400 text-xs">No hay pagos con los filtros seleccionados</td></tr>
                    ) : (
                      pagos
                        .filter(p => p.tipo === 'sueldo')
                        .filter(p => filtroConceptoEmpleado === 'todos' || p.descripcion?.includes(filtroConceptoEmpleado))
                        .map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2.5 text-xs">{formatDate(p.fecha)}</td>
                            <td className="px-3 py-2.5 text-xs">{p.descripcion}</td>
                            <td className="px-3 py-2.5 text-xs text-slate-500">{p.metodo}</td>
                            <td className="px-3 py-2.5 text-right font-semibold mono text-emerald-500 text-xs">{formatCurrency(p.monto)}</td>
                            <td className="px-3 py-2.5 text-right">
                              <button onClick={() => { setSelectedItem(p); setShowModal('edit-pago'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pagos - Consulta General */}
        {activeTab === 'pagos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-lg font-bold">Consulta de Pagos</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={filtroMesPago}
                  onChange={(e) => setFiltroMesPago(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los meses</option>
                  {MESES.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
                <select
                  value={filtroTipoPago}
                  onChange={(e) => setFiltroTipoPago(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="factura">Proveedores</option>
                  <option value="sueldo">Empleados</option>
                  <option value="nc">Notas de Crédito</option>
                </select>
                <select
                  value={filtroMetodoPago}
                  onChange={(e) => setFiltroMetodoPago(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todas las formas</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                </select>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Proveedores</p>
                <p className="text-lg font-bold text-blue-500 mono">
                  {formatCurrency(pagos
                    .filter(p => p.tipo === 'factura')
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                    .reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Empleados</p>
                <p className="text-lg font-bold text-cyan-500 mono">
                  {formatCurrency(pagos
                    .filter(p => p.tipo === 'sueldo')
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                    .reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total General</p>
                <p className="text-lg font-bold text-emerald-500 mono">
                  {formatCurrency(pagos
                    .filter(p => filtroTipoPago === 'todos' || p.tipo === filtroTipoPago)
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                    .reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                      <th className="px-3 py-3 font-medium">Fecha</th>
                      <th className="px-3 py-3 font-medium">Tipo</th>
                      <th className="px-3 py-3 font-medium">Descripción</th>
                      <th className="px-3 py-3 font-medium">Método</th>
                      <th className="px-3 py-3 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosYNC
                      .filter(p => filtroTipoPago === 'todos' || p.tipo === filtroTipoPago)
                      .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                      .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                      .length === 0 ? (
                      <tr><td colSpan="5" className="px-3 py-8 text-center text-slate-400 text-xs">No hay pagos con los filtros seleccionados</td></tr>
                    ) : (
                      pagosYNC
                        .filter(p => filtroTipoPago === 'todos' || p.tipo === filtroTipoPago)
                        .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                        .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                        .map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2.5 text-xs">{formatDate(p.fecha)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                p.tipo === 'factura' ? 'bg-blue-500/15 text-blue-700' :
                                p.tipo === 'nc' ? 'bg-purple-500/15 text-purple-700' :
                                'bg-cyan-500/15 text-cyan-700'
                              }`}>
                                {p.tipo === 'factura' ? 'Proveedor' : p.tipo === 'nc' ? 'NC' : 'Empleado'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs">{p.descripcion}</td>
                            <td className="px-3 py-2.5 text-xs text-slate-500">{p.metodo}</td>
                            <td className={`px-3 py-2.5 text-right font-semibold mono text-xs ${p.tipo === 'nc' ? 'text-purple-500' : 'text-emerald-500'}`}>{formatCurrency(p.monto)}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INFORMES */}
        {activeTab === 'informes' && (
          <div className="space-y-4">
            {/* Header con filtros de año y mes */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-lg font-bold">Informes</h2>
              <div className="flex gap-2">
                <select
                  value={filtroAnioInforme}
                  onChange={(e) => setFiltroAnioInforme(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los años</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <select
                  value={filtroMesInforme}
                  onChange={(e) => setFiltroMesInforme(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todos los meses</option>
                  {MESES.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-tabs de informes */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'anulaciones', label: 'Anulaciones', icon: AlertCircle },
                { id: 'compras-proveedor', label: 'Compras por Proveedor', icon: Building2 },
                { id: 'compras-rubro', label: 'Compras por Rubro', icon: Truck },
                { id: 'pagos-mes', label: 'Pagos del Mes', icon: DollarSign },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setInformeActivo(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    informeActivo === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* INFORME: Anulaciones */}
            {informeActivo === 'anulaciones' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4 border-l-4 border-red-400">
                    <p className="text-xs text-slate-500">Facturas Anuladas</p>
                    <p className="text-2xl font-bold text-red-500">
                      {anulaciones.filter(a => a.tipo === 'factura').filter(a => (filtroAnioInforme === 'todos' || new Date(a.fecha_anulacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(a.fecha_anulacion).getMonth() === parseInt(filtroMesInforme))).length}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Total: {formatCurrency(anulaciones.filter(a => a.tipo === 'factura').filter(a => (filtroAnioInforme === 'todos' || new Date(a.fecha_anulacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(a.fecha_anulacion).getMonth() === parseInt(filtroMesInforme))).reduce((sum, a) => sum + (parseFloat(a.datos_originales?.monto) || 0), 0))}
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4 border-l-4 border-orange-400">
                    <p className="text-xs text-slate-500">Pagos Anulados</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {anulaciones.filter(a => a.tipo === 'pago').filter(a => (filtroAnioInforme === 'todos' || new Date(a.fecha_anulacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(a.fecha_anulacion).getMonth() === parseInt(filtroMesInforme))).length}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Total: {formatCurrency(anulaciones.filter(a => a.tipo === 'pago').filter(a => (filtroAnioInforme === 'todos' || new Date(a.fecha_anulacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(a.fecha_anulacion).getMonth() === parseInt(filtroMesInforme))).reduce((sum, a) => sum + (parseFloat(a.datos_originales?.monto) || 0), 0))}
                    </p>
                  </div>
                </div>
                <div className="glass rounded-2xl glow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-400 text-xs border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 font-medium">Fecha</th>
                          <th className="px-4 py-3 font-medium">Tipo</th>
                          <th className="px-4 py-3 font-medium">Detalle</th>
                          <th className="px-4 py-3 font-medium text-right">Monto</th>
                          <th className="px-4 py-3 font-medium">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anulaciones.filter(a => (filtroAnioInforme === 'todos' || new Date(a.fecha_anulacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(a.fecha_anulacion).getMonth() === parseInt(filtroMesInforme))).length === 0 ? (
                          <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-sm">No hay anulaciones</td></tr>
                        ) : (
                          anulaciones.filter(a => (filtroAnioInforme === 'todos' || new Date(a.fecha_anulacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(a.fecha_anulacion).getMonth() === parseInt(filtroMesInforme))).map(a => (
                            <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 text-xs">{new Date(a.fecha_anulacion).toLocaleDateString('es-AR')}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.tipo === 'factura' ? 'bg-red-500/15 text-red-700' : 'bg-orange-500/15 text-orange-700'}`}>
                                  {a.tipo === 'factura' ? 'Factura' : 'Pago'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {a.tipo === 'factura' ? `${a.datos_originales?.proveedor} - Fact. ${a.datos_originales?.numero}` : a.datos_originales?.descripcion}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold mono text-red-500">{formatCurrency(a.datos_originales?.monto || 0)}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">{a.motivo}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* INFORME: Compras por Proveedor */}
            {informeActivo === 'compras-proveedor' && (() => {
              const facturasFiltradas = facturas.filter(f => (filtroAnioInforme === 'todos' || new Date(f.fecha).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(f.fecha).getMonth() === parseInt(filtroMesInforme)));
              const comprasPorProveedor = proveedores.map(p => {
                const facturasProveedor = facturasFiltradas.filter(f => f.proveedor_id === p.id);
                const total = facturasProveedor.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
                return { ...p, facturas: facturasProveedor.length, total };
              }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);
              const totalGeneral = comprasPorProveedor.reduce((sum, p) => sum + p.total, 0);

              return (
                <div className="space-y-4">
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-slate-500">Total Compras</p>
                    <p className="text-2xl font-bold text-blue-500 mono">{formatCurrency(totalGeneral)}</p>
                    <p className="text-xs text-slate-400">{comprasPorProveedor.length} proveedores</p>
                  </div>
                  <div className="glass rounded-2xl glow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-400 text-xs border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 font-medium">Proveedor</th>
                            <th className="px-4 py-3 font-medium">Categoría</th>
                            <th className="px-4 py-3 font-medium text-center">Facturas</th>
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                            <th className="px-4 py-3 font-medium text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comprasPorProveedor.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-sm">No hay compras en el período</td></tr>
                          ) : (
                            comprasPorProveedor.map(p => (
                              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                                <td className="px-4 py-3 text-xs text-slate-500">{CATEGORIAS_PROVEEDOR.find(c => c.value === p.categoria)?.label || '-'}</td>
                                <td className="px-4 py-3 text-center">{p.facturas}</td>
                                <td className="px-4 py-3 text-right font-semibold mono text-blue-500">{formatCurrency(p.total)}</td>
                                <td className="px-4 py-3 text-right text-xs text-slate-500">{((p.total / totalGeneral) * 100).toFixed(1)}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {comprasPorProveedor.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-50 font-bold">
                              <td className="px-4 py-3" colSpan="3">TOTAL</td>
                              <td className="px-4 py-3 text-right mono text-blue-600">{formatCurrency(totalGeneral)}</td>
                              <td className="px-4 py-3 text-right">100%</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* INFORME: Compras por Rubro */}
            {informeActivo === 'compras-rubro' && (() => {
              const facturasFiltradas = facturas.filter(f => (filtroAnioInforme === 'todos' || new Date(f.fecha).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(f.fecha).getMonth() === parseInt(filtroMesInforme)));
              const comprasPorRubro = CATEGORIAS_PROVEEDOR.map(cat => {
                const proveedoresRubro = proveedores.filter(p => p.categoria === cat.value);
                const facturasRubro = facturasFiltradas.filter(f => proveedoresRubro.some(p => p.id === f.proveedor_id));
                const total = facturasRubro.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
                return { ...cat, facturas: facturasRubro.length, proveedores: proveedoresRubro.length, total };
              }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
              const totalGeneral = comprasPorRubro.reduce((sum, r) => sum + r.total, 0);

              return (
                <div className="space-y-4">
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-slate-500">Total por Rubro</p>
                    <p className="text-2xl font-bold text-purple-500 mono">{formatCurrency(totalGeneral)}</p>
                    <p className="text-xs text-slate-400">{comprasPorRubro.length} rubros con movimiento</p>
                  </div>
                  <div className="glass rounded-2xl glow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-400 text-xs border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 font-medium">Rubro</th>
                            <th className="px-4 py-3 font-medium text-center">Proveedores</th>
                            <th className="px-4 py-3 font-medium text-center">Facturas</th>
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                            <th className="px-4 py-3 font-medium text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comprasPorRubro.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-sm">No hay compras en el período</td></tr>
                          ) : (
                            comprasPorRubro.map(r => (
                              <tr key={r.value} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{r.label}</td>
                                <td className="px-4 py-3 text-center text-slate-500">{r.proveedores}</td>
                                <td className="px-4 py-3 text-center">{r.facturas}</td>
                                <td className="px-4 py-3 text-right font-semibold mono text-purple-500">{formatCurrency(r.total)}</td>
                                <td className="px-4 py-3 text-right text-xs text-slate-500">{((r.total / totalGeneral) * 100).toFixed(1)}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {comprasPorRubro.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-50 font-bold">
                              <td className="px-4 py-3" colSpan="3">TOTAL</td>
                              <td className="px-4 py-3 text-right mono text-purple-600">{formatCurrency(totalGeneral)}</td>
                              <td className="px-4 py-3 text-right">100%</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* INFORME: Pagos del Mes */}
            {informeActivo === 'pagos-mes' && (() => {
              const pagosFiltrados = pagos.filter(p => (filtroAnioInforme === 'todos' || new Date(p.fecha).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesInforme)));
              const pagosProveedores = pagosFiltrados.filter(p => p.tipo === 'factura');
              const pagosEmpleados = pagosFiltrados.filter(p => p.tipo === 'sueldo');
              const totalProveedores = pagosProveedores.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
              const totalEmpleados = pagosEmpleados.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
              const totalGeneral = totalProveedores + totalEmpleados;

              // Agrupar por método de pago
              const pagosPorMetodo = ['Efectivo', 'Transferencia', 'Cheque', 'Mercado Pago', 'Tarjeta'].map(metodo => {
                const pagosMetodo = pagosFiltrados.filter(p => p.metodo === metodo);
                return { metodo, cantidad: pagosMetodo.length, total: pagosMetodo.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0) };
              }).filter(m => m.total > 0);

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="glass rounded-xl p-4 border-l-4 border-blue-400">
                      <p className="text-xs text-slate-500">Pagos a Proveedores</p>
                      <p className="text-xl font-bold text-blue-500 mono">{formatCurrency(totalProveedores)}</p>
                      <p className="text-xs text-slate-400">{pagosProveedores.length} pagos</p>
                    </div>
                    <div className="glass rounded-xl p-4 border-l-4 border-cyan-400">
                      <p className="text-xs text-slate-500">Pagos a Empleados</p>
                      <p className="text-xl font-bold text-cyan-500 mono">{formatCurrency(totalEmpleados)}</p>
                      <p className="text-xs text-slate-400">{pagosEmpleados.length} pagos</p>
                    </div>
                    <div className="glass rounded-xl p-4 border-l-4 border-emerald-400">
                      <p className="text-xs text-slate-500">Total General</p>
                      <p className="text-xl font-bold text-emerald-500 mono">{formatCurrency(totalGeneral)}</p>
                      <p className="text-xs text-slate-400">{pagosFiltrados.length} pagos</p>
                    </div>
                  </div>

                  {/* Por método de pago */}
                  <div className="glass rounded-2xl p-4">
                    <h3 className="text-sm font-semibold mb-3">Por Método de Pago</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {pagosPorMetodo.map(m => (
                        <div key={m.metodo} className="bg-slate-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">{m.metodo}</p>
                          <p className="font-bold mono text-sm">{formatCurrency(m.total)}</p>
                          <p className="text-xs text-slate-400">{m.cantidad} pagos</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabla de pagos */}
                  <div className="glass rounded-2xl glow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-400 text-xs border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 font-medium">Fecha</th>
                            <th className="px-4 py-3 font-medium">Tipo</th>
                            <th className="px-4 py-3 font-medium">Descripción</th>
                            <th className="px-4 py-3 font-medium">Método</th>
                            <th className="px-4 py-3 font-medium text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagosFiltrados.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-sm">No hay pagos en el período</td></tr>
                          ) : (
                            pagosFiltrados.map(p => (
                              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 text-xs">{formatDate(p.fecha)}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.tipo === 'factura' ? 'bg-blue-500/15 text-blue-700' : 'bg-cyan-500/15 text-cyan-700'}`}>
                                    {p.tipo === 'factura' ? 'Proveedor' : 'Empleado'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs">{p.descripcion}</td>
                                <td className="px-4 py-3 text-xs text-slate-500">{p.metodo}</td>
                                <td className="px-4 py-3 text-right font-semibold mono text-emerald-500">{formatCurrency(p.monto)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {pagosFiltrados.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-50 font-bold">
                              <td className="px-4 py-3" colSpan="4">TOTAL</td>
                              <td className="px-4 py-3 text-right mono text-emerald-600">{formatCurrency(totalGeneral)}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Modal Proveedor */}
      {showModal === 'proveedor' && (
        <ModalProveedor
          proveedor={selectedItem}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data) => updateProveedor(selectedItem.id, data) : createProveedor}
          onDelete={deleteProveedor}
        />
      )}

      {/* Modal Informe Proveedor */}
      {showModal === 'informe-proveedor' && (
        <ModalInformeProveedor
          onClose={() => setShowModal(null)}
          proveedores={proveedores}
          facturas={facturas}
          pagos={pagos}
          notasCredito={notasCredito}
        />
      )}

      {/* Modal Factura */}
      {showModal === 'factura' && (
        <ModalFactura
          factura={selectedItem}
          proveedores={proveedores}
          facturas={facturas}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data) => updateFactura(selectedItem.id, data) : createFactura}
          onDelete={deleteFactura}
        />
      )}

      {/* Modal Empleado */}
      {showModal === 'empleado' && (
        <ModalEmpleado
          empleado={selectedItem}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data) => updateEmpleado(selectedItem.id, data) : createEmpleado}
          onDelete={deleteEmpleado}
        />
      )}

      {/* Modal Pago */}
      {showModal === 'pago' && (
        <ModalPago
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={createPago}
          tipoDefault={selectedItem?.tipo}
          proveedores={proveedores}
          empleados={empleados}
          facturas={facturas}
          pagos={pagos}
          notasCredito={notasCredito}
          onMarcarFacturaPagada={async (facturaId) => {
            await supabase.from('facturas').update({ estado: 'pagada' }).eq('id', facturaId);
            await fetchFacturas();
          }}
        />
      )}

      {/* Modal Nota de Crédito */}
      {showModal === 'nota-credito' && (
        <ModalNotaCredito
          nota={selectedItem}
          proveedores={proveedores}
          facturas={facturas}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data) => updateNotaCredito(selectedItem.id, data) : createNotaCredito}
          onDelete={deleteNotaCredito}
        />
      )}

      {/* Modal Editar Pago */}
      {showModal === 'edit-pago' && selectedItem && (
        <ModalEditPago
          pago={selectedItem}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={updatePago}
          onDelete={deletePago}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-white">Cargando datos...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
