import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, DollarSign, Users, FileText, AlertTriangle,
  Calendar, Plus, X, Search, ChevronDown, ChevronUp, ChevronRight,
  Building2, CreditCard, Clock, CheckCircle, AlertCircle,
  Truck, User, Edit3, Trash2, Filter, Download,
  TrendingUp, TrendingDown, Loader2, LogOut, Eye, Printer, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from './supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value, decimals = true) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: decimals ? 2 : 0 }).format(value);
};

// Formatear número con separador de miles para inputs (permite 2 decimales)
const formatInputMonto = (value) => {
  if (!value && value !== 0) return '';
  let str = typeof value === 'string' ? value : value.toString();

  // Si es número, convertir punto decimal a coma
  if (typeof value === 'number') {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  }

  // Permitir solo dígitos, puntos (miles) y coma (decimal)
  str = str.replace(/[^\d.,]/g, '');

  // Separar parte entera y decimal
  const parts = str.split(',');
  let intPart = parts[0].replace(/\./g, ''); // quitar puntos de miles
  let decPart = parts[1] !== undefined ? parts[1].slice(0, 2) : null; // máximo 2 decimales

  if (!intPart && !decPart) return '';

  // Formatear parte entera con separador de miles
  intPart = intPart ? new Intl.NumberFormat('es-AR').format(parseInt(intPart)) : '0';

  // Retornar con o sin decimales
  if (decPart !== null) {
    return `${intPart},${decPart}`;
  }
  return intPart;
};

// Parsear monto formateado a número (soporta decimales con coma)
const parseInputMonto = (value) => {
  if (!value) return '';
  // Quitar puntos de miles, reemplazar coma decimal por punto
  const cleaned = value.toString().replace(/\./g, '').replace(',', '.');
  return cleaned;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CATEGORIAS_PROVEEDOR = [
  { value: 'almacen', label: 'Almacén' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'arreglos', label: 'Arreglos de local' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'carnes', label: 'Carnes' },
  { value: 'contabilidad', label: 'Contabilidad' },
  { value: 'dj_eventos', label: 'DJ Eventos' },
  { value: 'limpieza', label: 'Elementos de limpieza' },
  { value: 'impuestos_municipales', label: 'Impuestos municipales' },
  { value: 'iva', label: 'IVA' },
  { value: 'mariscos', label: 'Mariscos' },
  { value: 'panaderia', label: 'Panadería' },
  { value: 'pescaderia', label: 'Pescadería' },
  { value: 'planes_afip_arba', label: 'Planes AFIP/ARBA' },
  { value: 'pollo', label: 'Pollo' },
  { value: 'quesos_fiambres', label: 'Quesos y fiambres' },
  { value: 'servicio_gas', label: 'Servicio de gas' },
  { value: 'servicio_luz', label: 'Servicio de luz' },
  { value: 'tecnica_eventos', label: 'Técnica eventos' },
  { value: 'verduras', label: 'Verduras' },
  { value: 'otros', label: 'Otros' }
];

const CONDICIONES_PAGO = [
  { value: 0, label: 'Contado' },
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 21, label: '21 días' },
  { value: 30, label: '30 días' },
  { value: 45, label: '45 días' },
  { value: 60, label: '60 días' }
];

const FORMAS_PAGO_PROVEEDOR = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'echeq', label: 'E-Cheq' }
];

// ==================== DATOS DEMO ====================
const DEMO_PROVEEDORES = [
  { id: 1, nombre: 'Pescadería del Puerto', categoria: 'pescaderia', condicion_pago: 15, cuit: '30-71234567-9', telefono: '011-4555-1234', email: 'ventas@pescaderiapuerto.com', banco: 'Banco Nación', cbu: '0110012345678901234567', contacto: 'Juan Pérez', celular: '11-5555-1234', forma_pago: 'transferencia' },
  { id: 2, nombre: 'Carnes Don Mario', categoria: 'carnes', condicion_pago: 7, cuit: '20-12345678-9', telefono: '011-4666-5678', email: 'pedidos@carnesdonmario.com', banco: 'Banco Galicia', cbu: '0070012345678901234568', contacto: 'Mario González', celular: '11-6666-5678', forma_pago: 'efectivo' },
  { id: 3, nombre: 'Bodega Santa Julia', categoria: 'bodega', condicion_pago: 30, cuit: '30-98765432-1', telefono: '0261-555-9999', email: 'comercial@santajulia.com', banco: 'Banco Santander', cbu: '0720012345678901234569', contacto: 'Ana Martínez', celular: '261-555-8888', forma_pago: 'echeq' },
  { id: 4, nombre: 'Distribuidora Central', categoria: 'almacen', condicion_pago: 21, cuit: '30-55566677-8', telefono: '011-4777-8888', email: 'ventas@distcentral.com', banco: 'Banco BBVA', cbu: '0170012345678901234570', contacto: 'Carlos Ruiz', celular: '11-7777-8888', forma_pago: 'transferencia' },
  { id: 5, nombre: 'Verdulería La Huerta', categoria: 'verduras', condicion_pago: 0, cuit: '20-33344455-6', telefono: '011-4888-9999', email: 'lahuerta@gmail.com', banco: null, cbu: null, contacto: 'Pedro Sánchez', celular: '11-8888-9999', forma_pago: 'efectivo' },
  { id: 6, nombre: 'Bebidas del Sur', categoria: 'bebidas', condicion_pago: 15, cuit: '30-77788899-0', telefono: '011-4999-0000', email: 'pedidos@bebidasdelsur.com', banco: 'Banco Macro', cbu: '2850012345678901234571', contacto: 'Laura Fernández', celular: '11-9999-0000', forma_pago: 'transferencia' },
];

const DEMO_EMPLEADOS = [
  { id: 1, nombre: 'María García', documento: '28.456.789', puesto: 'Chef Principal', sueldo: 850000, fecha_ingreso: '2020-03-15', banco: 'Banco Nación', cbu: '0110099988877766655544' },
  { id: 2, nombre: 'Roberto López', documento: '32.123.456', puesto: 'Ayudante de Cocina', sueldo: 520000, fecha_ingreso: '2021-06-01', banco: 'Banco Galicia', cbu: '0070099988877766655545' },
  { id: 3, nombre: 'Lucía Martínez', documento: '35.789.012', puesto: 'Mozo', sueldo: 480000, fecha_ingreso: '2022-01-10', banco: 'Mercado Pago', cbu: '0000099988877766655546' },
  { id: 4, nombre: 'Diego Fernández', documento: '30.567.890', puesto: 'Mozo', sueldo: 480000, fecha_ingreso: '2022-03-20', banco: 'Banco Santander', cbu: '0720099988877766655547' },
  { id: 5, nombre: 'Carolina Ruiz', documento: '33.234.567', puesto: 'Cajera', sueldo: 450000, fecha_ingreso: '2023-02-01', banco: 'Banco BBVA', cbu: '0170099988877766655548' },
];

const DEMO_CLIENTES = [
  { id: 1, nombre: 'Hotel Libertador', cuit: '30-11122233-4', telefono: '011-4321-1234', email: 'compras@hotellibertador.com', direccion: 'Av. Córdoba 690, CABA', condicion_iva: 'Responsable Inscripto' },
  { id: 2, nombre: 'Catering Premium SA', cuit: '30-44455566-7', telefono: '011-4321-5678', email: 'pedidos@cateringpremium.com', direccion: 'Av. del Libertador 1234, CABA', condicion_iva: 'Responsable Inscripto' },
  { id: 3, nombre: 'Eventos Corporativos SRL', cuit: '30-77788899-0', telefono: '011-4321-9012', email: 'admin@eventoscorp.com', direccion: 'Maipú 456, CABA', condicion_iva: 'Responsable Inscripto' },
  { id: 4, nombre: 'Club Náutico San Isidro', cuit: '30-99900011-2', telefono: '011-4747-3456', email: 'gerencia@clubnautico.com', direccion: 'Av. del Libertador 16789, San Isidro', condicion_iva: 'Exento' },
];

// Generar fechas relativas al día actual
const hoy = new Date();
const hace = (dias) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
};
const dentro = (dias) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
};

const DEMO_FACTURAS = [
  { id: 1, proveedor_id: 1, numero: 'A-0001-00012345', monto: 185000, fecha: hace(25), vencimiento: hace(10), estado: 'vencida', concepto: 'Pescados varios', proveedor: 'Pescadería del Puerto' },
  { id: 2, proveedor_id: 2, numero: 'A-0003-00098765', monto: 320000, fecha: hace(20), vencimiento: hace(13), estado: 'vencida', concepto: 'Cortes de carne', proveedor: 'Carnes Don Mario' },
  { id: 3, proveedor_id: 3, numero: 'A-0002-00054321', monto: 245000, fecha: hace(15), vencimiento: dentro(15), estado: 'pendiente', concepto: 'Vinos selección', proveedor: 'Bodega Santa Julia' },
  { id: 4, proveedor_id: 4, numero: 'B-0001-00011111', monto: 89500, fecha: hace(10), vencimiento: dentro(11), estado: 'pendiente', concepto: 'Productos secos', proveedor: 'Distribuidora Central' },
  { id: 5, proveedor_id: 5, numero: 'C-0001-00022222', monto: 45000, fecha: hace(5), vencimiento: hace(5), estado: 'pagada', concepto: 'Verduras frescas', proveedor: 'Verdulería La Huerta' },
  { id: 6, proveedor_id: 6, numero: 'A-0005-00033333', monto: 156000, fecha: hace(3), vencimiento: dentro(12), estado: 'pendiente', concepto: 'Bebidas gaseosas y aguas', proveedor: 'Bebidas del Sur' },
  { id: 7, proveedor_id: 1, numero: 'A-0001-00012346', monto: 210000, fecha: hace(2), vencimiento: dentro(13), estado: 'pendiente', concepto: 'Mariscos premium', proveedor: 'Pescadería del Puerto' },
  { id: 8, proveedor_id: 2, numero: 'A-0003-00098766', monto: 275000, fecha: hace(1), vencimiento: dentro(6), estado: 'pendiente', concepto: 'Carne vacuna', proveedor: 'Carnes Don Mario' },
];

const DEMO_PAGOS = [
  { id: 1, tipo: 'factura', referencia_id: 5, descripcion: 'Verdulería La Huerta - Fact. C-0001-00022222', monto: 45000, fecha: hace(5), metodo: 'Efectivo', estado: 'confirmado', conciliado: true, conciliado_nota: 'Pago en efectivo' },
  { id: 2, tipo: 'factura', referencia_id: 1, descripcion: 'Pescadería del Puerto - Fact. A-0001-00012345 (parcial)', monto: 100000, fecha: hace(8), metodo: 'Transferencia', estado: 'confirmado', conciliado: true, conciliado_nota: 'Banco orden 45678' },
  { id: 3, tipo: 'sueldo', referencia_id: 1, descripcion: 'Sueldo Diciembre - María García', monto: 850000, fecha: hace(15), metodo: 'Transferencia', estado: 'confirmado', conciliado: false },
  { id: 4, tipo: 'sueldo', referencia_id: 2, descripcion: 'Sueldo Diciembre - Roberto López', monto: 520000, fecha: hace(15), metodo: 'Transferencia', estado: 'confirmado', conciliado: false },
  { id: 5, tipo: 'sueldo', referencia_id: 3, descripcion: 'Sueldo Diciembre - Lucía Martínez', monto: 480000, fecha: hace(15), metodo: 'Mercado Pago', estado: 'confirmado', conciliado: true, conciliado_nota: 'MP confirmado' },
  { id: 6, tipo: 'factura', referencia_id: 2, descripcion: 'Carnes Don Mario - Fact. A-0003-00098765', monto: 320000, fecha: hace(5), metodo: 'Transferencia', estado: 'confirmado', conciliado: false },
];

const DEMO_NOTAS_CREDITO = [
  { id: 1, proveedor_id: 1, factura_id: 1, numero: 'NC-0001-00000123', monto: 15000, fecha: hace(12), concepto: 'Devolución mercadería en mal estado', proveedor: 'Pescadería del Puerto', factura_numero: 'A-0001-00012345' },
];

const DEMO_FACTURAS_VENTA = [
  { id: 1, cliente_id: 1, numero: 'A-0001-00000101', monto: 450000, subtotal: 371900, iva_porcentaje: 21, iva_monto: 78100, fecha: hace(20), vencimiento: dentro(10), estado: 'pendiente', concepto: 'Servicio catering evento', cliente: 'Hotel Libertador' },
  { id: 2, cliente_id: 2, numero: 'A-0001-00000102', monto: 280000, subtotal: 231405, iva_porcentaje: 21, iva_monto: 48595, fecha: hace(15), vencimiento: hace(5), estado: 'cobrada', concepto: 'Almuerzo corporativo 50 personas', cliente: 'Catering Premium SA' },
  { id: 3, cliente_id: 3, numero: 'A-0001-00000103', monto: 620000, subtotal: 512397, iva_porcentaje: 21, iva_monto: 107603, fecha: hace(10), vencimiento: dentro(20), estado: 'pendiente', concepto: 'Evento fin de año', cliente: 'Eventos Corporativos SRL' },
  { id: 4, cliente_id: 4, numero: 'A-0001-00000104', monto: 180000, subtotal: 180000, iva_porcentaje: 0, iva_monto: 0, fecha: hace(5), vencimiento: dentro(25), estado: 'pendiente', concepto: 'Almuerzo socios', cliente: 'Club Náutico San Isidro' },
];

const DEMO_COBROS = [
  { id: 1, cliente_id: 2, factura_venta_id: 2, descripcion: 'Catering Premium SA - Fact. A-0001-00000102 (Transferencia)', monto: 250000, fecha: hace(3), metodo: 'Transferencia' },
  { id: 2, cliente_id: 2, factura_venta_id: 2, descripcion: 'Catering Premium SA - Fact. A-0001-00000102 (Retención)', monto: 30000, fecha: hace(3), metodo: 'Retención' },
  { id: 3, cliente_id: 1, factura_venta_id: 1, descripcion: 'Hotel Libertador - Fact. A-0001-00000101 (Transferencia)', monto: 200000, fecha: hace(1), metodo: 'Transferencia' },
];

const DEMO_ORDENES_PAGO = [
  { id: 1, numero: 1, fecha: hace(5), pagos: [6], total: 320000, created_at: hace(5) },
];

const DEMO_ANULACIONES = [];
const DEMO_MODIFICACIONES = [];

// Función para detectar modo demo
const isDemoMode = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'true';
  }
  return false;
};

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

// Modal Informe Cliente
function ModalInformeCliente({ onClose, clientes, facturasVenta, cobros }) {
  const [clienteId, setClienteId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);
  const [generando, setGenerando] = useState(false);

  const cliente = clientes.find(c => c.id === parseInt(clienteId));

  const generarPDF = () => {
    if (!clienteId) return;
    setGenerando(true);

    try {
      const doc = new jsPDF();
      const cli = clientes.find(c => c.id === parseInt(clienteId));

      // Filtrar datos por cliente y fechas
      const facturasCliente = facturasVenta
        .filter(f => f.cliente_id === parseInt(clienteId))
        .filter(f => {
          if (!fechaDesde) return true;
          return f.fecha >= fechaDesde && f.fecha <= fechaHasta;
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      const cobrosCliente = cobros
        .filter(c => c.cliente_id === parseInt(clienteId))
        .filter(c => {
          if (!fechaDesde) return true;
          return c.fecha >= fechaDesde && c.fecha <= fechaHasta;
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      // Encabezado
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('CUENTA CORRIENTE', 105, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.text(cli?.nombre || 'Cliente', 105, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoTexto = fechaDesde
        ? `Período: ${formatDate(fechaDesde)} - ${formatDate(fechaHasta)}`
        : `Hasta: ${formatDate(fechaHasta)}`;
      doc.text(periodoTexto, 105, 38, { align: 'center' });

      let yPos = 50;

      // Datos del cliente
      doc.setFontSize(10);
      if (cli?.cuit) { doc.text(`CUIT: ${cli.cuit}`, 14, yPos); yPos += 5; }
      if (cli?.telefono) { doc.text(`Tel: ${cli.telefono}`, 14, yPos); yPos += 5; }
      if (cli?.email) { doc.text(`Email: ${cli.email}`, 14, yPos); yPos += 5; }
      if (cli?.condicion_iva) { doc.text(`Cond. IVA: ${cli.condicion_iva}`, 14, yPos); yPos += 5; }
      if (cli?.direccion) { doc.text(`Dirección: ${cli.direccion}`, 14, yPos); yPos += 5; }
      yPos += 5;

      // FACTURAS
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURAS EMITIDAS', 14, yPos);
      yPos += 5;

      if (facturasCliente.length > 0) {
        const facturasData = facturasCliente.map(f => [
          formatDate(f.fecha),
          f.numero || '-',
          formatDate(f.vencimiento),
          f.estado ? f.estado.charAt(0).toUpperCase() + f.estado.slice(1) : '-',
          formatCurrencyPDF(f.monto)
        ]);

        const totalFacturas = facturasCliente.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Número', 'Vencimiento', 'Estado', 'Monto']],
          body: facturasData,
          foot: [['', '', '', 'TOTAL:', formatCurrencyPDF(totalFacturas)]],
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
          columnStyles: { 4: { halign: 'right' } }
        });
        yPos = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('No hay facturas en el período seleccionado', 14, yPos + 5);
        yPos += 15;
      }

      // COBROS
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('COBROS RECIBIDOS', 14, yPos);
      yPos += 5;

      if (cobrosCliente.length > 0) {
        const cobrosData = cobrosCliente.map(c => {
          const factura = facturasVenta.find(f => f.id === c.factura_venta_id);
          return [
            formatDate(c.fecha),
            factura?.numero || '-',
            c.metodo || '-',
            formatCurrencyPDF(c.monto)
          ];
        });

        const totalCobros = cobrosCliente.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Factura', 'Método', 'Monto']],
          body: cobrosData,
          foot: [['', '', 'TOTAL:', formatCurrencyPDF(totalCobros)]],
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
          columnStyles: { 3: { halign: 'right' } }
        });
        yPos = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('No hay cobros en el período seleccionado', 14, yPos + 5);
        yPos += 15;
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

      const totalFacturasSum = facturasCliente.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
      const totalCobrosSum = cobrosCliente.filter(c => c.metodo !== 'Retención').reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const totalRetencionesSum = cobrosCliente.filter(c => c.metodo === 'Retención').reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const saldoPendiente = totalFacturasSum - totalCobrosSum - totalRetencionesSum;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Facturado: ${formatCurrencyPDF(totalFacturasSum)}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Cobros: ${formatCurrencyPDF(totalCobrosSum)}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Retenciones: ${formatCurrencyPDF(totalRetencionesSum)}`, 14, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const saldoColor = saldoPendiente > 0 ? [220, 38, 38] : [16, 185, 129];
      doc.setTextColor(...saldoColor);
      doc.text(`SALDO: ${formatCurrencyPDF(saldoPendiente)}`, 14, yPos);
      doc.setTextColor(0, 0, 0);

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      }

      // Guardar PDF
      const fileName = `CuentaCorriente_${cli?.nombre?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
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
          <h2 className="text-xl font-bold">Informe de Cliente</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Cliente *</label>
            <select
              required
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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

          {cliente && (
            <div className="p-3 bg-slate-50 rounded-xl text-sm">
              <p className="font-medium">{cliente.nombre}</p>
              {cliente.cuit && <p className="text-slate-500">CUIT: {cliente.cuit}</p>}
              {cliente.condicion_iva && <p className="text-slate-500">Cond. IVA: {cliente.condicion_iva}</p>}
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
              disabled={!clienteId || generando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
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
// Situaciones de IVA
const SITUACIONES_IVA = [
  { value: 21, label: 'Responsable Inscripto (21%)' },
  { value: 10.5, label: 'Responsable Inscripto (10.5%)' },
  { value: 0, label: 'Monotributista / Exento (Sin IVA)' }
];

function ModalProveedor({ proveedor, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    contacto: proveedor?.contacto || '',
    celular: proveedor?.celular || '',
    categoria: proveedor?.categoria || '',
    condicion_pago: proveedor?.condicion_pago ?? 0,
    forma_pago: proveedor?.forma_pago || '',
    situacion_iva: proveedor?.situacion_iva ?? 21,
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
      <div className="glass rounded-2xl p-5 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className={proveedor ? "grid grid-cols-3 gap-2" : ""}>
            <div className={proveedor ? "col-span-2" : ""}>
              <label className="block text-xs text-slate-400 mb-0.5">Nombre *</label>
              <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            {proveedor && (
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Código</label>
                <input type="text" value={proveedor?.codigo || ''} readOnly className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-mono text-sm" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Categoría</label>
              <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                <option value="">Sin categoría</option>
                {CATEGORIAS_PROVEEDOR.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Contacto</label>
              <input type="text" value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" placeholder="Nombre persona" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Celular</label>
              <input type="text" value={form.celular} onChange={e => setForm({...form, celular: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" placeholder="11-XXXX-XXXX" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Situación IVA</label>
              <select value={form.situacion_iva} onChange={e => setForm({...form, situacion_iva: parseFloat(e.target.value)})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                {SITUACIONES_IVA.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Condición Pago</label>
              <select value={form.condicion_pago} onChange={e => setForm({...form, condicion_pago: parseInt(e.target.value)})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                {CONDICIONES_PAGO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Forma Pago</label>
              <select value={form.forma_pago} onChange={e => setForm({...form, forma_pago: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                <option value="">-</option>
                {FORMAS_PAGO_PROVEEDOR.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">CUIT</label>
              <input type="text" value={form.cuit} onChange={e => setForm({...form, cuit: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" placeholder="XX-XXXXXXXX-X" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Teléfono</label>
              <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Banco</label>
              <input type="text" value={form.banco} onChange={e => setForm({...form, banco: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">CBU</label>
              <input type="text" value={form.cbu} onChange={e => setForm({...form, cbu: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {proveedor && onDelete && (
              <button type="button" onClick={handleDelete} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all text-sm">
                Eliminar
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
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
function ModalFactura({ factura, proveedores, facturas = [], onClose, onSave, onDelete, onRegistrarPago }) {
  // Calcular bruto desde neto si es edición (bruto = neto / (1 + iva%))
  const calcularBrutoDesdeNeto = (neto, ivaPct) => {
    if (!neto || ivaPct === null) return neto;
    return neto / (1 + ivaPct / 100);
  };

  const [form, setForm] = useState({
    proveedor_id: factura?.proveedor_id || '',
    numero: factura?.numero || '',
    bruto: factura?.bruto || (factura?.monto ? calcularBrutoDesdeNeto(factura.monto, factura.iva_porcentaje || 21) : ''),
    iva_porcentaje: factura?.iva_porcentaje ?? 21,
    otras_retenciones: factura?.otras_retenciones || 0,
    monto: factura?.monto || '', // monto = neto (total)
    fecha: factura?.fecha || new Date().toISOString().split('T')[0],
    dias_vencimiento: factura ? null : 0,
    vencimiento: factura?.vencimiento || '',
    estado: factura?.estado || 'pendiente',
    concepto: factura?.concepto || '',
    // Segundo IVA (opcional)
    bruto2: factura?.bruto2 || 0,
    iva_porcentaje2: factura?.iva_porcentaje2 ?? 10.5
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarIva2, setMostrarIva2] = useState(factura?.bruto2 > 0 || false);

  // Calcular neto (total) desde bruto + IVA + bruto2 + IVA2 + otras retenciones
  const calcularNeto = (bruto, ivaPct, retenciones, bruto2 = 0, ivaPct2 = 10.5) => {
    const brutoNum = parseFloat(bruto) || 0;
    const iva = brutoNum * (ivaPct / 100);
    const bruto2Num = parseFloat(bruto2) || 0;
    const iva2 = bruto2Num * (ivaPct2 / 100);
    const ret = parseFloat(retenciones) || 0;
    return Math.round((brutoNum + iva + bruto2Num + iva2 + ret) * 100) / 100; // Redondear a 2 decimales
  };

  // Estado separado para los inputs de texto (permite escribir libremente)
  const [brutoInput, setBrutoInput] = useState(factura?.bruto ? formatInputMonto(factura.bruto) : '');
  const [retencionesInput, setRetencionesInput] = useState(factura?.otras_retenciones ? formatInputMonto(factura.otras_retenciones) : '');
  const [bruto2Input, setBruto2Input] = useState(factura?.bruto2 ? formatInputMonto(factura.bruto2) : '');

  const handleBrutoChange = (valor) => {
    setBrutoInput(valor);
    const brutoNum = parseFloat(parseInputMonto(valor)) || 0;
    const neto = calcularNeto(brutoNum, form.iva_porcentaje, form.otras_retenciones, form.bruto2, form.iva_porcentaje2);
    setForm({ ...form, bruto: brutoNum, monto: neto });
  };

  const handleIvaChange = (ivaPct) => {
    const neto = calcularNeto(form.bruto, ivaPct, form.otras_retenciones, form.bruto2, form.iva_porcentaje2);
    setForm({ ...form, iva_porcentaje: ivaPct, monto: neto });
  };

  const handleRetencionesChange = (valor) => {
    setRetencionesInput(valor);
    const ret = parseFloat(parseInputMonto(valor)) || 0;
    const neto = calcularNeto(form.bruto, form.iva_porcentaje, ret, form.bruto2, form.iva_porcentaje2);
    setForm({ ...form, otras_retenciones: ret, monto: neto });
  };

  const handleBruto2Change = (valor) => {
    setBruto2Input(valor);
    const bruto2Num = parseFloat(parseInputMonto(valor)) || 0;
    const neto = calcularNeto(form.bruto, form.iva_porcentaje, form.otras_retenciones, bruto2Num, form.iva_porcentaje2);
    setForm({ ...form, bruto2: bruto2Num, monto: neto });
  };

  const handleIva2Change = (ivaPct2) => {
    const neto = calcularNeto(form.bruto, form.iva_porcentaje, form.otras_retenciones, form.bruto2, ivaPct2);
    setForm({ ...form, iva_porcentaje2: ivaPct2, monto: neto });
  };

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
    const ivaPct = proveedor?.situacion_iva ?? 21;
    const vencimiento = calcularVencimiento(form.fecha, dias);
    const neto = calcularNeto(form.bruto, ivaPct, form.otras_retenciones, form.bruto2, form.iva_porcentaje2);
    setForm({
      ...form,
      proveedor_id: parseInt(proveedorId),
      dias_vencimiento: dias,
      iva_porcentaje: ivaPct,
      monto: neto,
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

    const nuevoMonto = parseFloat(form.monto) || 0;
    const montoOriginal = parseFloat(factura?.monto) || 0;

    // Si es edición y el monto cambió, pedir motivo
    let motivoModificacion = null;
    if (factura && nuevoMonto !== montoOriginal) {
      motivoModificacion = prompt(`El monto cambió de $${montoOriginal.toLocaleString('es-AR')} a $${nuevoMonto.toLocaleString('es-AR')}.\n\nIngresá el motivo de la modificación:`);
      if (!motivoModificacion || !motivoModificacion.trim()) {
        if (motivoModificacion !== null) {
          alert('Debés ingresar un motivo para modificar el monto');
        }
        return;
      }
    }

    setSaving(true);
    // Quitar dias_vencimiento y estado del form antes de guardar
    // El estado se calcula automáticamente según los pagos
    const { dias_vencimiento, estado, ...dataToSave } = form;
    // Si es nueva factura, siempre pendiente
    if (!factura) {
      dataToSave.estado = 'pendiente';
    }
    const result = await onSave({
      ...dataToSave,
      bruto: parseFloat(form.bruto) || 0,
      iva_porcentaje: parseFloat(form.iva_porcentaje) || 0,
      otras_retenciones: parseFloat(form.otras_retenciones) || 0,
      bruto2: mostrarIva2 ? (parseFloat(form.bruto2) || 0) : 0,
      iva_porcentaje2: mostrarIva2 ? (parseFloat(form.iva_porcentaje2) || 10.5) : 10.5,
      monto: nuevoMonto
    }, factura ? { montoAnterior: montoOriginal, motivo: motivoModificacion } : null);
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar. Verificá los permisos de la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-4 w-full max-w-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">{factura ? 'Editar Factura' : 'Nueva Factura'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Proveedor *</label>
              <select required value={form.proveedor_id} onChange={e => handleProveedorChange(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                <option value="">Seleccionar</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Número Factura *</label>
              <input type="text" required value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className={`w-full px-2 py-1.5 rounded-lg border bg-white focus:outline-none text-sm ${facturaExistente() ? 'border-red-400' : 'border-slate-200 focus:border-blue-500/50'}`} placeholder="A-0001-00000001" />
            </div>
          </div>
          {facturaExistente() && <p className="text-xs text-red-500">Ya existe esta factura para este proveedor</p>}

          {/* Bruto + IVA + Retenciones = Neto */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Sub Total *</label>
              <input type="text" required value={brutoInput} onChange={e => handleBrutoChange(e.target.value)} onBlur={e => setBrutoInput(formatInputMonto(form.bruto))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm text-right" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">IVA</label>
              <select value={form.iva_porcentaje} onChange={e => handleIvaChange(parseFloat(e.target.value))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                <option value={0}>0%</option>
                <option value={10.5}>10.5%</option>
                <option value={21}>21%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Retenciones</label>
              <input type="text" value={retencionesInput} onChange={e => handleRetencionesChange(e.target.value)} onBlur={e => setRetencionesInput(formatInputMonto(form.otras_retenciones))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm text-right" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Total</label>
              <div className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-right font-semibold text-emerald-600">
                {formatInputMonto(form.monto) || '0'}
              </div>
            </div>
          </div>

          {/* Botón para agregar segundo IVA */}
          {!mostrarIva2 && (
            <button
              type="button"
              onClick={() => setMostrarIva2(true)}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Agregar otro IVA
            </button>
          )}

          {/* Segunda fila de IVA (opcional) */}
          {mostrarIva2 && (
            <div className="grid grid-cols-4 gap-2 bg-blue-50 p-2 rounded-lg">
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Sub Total 2</label>
                <input type="text" value={bruto2Input} onChange={e => handleBruto2Change(e.target.value)} onBlur={e => setBruto2Input(formatInputMonto(form.bruto2))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm text-right" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">IVA 2</label>
                <select value={form.iva_porcentaje2} onChange={e => handleIva2Change(parseFloat(e.target.value))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                  <option value={0}>0%</option>
                  <option value={10.5}>10.5%</option>
                  <option value={21}>21%</option>
                </select>
              </div>
              <div></div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarIva2(false);
                    setBruto2Input('');
                    const neto = calcularNeto(form.bruto, form.iva_porcentaje, form.otras_retenciones, 0, 10.5);
                    setForm({ ...form, bruto2: 0, iva_porcentaje2: 10.5, monto: neto });
                  }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 pb-1.5"
                >
                  <X className="w-3 h-3" /> Quitar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Fecha Factura *</label>
              <input type="date" required value={form.fecha} onChange={e => handleFechaChange(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Días Venc.</label>
              <select value={form.dias_vencimiento ?? ''} onChange={e => handleDiasChange(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                {CONDICIONES_PAGO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Vencimiento</label>
              <input type="date" required value={form.vencimiento} onChange={e => setForm({...form, vencimiento: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-0.5">Observaciones</label>
            <input type="text" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" placeholder="Opcional" />
          </div>

          {error && <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{error}</div>}

          <div className="flex flex-wrap gap-2 pt-2">
            {factura && onDelete && (
              <button type="button" onClick={handleDelete} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all text-sm">Eliminar</button>
            )}
            {factura && onRegistrarPago && (
              <button type="button" onClick={() => onRegistrarPago(factura)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />Pagar
              </button>
            )}
            <div className="flex-1"></div>
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-1 text-sm">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

function ModalPago({ onClose, onSave, tipoDefault, proveedores = [], empleados = [], facturas = [], pagos = [], notasCredito = [], facturaPreseleccionada }) {
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
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(facturaPreseleccionada?.proveedor_id || null);
  const [tipoPago, setTipoPago] = useState(null); // 'total' o 'parcial'
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  // Pre-seleccionar factura si viene de ModalFactura
  useEffect(() => {
    if (facturaPreseleccionada) {
      // Calcular saldo de la factura preseleccionada
      const pagosFactura = pagos
        .filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado' && p.descripcion && p.descripcion.includes(facturaPreseleccionada.numero))
        .reduce((sum, p) => sum + p.monto, 0);
      const ncFactura = notasCredito
        .filter(nc => nc.factura_id === facturaPreseleccionada.id)
        .reduce((sum, nc) => sum + nc.monto, 0);
      const saldo = facturaPreseleccionada.monto - pagosFactura - ncFactura;

      setFacturaSeleccionada({ ...facturaPreseleccionada, pagado: pagosFactura, nc: ncFactura, saldo });

      // Setear el form con los datos del proveedor y factura
      setForm(prev => ({
        ...prev,
        referencia_id: String(facturaPreseleccionada.proveedor_id),
        factura_id: String(facturaPreseleccionada.id)
      }));
    }
  }, [facturaPreseleccionada, pagos, notasCredito]);

  const getTitulo = () => {
    if (tipoDefault === 'factura') return 'Registrar Pago a Proveedor';
    if (tipoDefault === 'sueldo') return 'Registrar Pago a Empleado';
    return 'Registrar Pago';
  };

  // Calcular saldo de cada factura (monto - pagos confirmados - NC)
  const facturasDelProveedor = proveedorSeleccionado
    ? facturas
        .filter(f => f.proveedor_id === proveedorSeleccionado && f.estado !== 'pagada')
        .map(f => {
          // Calcular pagos CONFIRMADOS de esta factura
          const pagosFactura = pagos
            .filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado' && p.descripcion && p.descripcion.includes(f.numero))
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
    // Obtener nombre del proveedor (de facturaPreseleccionada o buscando por ID)
    const nombreProveedor = facturaPreseleccionada?.proveedor || proveedores.find(p => p.id === proveedorSeleccionado)?.nombre || '';
    if (tipo === 'total' && facturaSeleccionada) {
      setForm({
        ...form,
        descripcion: `Pago Saldo ${nombreProveedor} - Factura ${facturaSeleccionada.numero}`,
        monto: facturaSeleccionada.saldo || facturaSeleccionada.monto
      });
    } else if (tipo === 'parcial') {
      setForm({
        ...form,
        descripcion: `Pago Parcial ${nombreProveedor} - Factura ${facturaSeleccionada?.numero || ''}`,
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

    // El estado de la factura se actualiza automáticamente cuando se confirma la orden de pago

    const result = await onSave({ ...form, monto: parseFloat(form.monto) });
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || 'Error al guardar el pago. Verificá los permisos de la tabla "pagos" en Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">{getTitulo()}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {tipoDefault === 'factura' && (
            <>
              {/* Si viene con factura preseleccionada, mostrar info directamente */}
              {facturaPreseleccionada ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">Factura seleccionada</p>
                  <p className="font-semibold text-sm">{facturaPreseleccionada.proveedor}</p>
                  <p className="text-xs text-slate-600">{facturaPreseleccionada.numero} {facturaPreseleccionada.concepto && `- ${facturaPreseleccionada.concepto}`}</p>
                  {facturaSeleccionada && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Total factura:</span>
                        <span className="mono">{formatCurrency(facturaSeleccionada.monto)}</span>
                      </div>
                      {facturaSeleccionada.pagado > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Ya pagado:</span>
                          <span className="mono text-emerald-600">-{formatCurrency(facturaSeleccionada.pagado)}</span>
                        </div>
                      )}
                      {facturaSeleccionada.nc > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Nota de crédito:</span>
                          <span className="mono text-emerald-600">-{formatCurrency(facturaSeleccionada.nc)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold mt-1 pt-1 border-t border-blue-200">
                        <span className="text-amber-700">Saldo pendiente:</span>
                        <span className="mono text-amber-700">{formatCurrency(facturaSeleccionada.saldo)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Proveedor *</label>
                    <select required value={form.referencia_id} onChange={e => handleProveedorChange(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>

                  {proveedorSeleccionado && facturasDelProveedor.length > 0 && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Facturas Pendientes</label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-1.5">
                        {facturasDelProveedor.map(f => (
                          <label key={f.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${form.factura_id === String(f.id) ? 'bg-blue-50 border border-blue-300' : 'bg-slate-50 hover:bg-slate-100'}`}>
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="factura"
                                value={f.id}
                                checked={form.factura_id === String(f.id)}
                                onChange={e => handleFacturaSelect(e.target.value)}
                                className="w-3.5 h-3.5 text-blue-500"
                              />
                              <div>
                                <p className="font-medium text-xs">{f.numero}</p>
                                <p className="text-xs text-slate-500">{f.concepto || 'Sin concepto'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-xs mono text-amber-600">Saldo: {formatCurrency(f.saldo)}</p>
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

                  {proveedorSeleccionado && facturasDelProveedor.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No hay facturas pendientes para este proveedor</p>
                  )}
                </>
              )}

              {/* Selección de tipo de pago: Total o Parcial */}
              {facturaSeleccionada && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tipo de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTipoPagoChange('total')}
                      className={`p-2 rounded-lg border-2 transition-all text-center ${
                        tipoPago === 'total'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm">Pagar Saldo</p>
                      <p className="text-xs mono">{formatCurrency(facturaSeleccionada.saldo || facturaSeleccionada.monto)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTipoPagoChange('parcial')}
                      className={`p-2 rounded-lg border-2 transition-all text-center ${
                        tipoPago === 'parcial'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm">Pago Parcial</p>
                      <p className="text-xs text-slate-500">Ingresar monto</p>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {tipoDefault === 'sueldo' && (
            <>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Empleado *</label>
                <select required value={form.referencia_id} onChange={e => handleEmpleadoChange(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                  <option value="">Seleccionar empleado</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} - {e.puesto || 'Sin puesto'}</option>)}
                </select>
              </div>

              {form.referencia_id && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Concepto *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONCEPTOS_EMPLEADO.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleConceptoEmpleadoChange(c.value)}
                        className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
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
                <label className="block text-xs text-slate-500 mb-0.5">Descripción *</label>
                <input type="text" required value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-0.5">Monto * {tipoPago === 'parcial' && facturaSeleccionada && <span className="text-amber-600">(Máx: {formatCurrency(facturaSeleccionada.saldo || facturaSeleccionada.monto)})</span>}</label>
                  <input
                    type="text"
                    required
                    value={formatInputMonto(form.monto)}
                    onChange={e => setForm({...form, monto: parseInputMonto(e.target.value)})}
                    readOnly={tipoPago === 'total'}
                    className={`w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-right text-sm ${tipoPago === 'total' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-0.5">Fecha *</label>
                  <input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Método</label>
                <select value={form.metodo} onChange={e => setForm({...form, metodo: e.target.value})} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="E-Cheq">E-Cheq</option>
                </select>
              </div>
            </>
          )}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm">Cancelar</button>
            <button
              type="submit"
              disabled={saving || (tipoDefault === 'factura' && !tipoPago) || (tipoDefault === 'sueldo' && !form.concepto_empleado) || !form.monto}
              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
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

    const nuevoMonto = parseFloat(form.monto);
    const montoOriginal = parseFloat(pago.monto);

    // Si el monto cambió, pedir motivo
    let motivoModificacion = null;
    if (nuevoMonto !== montoOriginal) {
      motivoModificacion = prompt(`El monto cambió de $${montoOriginal.toLocaleString('es-AR')} a $${nuevoMonto.toLocaleString('es-AR')}.\n\nIngresá el motivo de la modificación:`);
      if (!motivoModificacion || !motivoModificacion.trim()) {
        if (motivoModificacion !== null) {
          alert('Debés ingresar un motivo para modificar el monto');
        }
        return;
      }
    }

    setSaving(true);
    const result = await onSave(pago.id, { ...form, monto: nuevoMonto }, { montoAnterior: montoOriginal, motivo: motivoModificacion });
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
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="E-Cheq">E-Cheq</option>
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

// Pantalla de Login
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'admin1234') {
      localStorage.setItem('tero_auth', 'true');
      onLogin();
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Tero Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Ingresá tu contraseña</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-center text-lg"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  // Detectar modo demo
  const [demoMode] = useState(() => isDemoMode());

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // En modo demo, siempre autenticado
    if (isDemoMode()) return true;
    return localStorage.getItem('tero_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [proveedores, setProveedores] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [notasCredito, setNotasCredito] = useState([]);
  const [anulaciones, setAnulaciones] = useState([]);
  const [modificaciones, setModificaciones] = useState([]);
  const [ordenesPago, setOrdenesPago] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para Ingresos
  const [clientes, setClientes] = useState([]);
  const [facturasVenta, setFacturasVenta] = useState([]);
  const [cobros, setCobros] = useState([]);
  const [notasCreditoVenta, setNotasCreditoVenta] = useState([]);
  const [subTabIngresos, setSubTabIngresos] = useState('facturas'); // 'facturas' | 'cobros' | 'clientes' | 'nc'
  const [cobrosExpandidos, setCobrosExpandidos] = useState([]); // IDs de facturas expandidas en cobros

  // Modales
  const [showModal, setShowModal] = useState(null); // 'proveedor', 'factura', 'empleado', 'pago'
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalClienteId, setModalClienteId] = useState(null); // Cliente seleccionado en modal
  const [modalFacturaId, setModalFacturaId] = useState(null); // Factura seleccionada en modal NC
  const [modalFacturaCobroId, setModalFacturaCobroId] = useState(null); // Factura seleccionada en modal Cobro
  const [modalSubtotal, setModalSubtotal] = useState('');
  const [modalIva, setModalIva] = useState('21'); // 21, 10.5, 0 (exento)

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
  const [filtroAnioFactura, setFiltroAnioFactura] = useState('todos');

  // Filtros Informes
  const [informeActivo, setInformeActivo] = useState('saldo-proveedor');
  const [filtroMesInforme, setFiltroMesInforme] = useState('todos');
  const [filtroAnioInforme, setFiltroAnioInforme] = useState(new Date().getFullYear().toString());

  // Orden de pago seleccionada para ver detalle
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // Filtro compras del mes en dashboard
  const [filtroMesComprasDash, setFiltroMesComprasDash] = useState(new Date().getMonth().toString());
  const [filtroAnioComprasDash, setFiltroAnioComprasDash] = useState(new Date().getFullYear().toString());

  // Filtro sueldos del mes en dashboard
  const [filtroMesSueldosDash, setFiltroMesSueldosDash] = useState(new Date().getMonth().toString());
  const [filtroAnioSueldosDash, setFiltroAnioSueldosDash] = useState(new Date().getFullYear().toString());

  // Filtro eventos en dashboard
  const [filtroMesEventosDash, setFiltroMesEventosDash] = useState(new Date().getMonth().toString());
  const [filtroAnioEventosDash, setFiltroAnioEventosDash] = useState(new Date().getFullYear().toString());

  // Filtro categoría para gráfico de gastos
  const [filtroCategoriaGrafico, setFiltroCategoriaGrafico] = useState('todos');

  // Filtros para Facturas de Venta (Ingresos)
  const [filtroClienteFacturaVenta, setFiltroClienteFacturaVenta] = useState('todos');
  const [filtroMesFacturaVenta, setFiltroMesFacturaVenta] = useState('todos');

  // Filtros para Pago Proveedores
  const [filtroProveedorPagoProv, setFiltroProveedorPagoProv] = useState('todos');
  const [filtroMesPagoProv, setFiltroMesPagoProv] = useState('todos');
  const [filtroAnioPagoProv, setFiltroAnioPagoProv] = useState(new Date().getFullYear().toString());
  const [filtroFechaPagoProv, setFiltroFechaPagoProv] = useState(''); // fecha específica
  const [subTabPagoProv, setSubTabPagoProv] = useState('pagos'); // 'pagos' | 'conciliacion'

  // Autenticación para conciliación
  const [conciliacionAuth, setConciliacionAuth] = useState(false);
  const [conciliacionAuthTime, setConciliacionAuthTime] = useState(null);
  const [claveConciliacion, setClaveConciliacion] = useState('');
  const [errorClaveConciliacion, setErrorClaveConciliacion] = useState(false);

  // Verificar si la sesión de conciliación expiró (5 minutos)
  const isConciliacionAuthValid = () => {
    if (!conciliacionAuth || !conciliacionAuthTime) return false;
    const ahora = Date.now();
    const cincominutos = 5 * 60 * 1000;
    return (ahora - conciliacionAuthTime) < cincominutos;
  };

  // Resetear auth cuando se sale de la solapa conciliación
  const handleSubTabChange = (tab) => {
    if (tab !== 'conciliacion') {
      setConciliacionAuth(false);
      setConciliacionAuthTime(null);
      setClaveConciliacion('');
    }
    setSubTabPagoProv(tab);
  };

  // Validar clave de conciliación
  const validarClaveConciliacion = (e) => {
    e.preventDefault();
    if (claveConciliacion === '1970') {
      setConciliacionAuth(true);
      setConciliacionAuthTime(Date.now());
      setErrorClaveConciliacion(false);
    } else {
      setErrorClaveConciliacion(true);
    }
  };

  // Cargar datos desde Supabase
  const fetchProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('nombre');
    if (!error) {
      setProveedores(data || []);
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

  const fetchModificaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('modificaciones')
        .select('*')
        .order('fecha_modificacion', { ascending: false });
      if (!error && data) {
        setModificaciones(data);
      } else {
        setModificaciones([]);
      }
    } catch (e) {
      setModificaciones([]);
    }
  };

  const fetchOrdenesPago = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes_pago')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setOrdenesPago(data);
      } else {
        setOrdenesPago([]);
      }
    } catch (e) {
      setOrdenesPago([]);
    }
  };

  // Fetch para Ingresos
  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre');
      if (!error) setClientes(data || []);
    } catch (e) {
      setClientes([]);
    }
  };

  const fetchFacturasVenta = async () => {
    try {
      const { data, error } = await supabase
        .from('facturas_venta')
        .select('*, clientes(nombre)')
        .order('vencimiento', { ascending: true });
      if (!error) {
        const facturasConCliente = (data || []).map(f => ({
          ...f,
          cliente: f.clientes?.nombre || 'Sin cliente'
        }));
        setFacturasVenta(facturasConCliente);
      }
    } catch (e) {
      setFacturasVenta([]);
    }
  };

  const fetchCobros = async () => {
    try {
      const { data, error } = await supabase.from('cobros').select('*').order('fecha', { ascending: false });
      if (!error) setCobros(data || []);
    } catch (e) {
      setCobros([]);
    }
  };

  const fetchNotasCreditoVenta = async () => {
    try {
      const { data, error } = await supabase.from('notas_credito_venta').select('*').order('fecha', { ascending: false });
      if (!error) setNotasCreditoVenta(data || []);
    } catch (e) {
      setNotasCreditoVenta([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);

    // Si está en modo demo, cargar datos de ejemplo
    if (demoMode) {
      setProveedores(DEMO_PROVEEDORES);
      setFacturas(DEMO_FACTURAS);
      setEmpleados(DEMO_EMPLEADOS);
      setPagos(DEMO_PAGOS);
      setNotasCredito(DEMO_NOTAS_CREDITO);
      setAnulaciones(DEMO_ANULACIONES);
      setModificaciones(DEMO_MODIFICACIONES);
      setOrdenesPago(DEMO_ORDENES_PAGO);
      setClientes(DEMO_CLIENTES);
      setFacturasVenta(DEMO_FACTURAS_VENTA);
      setCobros(DEMO_COBROS);
      setLoading(false);
      return;
    }

    await Promise.all([
      fetchProveedores(), fetchFacturas(), fetchEmpleados(), fetchPagos(),
      fetchNotasCredito(), fetchAnulaciones(), fetchModificaciones(), fetchOrdenesPago(),
      fetchClientes(), fetchFacturasVenta(), fetchCobros(), fetchNotasCreditoVenta()
    ]);
    setLoading(false);
  };

  // Corregir estados de facturas que figuran como pagadas pero tienen saldo
  const corregirEstadosFacturas = async () => {
    // Obtener datos frescos
    const { data: facturasDB } = await supabase.from('facturas').select('*');
    const { data: pagosDB } = await supabase.from('pagos').select('*');
    const { data: notasCreditoDB } = await supabase.from('notas_credito').select('*');

    if (!facturasDB) return { corregidas: 0 };

    // Calcular pagos por factura
    const pagosMap = {};
    (pagosDB || []).filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado').forEach(p => {
      facturasDB.forEach(f => {
        if (p.descripcion && p.descripcion.includes(f.numero)) {
          pagosMap[f.id] = (pagosMap[f.id] || 0) + p.monto;
        }
      });
    });

    // Calcular NC por factura
    const ncMap = {};
    (notasCreditoDB || []).filter(nc => nc.factura_id).forEach(nc => {
      ncMap[nc.factura_id] = (ncMap[nc.factura_id] || 0) + nc.monto;
    });

    // Buscar facturas mal marcadas
    const facturasACorregir = facturasDB.filter(f => {
      if (f.estado !== 'pagada') return false;
      const pagado = pagosMap[f.id] || 0;
      const nc = ncMap[f.id] || 0;
      const saldo = f.monto - pagado - nc;
      return saldo > 0; // Tiene saldo pero figura como pagada
    });

    // Corregir cada una
    let corregidas = 0;
    for (const f of facturasACorregir) {
      const { error } = await supabase.from('facturas').update({ estado: 'pendiente' }).eq('id', f.id);
      if (!error) corregidas++;
    }

    // Refrescar datos
    await fetchFacturas();

    return { corregidas, total: facturasACorregir.length };
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-logout por inactividad (10 minutos)
  useEffect(() => {
    // No aplicar en modo demo
    if (demoMode) return;

    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Cerrar sesión por inactividad
        localStorage.removeItem('tero_auth');
        setIsAuthenticated(false);
      }, INACTIVITY_TIMEOUT);
    };

    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Agregar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Iniciar el timer
    resetTimer();

    // Limpiar al desmontar
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [demoMode]);

  // CRUD Proveedores
  const createProveedor = async (proveedor) => {
    // Generar código automático PROV-0001, PROV-0002, etc.
    const codigosExistentes = proveedores
      .map(p => p.codigo)
      .filter(c => c && c.startsWith('PROV-'))
      .map(c => parseInt(c.replace('PROV-', '')) || 0);
    const maxCodigo = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) : 0;
    const nuevoCodigo = `PROV-${String(maxCodigo + 1).padStart(4, '0')}`;

    const { data, error } = await supabase.from('proveedores').insert([{ ...proveedor, codigo: nuevoCodigo }]).select();
    if (error) {
      console.error('Error:', error);
    } else {
      await fetchProveedores();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateProveedor = async (id, proveedor) => {
    console.log('Actualizando proveedor:', id, proveedor);
    const { data, error } = await supabase.from('proveedores').update(proveedor).eq('id', id).select();
    console.log('Respuesta Supabase:', { data, error });
    if (error) {
      console.error('Error completo:', JSON.stringify(error, null, 2));
    } else {
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

  const updateFactura = async (id, facturaData, modificacion = null) => {
    // Si hay modificación de monto, guardar en la tabla modificaciones
    if (modificacion?.motivo) {
      const facturaOriginal = facturas.find(f => f.id === id);
      await supabase.from('modificaciones').insert([{
        tipo: 'factura',
        referencia_id: id,
        datos_originales: facturaOriginal,
        campo_modificado: 'monto',
        valor_anterior: modificacion.montoAnterior,
        valor_nuevo: facturaData.monto,
        motivo: modificacion.motivo,
        fecha_modificacion: new Date().toISOString()
      }]);
      await fetchModificaciones();
    }

    const { error } = await supabase.from('facturas').update(facturaData).eq('id', id);
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

    // Verificar si la factura tiene pagos asociados
    const pagosFactura = pagos.filter(p => p.tipo === 'factura' && p.descripcion && p.descripcion.includes(factura.numero));
    if (pagosFactura.length > 0) {
      alert('No se puede anular esta factura porque tiene pagos registrados. Primero debe anular los pagos asociados.');
      return;
    }

    // Verificar si la factura tiene notas de crédito asociadas
    const ncFactura = notasCredito.filter(nc => nc.factura_id === id);
    if (ncFactura.length > 0) {
      alert('No se puede anular esta factura porque tiene notas de crédito asociadas. Primero debe anular las notas de crédito.');
      return;
    }

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

  // CRUD Clientes
  const createCliente = async (cliente) => {
    // Generar código automático CLI-0001, CLI-0002, etc.
    const codigosExistentes = clientes
      .map(c => c.codigo)
      .filter(c => c && c.startsWith('CLI-'))
      .map(c => parseInt(c.replace('CLI-', '')) || 0);
    const maxCodigo = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) : 0;
    const nuevoCodigo = `CLI-${String(maxCodigo + 1).padStart(4, '0')}`;

    const { error } = await supabase.from('clientes').insert([{ ...cliente, codigo: nuevoCodigo }]);
    if (!error) {
      await fetchClientes();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateCliente = async (id, cliente) => {
    const { error } = await supabase.from('clientes').update(cliente).eq('id', id);
    if (!error) {
      await fetchClientes();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) await fetchClientes();
  };

  // CRUD Facturas de Venta
  const createFacturaVenta = async (factura) => {
    const { error } = await supabase.from('facturas_venta').insert([factura]);
    if (!error) {
      await fetchFacturasVenta();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateFacturaVenta = async (id, factura) => {
    const { error } = await supabase.from('facturas_venta').update(factura).eq('id', id);
    if (!error) {
      await fetchFacturasVenta();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteFacturaVenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;
    const { error } = await supabase.from('facturas_venta').delete().eq('id', id);
    if (!error) await fetchFacturasVenta();
  };

  // CRUD Cobros
  const createCobro = async (cobro) => {
    const { error } = await supabase.from('cobros').insert([cobro]);
    if (!error) {
      await fetchCobros();
      // Actualizar estado de factura si corresponde
      if (cobro.factura_venta_id) {
        await actualizarEstadoFacturaVenta(cobro.factura_venta_id);
      }
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateCobro = async (id, cobro) => {
    const { error } = await supabase.from('cobros').update(cobro).eq('id', id);
    if (!error) {
      await fetchCobros();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteCobro = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cobro?')) return;
    const { error } = await supabase.from('cobros').delete().eq('id', id);
    if (!error) await fetchCobros();
  };

  // Sincronizar cobros antiguos con facturas (por descripción o cliente)
  const sincronizarCobrosConFacturas = async () => {
    const cobrosSinFactura = cobros.filter(c => !c.factura_venta_id || c.factura_venta_id === 0 || c.factura_venta_id === '0' || c.factura_venta_id === '');
    if (cobrosSinFactura.length === 0) {
      alert('Todos los cobros ya están asociados a facturas');
      return;
    }

    let actualizados = 0;
    for (const cobro of cobrosSinFactura) {
      // Buscar número de factura en la descripción (ej: "Fact. 0001-00000123")
      const match = cobro.descripcion?.match(/Fact\.\s*([A-Z0-9\-]+)/i);
      if (match) {
        const numeroFactura = match[1];
        const factura = facturasVenta.find(f => f.numero === numeroFactura);
        if (factura) {
          const { error } = await supabase
            .from('cobros')
            .update({ factura_venta_id: factura.id })
            .eq('id', cobro.id);
          if (!error) actualizados++;
        }
      }
    }

    await fetchCobros();
    alert(`Se actualizaron ${actualizados} de ${cobrosSinFactura.length} cobros`);
  };

  // Corregir facturas con monto = 0 usando el monto de cobros
  const corregirFacturasSinMonto = async () => {
    const facturasSinMonto = facturasVenta.filter(f => !f.monto || parseFloat(f.monto) === 0);
    if (facturasSinMonto.length === 0) {
      alert('No hay facturas con monto = 0 para corregir');
      return;
    }

    let corregidas = 0;
    for (const factura of facturasSinMonto) {
      // Buscar cobros de esta factura
      const cobrosFactura = cobros.filter(c => parseInt(c.factura_venta_id) === parseInt(factura.id));
      const totalCobros = cobrosFactura.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

      if (totalCobros > 0) {
        // Actualizar el monto de la factura con el total de cobros
        const { error } = await supabase
          .from('facturas_venta')
          .update({ monto: totalCobros, subtotal: totalCobros })
          .eq('id', factura.id);
        if (!error) corregidas++;
      }
    }

    await fetchFacturasVenta();
    alert(`Se corrigieron ${corregidas} de ${facturasSinMonto.length} facturas`);
  };

  // CRUD Notas de Crédito de Venta
  const createNotaCreditoVenta = async (nc) => {
    const { error } = await supabase.from('notas_credito_venta').insert([nc]);
    if (!error) {
      await fetchNotasCreditoVenta();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateNotaCreditoVenta = async (id, nc) => {
    const { error } = await supabase.from('notas_credito_venta').update(nc).eq('id', id);
    if (!error) {
      await fetchNotasCreditoVenta();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteNotaCreditoVenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta nota de crédito?')) return;
    const { error } = await supabase.from('notas_credito_venta').delete().eq('id', id);
    if (!error) await fetchNotasCreditoVenta();
  };

  // Actualizar estado de factura de venta según cobros
  const actualizarEstadoFacturaVenta = async (facturaId) => {
    // Obtener cobros directamente de la base para evitar problemas de timing
    const { data: cobrosDB } = await supabase.from('cobros').select('*').eq('factura_venta_id', facturaId);
    const totalCobros = (cobrosDB || []).reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

    // Obtener NC de esta factura
    const { data: ncDB } = await supabase.from('notas_credito_venta').select('*').eq('factura_venta_id', facturaId);
    const totalNC = (ncDB || []).reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);

    // Obtener la factura
    const { data: facturaDB } = await supabase.from('facturas_venta').select('*').eq('id', facturaId).single();

    if (facturaDB) {
      const montoFactura = parseFloat(facturaDB.monto) || 0;
      const saldoPendiente = montoFactura - totalNC - totalCobros;
      const nuevoEstado = saldoPendiente <= 0 ? 'cobrada' : 'pendiente';
      await supabase.from('facturas_venta').update({ estado: nuevoEstado }).eq('id', facturaId);
      await fetchFacturasVenta();
    }
  };

  // CRUD Pagos
  const createPago = async (pago) => {
    // Quitar campos que no existen en la tabla
    const { factura_id, concepto_empleado, ...pagoData } = pago;
    console.log('Creando pago:', pagoData);

    // Si es pago a proveedor, agregarlo a una orden pendiente
    if (pagoData.tipo === 'factura') {
      // Buscar orden pendiente existente o crear una nueva
      let ordenPendiente = ordenesPago.find(o => o.estado === 'pendiente');
      if (!ordenPendiente) {
        ordenPendiente = await createOrdenPago();
      }
      if (ordenPendiente) {
        pagoData.orden_pago_id = ordenPendiente.id;
        pagoData.estado_pago = 'pendiente';
      }
    } else {
      // Pagos de empleados y otros se confirman directamente
      pagoData.estado_pago = 'confirmado';
    }

    const { data, error } = await supabase.from('pagos').insert([pagoData]).select();
    console.log('Respuesta Supabase pagos:', { data, error });
    if (error) {
      console.error('Error al crear pago:', JSON.stringify(error, null, 2));
    } else {
      await fetchPagos();
      await fetchOrdenesPago();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updatePago = async (id, pagoData, modificacion = null) => {
    // Si hay modificación de monto, guardar en la tabla modificaciones
    if (modificacion?.motivo) {
      const pagoOriginal = pagos.find(p => p.id === id);
      await supabase.from('modificaciones').insert([{
        tipo: 'pago',
        referencia_id: id,
        datos_originales: pagoOriginal,
        campo_modificado: 'monto',
        valor_anterior: modificacion.montoAnterior,
        valor_nuevo: pagoData.monto,
        motivo: modificacion.motivo,
        fecha_modificacion: new Date().toISOString()
      }]);
      await fetchModificaciones();
    }

    const { error } = await supabase.from('pagos').update(pagoData).eq('id', id);
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
      // Actualizar estados de facturas automáticamente
      await actualizarEstadosFacturas();
      setShowModal(null);
      setSelectedItem(null);
    }
  };

  // CRUD Ordenes de Pago
  const createOrdenPago = async () => {
    const { data, error } = await supabase
      .from('ordenes_pago')
      .insert([{ fecha: new Date().toISOString().split('T')[0], estado: 'pendiente' }])
      .select();
    if (!error && data) {
      await fetchOrdenesPago();
      return data[0];
    }
    return null;
  };

  const confirmarOrdenPago = async (ordenId) => {
    // Marcar todos los pagos de la orden como confirmados
    const { error: errorPagos } = await supabase
      .from('pagos')
      .update({ estado_pago: 'confirmado' })
      .eq('orden_pago_id', ordenId);

    if (errorPagos) {
      alert('Error al confirmar los pagos');
      return;
    }

    // Marcar la orden como confirmada
    const { error } = await supabase
      .from('ordenes_pago')
      .update({ estado: 'confirmada' })
      .eq('id', ordenId);

    if (!error) {
      await fetchOrdenesPago();
      await fetchPagos();
      // Actualizar estados de facturas automáticamente
      await actualizarEstadosFacturas();
    }
  };

  // Actualizar estados de facturas según sus saldos
  const actualizarEstadosFacturas = async () => {
    const { data: facturasDB } = await supabase.from('facturas').select('*');
    const { data: pagosDB } = await supabase.from('pagos').select('*');
    const { data: notasCreditoDB } = await supabase.from('notas_credito').select('*');

    if (!facturasDB) return;

    // Calcular pagos por factura
    const pagosMap = {};
    (pagosDB || []).filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado').forEach(p => {
      facturasDB.forEach(f => {
        if (p.descripcion && p.descripcion.includes(f.numero)) {
          pagosMap[f.id] = (pagosMap[f.id] || 0) + p.monto;
        }
      });
    });

    // Calcular NC por factura
    const ncMap = {};
    (notasCreditoDB || []).filter(nc => nc.factura_id).forEach(nc => {
      ncMap[nc.factura_id] = (ncMap[nc.factura_id] || 0) + nc.monto;
    });

    // Actualizar cada factura según su saldo
    for (const f of facturasDB) {
      const pagado = pagosMap[f.id] || 0;
      const nc = ncMap[f.id] || 0;
      const saldo = f.monto - pagado - nc;
      const nuevoEstado = saldo <= 0 ? 'pagada' : 'pendiente';

      if (f.estado !== nuevoEstado) {
        await supabase.from('facturas').update({ estado: nuevoEstado }).eq('id', f.id);
      }
    }

    await fetchFacturas();
  };

  const anularPagoDeOrden = async (pagoId) => {
    // Eliminar el pago pendiente de la orden (no va a anulaciones porque nunca se confirmó)
    const { error } = await supabase.from('pagos').delete().eq('id', pagoId);
    if (!error) {
      await fetchPagos();
    }
  };

  const anularOrdenPago = async (ordenId) => {
    // Eliminar todos los pagos pendientes de la orden
    const { error: errorPagos } = await supabase
      .from('pagos')
      .delete()
      .eq('orden_pago_id', ordenId)
      .eq('estado_pago', 'pendiente');

    if (errorPagos) {
      alert('Error al anular los pagos de la orden');
      return;
    }

    // Marcar la orden como anulada
    const { error } = await supabase
      .from('ordenes_pago')
      .update({ estado: 'anulada' })
      .eq('id', ordenId);

    if (!error) {
      await fetchOrdenesPago();
      await fetchPagos();
    }
  };

  // CRUD Notas de Crédito
  const createNotaCredito = async (nota) => {
    const { error } = await supabase.from('notas_credito').insert([nota]);
    if (!error) {
      await fetchNotasCredito();
      await actualizarEstadosFacturas();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateNotaCredito = async (id, nota) => {
    const { error } = await supabase.from('notas_credito').update(nota).eq('id', id);
    if (!error) {
      await fetchNotasCredito();
      await actualizarEstadosFacturas();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deleteNotaCredito = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta nota de crédito?')) return;
    const { error } = await supabase.from('notas_credito').delete().eq('id', id);
    if (!error) {
      await fetchNotasCredito();
      await actualizarEstadosFacturas();
    }
  };

  // Stats calculados
  const stats = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    // Calcular pagos confirmados por factura para stats
    const pagosConfirmadosPorFactura = {};
    pagos.filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado').forEach(p => {
      facturas.forEach(f => {
        if (p.descripcion && p.descripcion.includes(f.numero)) {
          pagosConfirmadosPorFactura[f.id] = (pagosConfirmadosPorFactura[f.id] || 0) + p.monto;
        }
      });
    });

    // Calcular NC por factura para stats (usando notasCredito)
    const ncPorFacturaStats = {};
    notasCredito.filter(nc => nc.factura_id).forEach(nc => {
      ncPorFacturaStats[nc.factura_id] = (ncPorFacturaStats[nc.factura_id] || 0) + nc.monto;
    });

    // Calcular saldo de cada factura
    const getSaldo = (f) => {
      const pagado = pagosConfirmadosPorFactura[f.id] || 0;
      const nc = ncPorFacturaStats[f.id] || 0;
      return Math.max(0, f.monto - pagado - nc);
    };

    // Facturas pendientes (no vencidas y con saldo > 0)
    const facturasPendientes = facturas.filter(f => {
      if (f.estado === 'pagada' || f.tipo === 'NC') return false;
      const saldo = getSaldo(f);
      if (saldo <= 0) return false;
      const venc = new Date(f.vencimiento + 'T12:00:00');
      return venc >= hoy;
    });

    // Facturas vencidas (fecha pasada, no pagadas y con saldo > 0)
    const facturasVencidas = facturas.filter(f => {
      if (f.estado === 'pagada' || f.tipo === 'NC') return false;
      const saldo = getSaldo(f);
      if (saldo <= 0) return false;
      const venc = new Date(f.vencimiento + 'T12:00:00');
      return venc < hoy;
    });

    const totalPendiente = facturasPendientes.reduce((sum, f) => sum + getSaldo(f), 0);
    const totalVencido = facturasVencidas.reduce((sum, f) => sum + getSaldo(f), 0);

    // Sueldos pagados este mes (solo confirmados)
    const pagosSueldosMes = pagos.filter(p => {
      if (p.tipo !== 'sueldo' || p.estado_pago !== 'confirmado') return false;
      const fechaPago = new Date(p.fecha);
      return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual;
    });
    const totalSueldosPagados = pagosSueldosMes.reduce((sum, p) => sum + p.monto, 0);

    // Solo contar pagos confirmados a proveedores
    const pagosProveedoresMes = pagos
      .filter(p => {
        if (p.estado_pago !== 'confirmado' || p.tipo !== 'factura') return false;
        const fechaPago = new Date(p.fecha);
        return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual;
      });
    const totalPagadoProveedoresMes = pagosProveedoresMes.reduce((sum, p) => sum + p.monto, 0);
    const cantidadPagosProveedoresMes = pagosProveedoresMes.length;

    // Total de sueldos fijos
    const totalSueldosFijos = empleados.reduce((sum, e) => sum + (e.sueldo || 0), 0);

    return {
      facturasPendientes: facturasPendientes.length,
      facturasVencidas: facturasVencidas.length,
      totalPendiente,
      totalVencido,
      totalSueldosPagados,
      totalSueldosFijos,
      totalPagadoProveedoresMes,
      cantidadPagosProveedoresMes,
      totalProveedores: proveedores.length,
      totalEmpleados: empleados.length
    };
  }, [facturas, empleados, pagos, proveedores, notasCredito]);

  // Calcular pagos por factura (pagos normales) - ANTES de usarlo en otros cálculos
  const pagosPorFactura = useMemo(() => {
    const pagosMap = {};
    pagos.filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado').forEach(p => {
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

  // Calcular pagos PENDIENTES por factura (para mostrar estado "aprobar")
  const pagosPendientesPorFactura = useMemo(() => {
    const pagosMap = {};
    pagos.filter(p => p.tipo === 'factura' && p.estado_pago === 'pendiente').forEach(p => {
      facturas.forEach(f => {
        if (p.descripcion && p.descripcion.includes(f.numero)) {
          pagosMap[f.id] = (pagosMap[f.id] || 0) + p.monto;
        }
      });
    });
    return pagosMap;
  }, [pagos, facturas]);

  // Helper para calcular saldo de una factura
  const getSaldoFactura = (f) => {
    const pagado = pagosPorFactura[f.id] || 0;
    const nc = ncPorFactura[f.id] || 0;
    return Math.max(0, f.monto - pagado - nc);
  };

  // Facturas próximas a vencer (7 días) con saldo > 0
  const facturasProximas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7dias = new Date();
    en7dias.setDate(hoy.getDate() + 7);

    return facturas
      .filter(f => (f.estado === 'pendiente' || f.estado === 'vencida') && f.tipo !== 'NC')
      .filter(f => {
        const saldo = getSaldoFactura(f);
        if (saldo <= 0) return false;
        const venc = new Date(f.vencimiento + 'T12:00:00');
        return venc >= hoy && venc <= en7dias;
      })
      .map(f => ({ ...f, saldo: getSaldoFactura(f) }))
      .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  }, [facturas, pagosPorFactura, ncPorFactura]);

  // Facturas vencidas para el dashboard (con saldo > 0)
  const facturasVencidasDash = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return facturas
      .filter(f => (f.estado === 'pendiente' || f.estado === 'vencida') && f.tipo !== 'NC')
      .filter(f => {
        const saldo = getSaldoFactura(f);
        if (saldo <= 0) return false;
        const venc = new Date(f.vencimiento + 'T12:00:00');
        return venc < hoy;
      })
      .map(f => ({ ...f, saldo: getSaldoFactura(f) }))
      .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  }, [facturas, pagosPorFactura, ncPorFactura]);

  // Compras del mes para el dashboard
  const comprasDelMes = useMemo(() => {
    return facturas.filter(f => {
      const fechaFactura = new Date(f.fecha + 'T12:00:00');
      const matchMes = filtroMesComprasDash === 'todos' || fechaFactura.getMonth() === parseInt(filtroMesComprasDash);
      const matchAnio = filtroAnioComprasDash === 'todos' || fechaFactura.getFullYear() === parseInt(filtroAnioComprasDash);
      return matchMes && matchAnio;
    });
  }, [facturas, filtroMesComprasDash, filtroAnioComprasDash]);

  // Datos para gráficos (filtrado por categoría de proveedor)
  const datosPorCategoria = useMemo(() => {
    const categorias = {};
    facturas
      .filter(f => {
        if (filtroCategoriaGrafico === 'todos') return true;
        const proveedor = proveedores.find(p => p.id === f.proveedor_id);
        return proveedor?.categoria === filtroCategoriaGrafico;
      })
      .forEach(f => {
        const prov = f.proveedor;
        categorias[prov] = (categorias[prov] || 0) + f.monto;
      });
    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [facturas, proveedores, filtroCategoriaGrafico]);

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899'];

  // Calcular pagos por empleado (filtrado por mes)
  const pagosPorEmpleado = useMemo(() => {
    const pagosMap = {};
    pagos
      .filter(p => p.tipo === 'sueldo' && p.estado_pago === 'confirmado')
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

  // Combinar pagos confirmados y NC aplicadas para mostrar en sección Pagos
  const pagosYNC = useMemo(() => {
    const pagosConfirmados = pagos.filter(p => p.estado_pago === 'confirmado');
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
    return [...pagosConfirmados, ...ncAplicadas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [pagos, notasCredito, facturas, proveedores]);

  // Facturas filtradas con saldo calculado (incluye pagos + NC)
  const facturasFiltradas = useMemo(() => {
    return facturas
      .map(f => {
        const pagado = pagosPorFactura[f.id] || 0;
        const pendiente = pagosPendientesPorFactura[f.id] || 0;
        const nc = ncPorFactura[f.id] || 0;
        const saldo = f.monto - pagado - nc;
        // Determinar estado visual
        let estadoDisplay = f.estado;
        if (pendiente > 0) {
          // Tiene pagos pendientes de aprobar
          estadoDisplay = 'aprobar';
        } else if (f.estado === 'pendiente' && (pagado > 0 || nc > 0) && saldo > 0) {
          estadoDisplay = 'parcial';
        }
        return {
          ...f,
          pagado,
          pendiente,
          nc,
          totalPagado: pagado + nc,
          saldo,
          estadoDisplay
        };
      })
      .filter(f => {
        const matchSearch = f.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           f.numero.toLowerCase().includes(searchTerm.toLowerCase());
        // Calcular si vence esta semana (próximos 7 días) y no está pagada
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const venc = new Date(f.vencimiento + 'T12:00:00');
        const diasHastaVenc = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
        const venceEstaSemana = diasHastaVenc >= 0 && diasHastaVenc <= 7 && f.estado !== 'pagada';
        // Para filtro de estado
        const estaVencida = venc < hoy && f.estado !== 'pagada' && f.saldo > 0;
        let matchEstado = false;
        if (filtroEstado === 'todos') {
          matchEstado = true;
        } else if (filtroEstado === 'aprobar') {
          matchEstado = f.estadoDisplay === 'aprobar';
        } else if (filtroEstado === 'parcial') {
          matchEstado = f.estadoDisplay === 'parcial';
        } else if (filtroEstado === 'vence_semana') {
          matchEstado = venceEstaSemana;
        } else if (filtroEstado === 'vencida') {
          matchEstado = estaVencida;
        } else if (filtroEstado === 'pendiente') {
          // Pendientes que NO están vencidas
          matchEstado = f.estado === 'pendiente' && !estaVencida && f.saldo > 0;
        } else {
          matchEstado = f.estado === filtroEstado;
        }
        const matchProveedor = filtroProveedorFactura === 'todos' || f.proveedor_id === parseInt(filtroProveedorFactura);
        // Usar vencimiento para filtrar por mes/año (no fecha de confección)
        const fechaVencimiento = new Date(f.vencimiento + 'T12:00:00');
        const matchAnio = filtroAnioFactura === 'todos' || fechaVencimiento.getFullYear() === parseInt(filtroAnioFactura);

        // Filtro por mes con opciones especiales
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        let matchMes = true;
        if (filtroMesFactura === 'hoy') {
          const fechaSinHora = new Date(fechaVencimiento);
          fechaSinHora.setHours(0, 0, 0, 0);
          matchMes = fechaSinHora.getTime() === hoy.getTime();
        } else if (filtroMesFactura === 'ayer') {
          const ayer = new Date(hoy);
          ayer.setDate(ayer.getDate() - 1);
          const fechaSinHora = new Date(fechaVencimiento);
          fechaSinHora.setHours(0, 0, 0, 0);
          matchMes = fechaSinHora.getTime() === ayer.getTime();
        } else if (filtroMesFactura === 'ultimos7') {
          const hace7dias = new Date(hoy);
          hace7dias.setDate(hace7dias.getDate() - 7);
          matchMes = fechaVencimiento >= hace7dias;
        } else if (filtroMesFactura !== 'todos') {
          matchMes = fechaVencimiento.getMonth() === parseInt(filtroMesFactura);
        }
        return matchSearch && matchEstado && matchProveedor && matchAnio && matchMes;
      });
  }, [facturas, searchTerm, filtroEstado, filtroProveedorFactura, filtroAnioFactura, filtroMesFactura, pagosPorFactura, pagosPendientesPorFactura, ncPorFactura]);

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

  const handleLogout = () => {
    localStorage.removeItem('tero_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen">
      {/* Banner Modo Demo */}
      {demoMode && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 text-sm font-medium sticky top-0 z-50 shadow-md">
          <span className="inline-flex items-center gap-2">
            <span className="animate-pulse">●</span>
            Modo Demo - Los datos mostrados son ficticios
            <span className="animate-pulse">●</span>
          </span>
        </div>
      )}
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
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 py-3">
        <div className="flex gap-1 p-1.5 glass rounded-xl overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
            { id: 'facturas', label: 'Facturas', icon: FileText },
            { id: 'proveedores', label: 'Proveed.', icon: Building2 },
            { id: 'pago-proveedores', label: 'Pago Prov', icon: DollarSign },
            { id: 'ordenes-pago', label: 'Órdenes', icon: CheckCircle },
            { id: 'notas-credito', label: 'NC', icon: FileText },
            { id: 'empleados', label: 'Empleados', icon: Users },
            { id: 'pago-empleados', label: 'Pago Emp', icon: DollarSign },
            { id: 'pagos', label: 'Pagos', icon: CreditCard },
            { id: 'informes', label: 'Informes', icon: AlertCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'tab-active text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card glass rounded-2xl p-4 sm:p-5 glow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-1">Total Deuda</p>
                    <p className="text-lg sm:text-2xl font-bold mono text-blue-400">{formatCurrency(stats.totalPendiente + stats.totalVencido, false)}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.facturasPendientes + stats.facturasVencidas} facturas</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="stat-card glass rounded-2xl p-4 sm:p-5 glow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-1">A pagar 7 días</p>
                    <p className="text-lg sm:text-2xl font-bold mono text-amber-400">{formatCurrency(facturasProximas.reduce((sum, f) => sum + f.saldo, 0), false)}</p>
                    <p className="text-xs text-slate-500 mt-1">{facturasProximas.length} facturas</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="stat-card glass rounded-2xl p-4 sm:p-5 glow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-1">Vencidas</p>
                    <p className="text-lg sm:text-2xl font-bold mono text-red-400">{formatCurrency(stats.totalVencido, false)}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.facturasVencidas} facturas</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Compras del Mes */}
            <div className="glass rounded-2xl p-4 glow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Compras del Mes
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={filtroMesComprasDash}
                    onChange={(e) => setFiltroMesComprasDash(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                  >
                    {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select
                    value={filtroAnioComprasDash}
                    onChange={(e) => setFiltroAnioComprasDash(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                  >
                    {[...new Set(facturas.map(f => new Date(f.fecha + 'T12:00:00').getFullYear()))].sort((a, b) => b - a).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(() => {
                const totalCompras = comprasDelMes.reduce((sum, f) => sum + f.monto, 0);
                // Pagos a proveedores hechos en el mismo mes/año seleccionado
                const pagosDelMes = pagos.filter(p => {
                  if (p.estado_pago !== 'confirmado' || p.tipo !== 'factura') return false;
                  const fechaPago = new Date(p.fecha);
                  return fechaPago.getMonth() === parseInt(filtroMesComprasDash) &&
                         fechaPago.getFullYear() === parseInt(filtroAnioComprasDash);
                });
                const totalPagadoMes = pagosDelMes.reduce((sum, p) => sum + p.monto, 0);
                // Saldo pendiente actual de las facturas de ese mes
                const saldoPendienteCompras = comprasDelMes.reduce((sum, f) => {
                  const pagado = pagosPorFactura[f.id] || 0;
                  const nc = ncPorFactura[f.id] || 0;
                  const saldo = f.monto - pagado - nc;
                  return sum + (saldo > 0 ? saldo : 0);
                }, 0);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Compras del Mes</p>
                      <p className="text-lg font-bold text-blue-600 mono">{formatCurrency(totalCompras)}</p>
                      <p className="text-xs text-slate-400">{comprasDelMes.length} facturas</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Pago Proveedores</p>
                      <p className="text-lg font-bold text-emerald-600 mono">{formatCurrency(totalPagadoMes)}</p>
                      <p className="text-xs text-slate-400">{pagosDelMes.length} pagos</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Saldo Pendiente</p>
                      <p className="text-lg font-bold text-amber-600 mono">{formatCurrency(saldoPendienteCompras)}</p>
                      <p className="text-xs text-slate-400">de compras del mes</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Proveedores</p>
                      <p className="text-lg font-bold text-purple-600">{new Set(comprasDelMes.map(f => f.proveedor_id)).size}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sueldos y Eventos en grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sueldos del Mes */}
              <div className="glass rounded-2xl p-4 glow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    Sueldos del Mes
                  </h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={filtroMesSueldosDash}
                      onChange={(e) => setFiltroMesSueldosDash(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500/50 text-xs"
                    >
                      {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                      value={filtroAnioSueldosDash}
                      onChange={(e) => setFiltroAnioSueldosDash(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500/50 text-xs"
                    >
                      {[2024, 2025, 2026].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(() => {
                  const sueldosDelMes = pagos.filter(p => {
                    if (p.tipo !== 'sueldo' || p.estado_pago === 'anulado') return false;
                    const fechaPago = new Date(p.fecha + 'T12:00:00');
                    return fechaPago.getMonth() === parseInt(filtroMesSueldosDash) &&
                           fechaPago.getFullYear() === parseInt(filtroAnioSueldosDash);
                  });
                  const totalSueldos = sueldosDelMes.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
                  const empleadosPagados = new Set(sueldosDelMes.map(p => p.referencia_id)).size;
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Total Pagado</p>
                        <p className="text-lg font-bold text-emerald-600 mono">{formatCurrency(totalSueldos, false)}</p>
                        <p className="text-xs text-slate-400">{sueldosDelMes.length} pagos</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Empleados</p>
                        <p className="text-lg font-bold text-blue-600">{empleadosPagados}</p>
                        <p className="text-xs text-slate-400">con pagos</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Eventos del Mes */}
              <div className="glass rounded-2xl p-4 glow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    Eventos del Mes
                  </h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={filtroMesEventosDash}
                      onChange={(e) => setFiltroMesEventosDash(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-500/50 text-xs"
                    >
                      {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                      value={filtroAnioEventosDash}
                      onChange={(e) => setFiltroAnioEventosDash(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-500/50 text-xs"
                    >
                      {[2024, 2025, 2026].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(() => {
                  const eventosDelMes = pagos.filter(p => {
                    if (p.tipo !== 'sueldo' || p.estado_pago === 'anulado') return false;
                    if (!p.descripcion || !p.descripcion.startsWith('Evento Completo')) return false;
                    const fechaPago = new Date(p.fecha + 'T12:00:00');
                    return fechaPago.getMonth() === parseInt(filtroMesEventosDash) &&
                           fechaPago.getFullYear() === parseInt(filtroAnioEventosDash);
                  });
                  const totalEventos = eventosDelMes.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
                  const cantidadEmpleados = new Set(eventosDelMes.map(p => p.referencia_id)).size;
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-purple-50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Total Pagado</p>
                        <p className="text-lg font-bold text-purple-600 mono">{formatCurrency(totalEventos, false)}</p>
                      </div>
                      <div className="bg-indigo-50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Empleados</p>
                        <p className="text-lg font-bold text-indigo-600">{cantidadEmpleados}</p>
                      </div>
                    </div>
                  );
                })()}
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
                      {formatCurrency(facturasVencidasDash.reduce((sum, f) => sum + f.saldo, 0))}
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
                            <p className="font-semibold mono text-xs text-red-600">{formatCurrency(f.saldo)}</p>
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
                      {formatCurrency(facturasProximas.reduce((sum, f) => sum + f.saldo, 0))}
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
                            <p className="font-semibold mono text-xs">{formatCurrency(f.saldo)}</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Gastos por Proveedor
                </h3>
                <select
                  value={filtroCategoriaGrafico}
                  onChange={(e) => setFiltroCategoriaGrafico(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Todas las categorías</option>
                  {CATEGORIAS_PROVEEDOR.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {datosPorCategoria.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={datosPorCategoria.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {datosPorCategoria.slice(0, 6).map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {datosPorCategoria.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-sm font-medium truncate max-w-32">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold mono">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No hay datos para mostrar</p>
              )}
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

        {/* INGRESOS */}
        {activeTab === 'ingresos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-bold">Ingresos</h2>
            </div>

            {/* Solapas Facturas / NC / Cobros / Clientes / Cta Cte */}
            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
              <button
                onClick={() => setSubTabIngresos('facturas')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  subTabIngresos === 'facturas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Facturas
              </button>
              <button
                onClick={() => setSubTabIngresos('nc')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  subTabIngresos === 'nc'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                NC
              </button>
              <button
                onClick={() => setSubTabIngresos('cobros')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  subTabIngresos === 'cobros'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Cobros
              </button>
              <button
                onClick={() => setSubTabIngresos('clientes')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  subTabIngresos === 'clientes'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Clientes
              </button>
              <button
                onClick={() => setSubTabIngresos('cta-cte')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  subTabIngresos === 'cta-cte'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Cta. Corriente
              </button>
            </div>

            {/* Subtab: Facturas de Venta */}
            {subTabIngresos === 'facturas' && (() => {
              // Filtrar facturas de venta
              const facturasVentaFiltradas = facturasVenta.filter(f => {
                const matchCliente = filtroClienteFacturaVenta === 'todos' || parseInt(f.cliente_id) === parseInt(filtroClienteFacturaVenta);
                const fechaFactura = new Date(f.fecha + 'T12:00:00');
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                let matchMes = true;
                if (filtroMesFacturaVenta === 'hoy') {
                  const fechaSinHora = new Date(fechaFactura);
                  fechaSinHora.setHours(0, 0, 0, 0);
                  matchMes = fechaSinHora.getTime() === hoy.getTime();
                } else if (filtroMesFacturaVenta === 'ayer') {
                  const ayer = new Date(hoy);
                  ayer.setDate(ayer.getDate() - 1);
                  const fechaSinHora = new Date(fechaFactura);
                  fechaSinHora.setHours(0, 0, 0, 0);
                  matchMes = fechaSinHora.getTime() === ayer.getTime();
                } else if (filtroMesFacturaVenta === 'ultimos7') {
                  const hace7dias = new Date(hoy);
                  hace7dias.setDate(hace7dias.getDate() - 7);
                  matchMes = fechaFactura >= hace7dias;
                } else if (filtroMesFacturaVenta !== 'todos') {
                  matchMes = fechaFactura.getMonth() === parseInt(filtroMesFacturaVenta);
                }
                return matchCliente && matchMes;
              });

              return (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={filtroClienteFacturaVenta}
                      onChange={(e) => setFiltroClienteFacturaVenta(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                    >
                      <option value="todos">Todos los clientes</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    <select
                      value={filtroMesFacturaVenta}
                      onChange={(e) => setFiltroMesFacturaVenta(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                    >
                      <option value="todos">Todos los meses</option>
                      <option value="hoy">Hoy</option>
                      <option value="ayer">Ayer</option>
                      <option value="ultimos7">Últimos 7 días</option>
                      {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const totalFacturado = facturasVentaFiltradas.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
                      const idsFacturasFiltradas = facturasVentaFiltradas.map(f => parseInt(f.id));
                      const totalNC = notasCreditoVenta
                        .filter(nc => idsFacturasFiltradas.includes(parseInt(nc.factura_venta_id)) ||
                          (filtroClienteFacturaVenta !== 'todos' && parseInt(nc.cliente_id) === parseInt(filtroClienteFacturaVenta)))
                        .reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);
                      const totalCobrado = cobros
                        .filter(c => idsFacturasFiltradas.includes(parseInt(c.factura_venta_id)))
                        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
                      const saldo = totalFacturado - totalNC - totalCobrado;
                      return (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Facturado</p>
                            <p className="text-base font-bold text-blue-500 mono">{formatCurrency(totalFacturado, false)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">NC</p>
                            <p className="text-base font-bold text-red-500 mono">{formatCurrency(totalNC, false)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Cobrado</p>
                            <p className="text-base font-bold text-emerald-500 mono">{formatCurrency(totalCobrado, false)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Saldo</p>
                            <p className="text-base font-bold text-amber-600 mono">{formatCurrency(saldo, false)}</p>
                          </div>
                        </>
                      );
                    })()}
                    {facturasVenta.some(f => !f.monto || parseFloat(f.monto) === 0) && (
                      <button
                        onClick={corregirFacturasSinMonto}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-all text-sm"
                        title="Corregir facturas con Total = $0"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Corregir Montos
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedItem(null); setShowModal('factura-venta'); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Factura
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
                          <th className="px-3 py-3 font-medium">Cliente</th>
                          <th className="px-3 py-3 font-medium">Venc.</th>
                          <th className="px-3 py-3 font-medium">Estado</th>
                          <th className="px-3 py-3 font-medium text-right">Total</th>
                          <th className="px-3 py-3 font-medium text-right">NC</th>
                          <th className="px-3 py-3 font-medium text-right">Cobrado</th>
                          <th className="px-3 py-3 font-medium text-right">Saldo</th>
                          <th className="px-3 py-3 font-medium text-right">Acc.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facturasVentaFiltradas.length === 0 ? (
                          <tr><td colSpan="10" className="px-3 py-8 text-center text-slate-400 text-xs">No hay facturas de venta registradas</td></tr>
                        ) : (
                          facturasVentaFiltradas.map(f => {
                            const total = parseFloat(f.monto) || 0;
                            // NC aplicadas a esta factura
                            const ncFactura = notasCreditoVenta
                              .filter(nc => parseInt(nc.factura_venta_id) === parseInt(f.id))
                              .reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);
                            // Cobros de esta factura (suma)
                            const cobradoFactura = cobros
                              .filter(c => parseInt(c.factura_venta_id) === parseInt(f.id))
                              .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
                            // Saldo = Total - NC - Cobrado
                            const saldoFactura = total - ncFactura - cobradoFactura;
                            return (
                              <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2.5 text-xs">{formatDate(f.fecha)}</td>
                                <td className="px-3 py-2.5 text-xs font-medium">{f.numero}</td>
                                <td className="px-3 py-2.5 text-xs">{f.cliente}</td>
                                <td className="px-3 py-2.5 text-xs">{formatDate(f.vencimiento)}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    f.estado === 'cobrada' ? 'bg-emerald-100 text-emerald-700' :
                                    f.estado === 'vencida' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {f.estado === 'cobrada' ? 'Cobrada' : f.estado === 'vencida' ? 'Vencida' : 'Pendiente'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-blue-500 text-xs">{formatCurrency(total, false)}</td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-red-500 text-xs">
                                  {ncFactura > 0 ? formatCurrency(ncFactura, false) : '-'}
                                </td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-emerald-500 text-xs">
                                  {cobradoFactura > 0 ? formatCurrency(cobradoFactura, false) : '-'}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold mono text-xs">
                                  <span className={saldoFactura > 0 ? 'text-amber-600' : 'text-slate-400'}>{formatCurrency(saldoFactura, false)}</span>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <button onClick={() => { setSelectedItem(f); setModalSubtotal(formatInputMonto(f.subtotal || f.monto || 0)); setModalIva(f.iva_porcentaje?.toString() || '21'); setShowModal('factura-venta'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => deleteFacturaVenta(f.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-500" title="Eliminar">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
            })()}

            {/* Subtab: Notas de Crédito */}
            {subTabIngresos === 'nc' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total NC</p>
                    <p className="text-lg font-bold text-red-500 mono">{formatCurrency(notasCreditoVenta.reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0))}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedItem(null); setModalClienteId(null); setModalFacturaId(''); setShowModal('nc-venta'); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nueva NC
                  </button>
                </div>

                <div className="glass rounded-2xl overflow-hidden glow">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">Fecha</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">Cliente</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">Número</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">Factura</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">Concepto</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-600">Monto</th>
                          <th className="px-3 py-2 text-center font-semibold text-slate-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {notasCreditoVenta.length === 0 ? (
                          <tr><td colSpan="7" className="px-3 py-8 text-center text-slate-400">No hay notas de crédito</td></tr>
                        ) : (
                          notasCreditoVenta.map(nc => {
                            const cliente = clientes.find(c => c.id === nc.cliente_id);
                            const factura = facturasVenta.find(f => f.id === nc.factura_venta_id);
                            return (
                              <tr key={nc.id} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2.5 text-xs">{formatDate(nc.fecha)}</td>
                                <td className="px-3 py-2.5 font-medium text-xs">{cliente?.nombre || '-'}</td>
                                <td className="px-3 py-2.5 text-xs">{nc.numero}</td>
                                <td className="px-3 py-2.5 text-xs">{factura?.numero || '-'}</td>
                                <td className="px-3 py-2.5 text-xs text-slate-500">{nc.concepto || '-'}</td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-red-500 text-xs">{formatCurrency(nc.monto)}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex justify-center gap-1">
                                    <button onClick={() => { setSelectedItem(nc); setModalClienteId(nc.cliente_id); setModalFacturaId(nc.factura_venta_id || ''); setShowModal('nc-venta'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <button onClick={() => deleteNotaCreditoVenta(nc.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab: Cobros */}
            {subTabIngresos === 'cobros' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total Cobrado</p>
                    <p className="text-lg font-bold text-emerald-500 mono">{formatCurrency(cobros.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0), false)}</p>
                  </div>
                  <div className="flex gap-2">
                    {cobros.some(c => !c.factura_venta_id || c.factura_venta_id === 0 || c.factura_venta_id === '0' || c.factura_venta_id === '') && (
                      <button
                        onClick={sincronizarCobrosConFacturas}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-all text-sm"
                        title="Asociar cobros antiguos a sus facturas"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sincronizar
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedItem(null); setShowModal('cobro'); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Cobro
                    </button>
                  </div>
                </div>

                {/* Cobros agrupados por factura */}
                <div className="space-y-2">
                  {(() => {
                    // Agrupar cobros por factura
                    const facturasConCobros = facturasVenta.filter(f =>
                      cobros.some(c => parseInt(c.factura_venta_id) === parseInt(f.id))
                    );

                    if (facturasConCobros.length === 0) {
                      return <p className="text-slate-400 text-sm text-center py-8">No hay cobros registrados</p>;
                    }

                    const toggleExpandido = (id) => {
                      setCobrosExpandidos(prev =>
                        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                      );
                    };

                    return facturasConCobros.map(f => {
                      const cliente = clientes.find(c => parseInt(c.id) === parseInt(f.cliente_id));
                      const cobrosFactura = cobros.filter(c => parseInt(c.factura_venta_id) === parseInt(f.id));
                      const totalCobrado = cobrosFactura.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
                      const expandido = cobrosExpandidos.includes(f.id);

                      return (
                        <div key={f.id} className="glass rounded-lg overflow-hidden">
                          {/* Header colapsable */}
                          <div
                            onClick={() => toggleExpandido(f.id)}
                            className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandido ? 'rotate-90' : ''}`} />
                              <span className="font-medium text-sm">{f.numero}</span>
                              <span className="text-xs text-slate-400">{cliente?.nombre}</span>
                              <span className="text-xs text-slate-400">({cobrosFactura.length} cobros)</span>
                            </div>
                            <span className="text-emerald-600 font-bold text-sm mono">{formatCurrency(totalCobrado, false)}</span>
                          </div>
                          {/* Detalle de cobros (expandible) */}
                          {expandido && (
                            <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                              {cobrosFactura.map(c => (
                                <div key={c.id} className="px-4 py-1.5 flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-slate-500">{formatDate(c.fecha)}</span>
                                    <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-600 text-[10px]">{c.metodo}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-emerald-600 text-xs mono">{formatCurrency(c.monto, false)}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedItem(c); setShowModal('cobro'); }} className="p-1 hover:bg-slate-200 rounded transition-colors" title="Editar">
                                      <Edit3 className="w-3 h-3 text-slate-400" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteCobro(c.id); }} className="p-1 hover:bg-red-100 rounded transition-colors" title="Eliminar">
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Subtab: Clientes */}
            {subTabIngresos === 'clientes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">{clientes.length} clientes registrados</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowModal('informe-cliente')}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Informe
                    </button>
                    <button
                      onClick={() => { setSelectedItem(null); setShowModal('cliente'); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Cliente
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clientes.length === 0 ? (
                    <p className="text-slate-400 text-sm col-span-full text-center py-8">No hay clientes registrados</p>
                  ) : (
                    clientes.map(c => (
                      <div key={c.id} className="glass rounded-xl p-4 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-800">{c.nombre}</h3>
                            {c.codigo && <p className="text-xs text-slate-400 font-mono">ID: {c.codigo}</p>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setSelectedItem(c); setShowModal('cliente'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteCliente(c.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-500" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {c.cuit && <p className="text-xs text-slate-500">CUIT: {c.cuit}</p>}
                        {c.telefono && <p className="text-xs text-slate-500">Tel: {c.telefono}</p>}
                        {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                        {c.condicion_iva && <p className="text-xs text-purple-600 mt-1">{c.condicion_iva}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Subtab: Cuentas Corrientes */}
            {subTabIngresos === 'cta-cte' && (
              <div className="space-y-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Saldo Total Pendiente</p>
                  <p className="text-lg font-bold text-amber-600 mono">
                    {formatCurrency(
                      clientes.reduce((total, cliente) => {
                        const facturado = facturasVenta
                          .filter(f => f.cliente_id === cliente.id)
                          .reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
                        const ncCliente = notasCreditoVenta
                          .filter(nc => nc.cliente_id === cliente.id)
                          .reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);
                        const cobrado = cobros
                          .filter(c => c.cliente_id === cliente.id)
                          .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
                        return total + (facturado - ncCliente - cobrado);
                      }, 0), false
                    )}
                  </p>
                </div>

                <div className="glass rounded-2xl glow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                          <th className="px-3 py-3 font-medium">Cliente</th>
                          <th className="px-3 py-3 font-medium text-right">Facturado</th>
                          <th className="px-3 py-3 font-medium text-right">NC</th>
                          <th className="px-3 py-3 font-medium text-right">Cobros</th>
                          <th className="px-3 py-3 font-medium text-right">Retenciones</th>
                          <th className="px-3 py-3 font-medium text-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientes.length === 0 ? (
                          <tr><td colSpan="6" className="px-3 py-8 text-center text-slate-400 text-xs">No hay clientes registrados</td></tr>
                        ) : (
                          clientes.map(cliente => {
                            const facturado = facturasVenta
                              .filter(f => f.cliente_id === cliente.id)
                              .reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
                            const ncCliente = notasCreditoVenta
                              .filter(nc => nc.cliente_id === cliente.id)
                              .reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);
                            const cobrosCliente = cobros.filter(c => c.cliente_id === cliente.id);
                            const totalCobros = cobrosCliente
                              .filter(c => c.metodo !== 'Retención')
                              .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
                            const totalRetenciones = cobrosCliente
                              .filter(c => c.metodo === 'Retención')
                              .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
                            const saldo = facturado - ncCliente - totalCobros - totalRetenciones;

                            return (
                              <tr key={cliente.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2.5 text-xs font-medium">{cliente.nombre}</td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-blue-500 text-xs">{formatCurrency(facturado, false)}</td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-red-500 text-xs">{ncCliente > 0 ? formatCurrency(ncCliente, false) : '-'}</td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-emerald-500 text-xs">{formatCurrency(totalCobros, false)}</td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-purple-500 text-xs">{formatCurrency(totalRetenciones, false)}</td>
                                <td className={`px-3 py-2.5 text-right font-bold mono text-xs ${saldo > 0 ? 'text-amber-600' : saldo < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {formatCurrency(saldo, false)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                          <td className="px-3 py-3 text-xs">TOTALES</td>
                          <td className="px-3 py-3 text-right mono text-blue-600 text-xs">
                            {formatCurrency(facturasVenta.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0), false)}
                          </td>
                          <td className="px-3 py-3 text-right mono text-red-600 text-xs">
                            {formatCurrency(notasCreditoVenta.reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0), false)}
                          </td>
                          <td className="px-3 py-3 text-right mono text-emerald-600 text-xs">
                            {formatCurrency(cobros.filter(c => c.metodo !== 'Retención').reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0), false)}
                          </td>
                          <td className="px-3 py-3 text-right mono text-purple-600 text-xs">
                            {formatCurrency(cobros.filter(c => c.metodo === 'Retención').reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0), false)}
                          </td>
                          <td className="px-3 py-3 text-right mono text-amber-600 text-xs">
                            {formatCurrency(
                              facturasVenta.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0) -
                              notasCreditoVenta.reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0) -
                              cobros.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0), false
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Facturas */}
        {activeTab === 'facturas' && (
          <div className="space-y-4">
            {/* Barra de acciones y filtros */}
            <div className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtros */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 w-36 text-sm"
                  />
                </div>
                <select
                  value={filtroAnioFactura}
                  onChange={(e) => setFiltroAnioFactura(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Año</option>
                  {[...new Set(facturas.map(f => new Date(f.vencimiento + 'T12:00:00').getFullYear()))].sort((a, b) => b - a).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <select
                  value={filtroMesFactura}
                  onChange={(e) => setFiltroMesFactura(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Mes</option>
                  <option value="hoy">Hoy</option>
                  <option value="ayer">Ayer</option>
                  <option value="ultimos7">Últimos 7 días</option>
                  {MESES.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
                <select
                  value={filtroProveedorFactura}
                  onChange={(e) => setFiltroProveedorFactura(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="todos">Estado</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobar">Por aprobar</option>
                  <option value="parcial">Parciales</option>
                  <option value="pagada">Pagadas</option>
                  <option value="vencida">Vencidas</option>
                  <option value="vence_semana">Vence esta semana</option>
                </select>

                {/* Espaciador flexible */}
                <div className="flex-1"></div>

                {/* Botones de acción a la derecha */}
                <button
                  onClick={() => { setSelectedItem(null); setShowModal('factura'); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all text-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Factura
                </button>
                <button
                  onClick={() => { setSelectedItem({ tipo: 'factura' }); setShowModal('pago'); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm whitespace-nowrap"
                >
                  <DollarSign className="w-4 h-4" />
                  Registrar Pago
                </button>
                <button
                  onClick={async () => {
                    if (confirm('¿Corregir facturas marcadas como pagadas que tienen saldo pendiente?')) {
                      const result = await corregirEstadosFacturas();
                      alert(`Se corrigieron ${result.corregidas} facturas`);
                    }
                  }}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                  title="Corregir estados incorrectos"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resumen de totales - más compacto */}
            <div className="flex flex-wrap gap-4 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Total:</span>
                <span className="font-bold text-blue-600 mono text-sm">{formatCurrency(facturasFiltradas.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0))}</span>
                <span className="text-xs text-slate-400">({facturasFiltradas.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Pendiente:</span>
                <span className="font-bold text-amber-600 mono text-sm">{formatCurrency(facturasFiltradas.filter(f => f.estado !== 'pagada').reduce((sum, f) => sum + (parseFloat(f.saldo) || 0), 0))}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Pagado:</span>
                <span className="font-bold text-emerald-600 mono text-sm">{formatCurrency(facturasFiltradas.reduce((sum, f) => sum + (parseFloat(f.totalPagado) || 0), 0))}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Vencido:</span>
                <span className="font-bold text-red-600 mono text-sm">
                  {formatCurrency(facturasFiltradas.filter(f => {
                    if (f.estado === 'pagada' || f.saldo <= 0) return false;
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const venc = new Date(f.vencimiento + 'T12:00:00');
                    return venc < hoy;
                  }).reduce((sum, f) => sum + (parseFloat(f.saldo) || 0), 0))}
                </span>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                      <th className="px-3 py-2 font-medium">Proveedor</th>
                      <th className="px-3 py-2 font-medium">Número</th>
                      <th className="px-3 py-2 font-medium">Obs.</th>
                      <th className="px-3 py-2 font-medium">Vencimiento</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium text-right">Monto</th>
                      <th className="px-3 py-2 font-medium text-right">Saldo</th>
                      <th className="px-3 py-2 font-medium text-right">Acc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasFiltradas.map(f => {
                      const dias = getDiasVencimiento(f.vencimiento);
                      const tienePagos = f.pagado > 0;
                      const tieneNC = f.nc > 0;
                      // Calcular si vence pronto (7 días o menos) y no está pagada
                      const hoy = new Date();
                      hoy.setHours(0, 0, 0, 0);
                      const venc = new Date(f.vencimiento + 'T12:00:00');
                      const diasHastaVenc = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
                      const venceProximaSemana = diasHastaVenc >= 0 && diasHastaVenc <= 7 && f.estado !== 'pagada';
                      const estaVencida = diasHastaVenc < 0 && f.estado !== 'pagada';
                      // Color de fila según urgencia
                      const rowBg = estaVencida
                        ? 'bg-red-50 hover:bg-red-100'
                        : venceProximaSemana
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : 'hover:bg-slate-50';
                      return (
                        <tr key={f.id} className={`border-b border-slate-100 transition-colors ${rowBg}`}>
                          <td className="px-3 py-2 font-medium">{f.proveedor}</td>
                          <td className="px-3 py-2 text-slate-400">{f.numero}</td>
                          <td className="px-3 py-2">{f.concepto}</td>
                          <td className="px-3 py-2">
                            <div>
                              <p>{formatDate(f.vencimiento)}</p>
                              {f.estado === 'pendiente' && (
                                <p className={`text-xs ${dias.clase}`}>{dias.texto}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium badge-${f.estadoDisplay}`}>
                              {f.estadoDisplay.charAt(0).toUpperCase() + f.estadoDisplay.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold mono">{formatCurrency(f.monto)}</td>
                          <td className="px-3 py-2 text-right">
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
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => { setSelectedItem(f); setShowModal('factura'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
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
                  const condicionLabel = CONDICIONES_PAGO.find(c => c.value == p.condicion_pago)?.label || 'Contado';
                  const formaLabel = FORMAS_PAGO_PROVEEDOR.find(f => f.value === p.forma_pago)?.label || '';
                  return (
                    <div key={p.id} className="glass rounded-xl p-3 glow hover:border-blue-500/30 border border-transparent transition-all cursor-pointer" onClick={() => { setSelectedItem(p); setShowModal('proveedor'); }}>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoriaLabel !== 'Sin categoría' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{categoriaLabel}</span>
                        <Edit3 className="w-3 h-3 text-slate-400" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1 truncate">{p.nombre}</h3>
                      {p.codigo && <p className="text-xs text-slate-400 font-mono">ID: {p.codigo}</p>}
                      {p.contacto && <p className="text-xs text-blue-600 truncate">{p.contacto}</p>}
                      {p.celular && <p className="text-xs text-slate-500 truncate">{p.celular}</p>}
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold">{condicionLabel}</span>
                        {formaLabel && <span> · {formaLabel}</span>}
                      </p>
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
        {activeTab === 'pago-proveedores' && (() => {
          // Filtrar pagos a proveedores
          const pagosFiltrados = pagos.filter(p => {
            if (p.tipo !== 'factura' || p.estado_pago !== 'confirmado') return false;
            // Filtro por proveedor (buscar en descripción)
            if (filtroProveedorPagoProv !== 'todos') {
              const proveedor = proveedores.find(prov => prov.id === parseInt(filtroProveedorPagoProv));
              if (!proveedor || !p.descripcion.includes(proveedor.nombre)) return false;
            }
            // Filtro por fecha específica o mes/año
            const fechaPago = new Date(p.fecha + 'T12:00:00');
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            // Si hay fecha específica, filtrar solo por esa fecha
            if (filtroFechaPagoProv) {
              if (p.fecha !== filtroFechaPagoProv) return false;
            } else if (filtroMesPagoProv === 'ayer') {
              const ayer = new Date(hoy);
              ayer.setDate(ayer.getDate() - 1);
              const fechaPagoSinHora = new Date(fechaPago);
              fechaPagoSinHora.setHours(0, 0, 0, 0);
              if (fechaPagoSinHora.getTime() !== ayer.getTime()) return false;
            } else if (filtroMesPagoProv === 'ultimos7') {
              const hace7dias = new Date(hoy);
              hace7dias.setDate(hace7dias.getDate() - 7);
              if (fechaPago < hace7dias) return false;
            } else {
              if (filtroAnioPagoProv !== 'todos' && fechaPago.getFullYear() !== parseInt(filtroAnioPagoProv)) return false;
              if (filtroMesPagoProv !== 'todos' && fechaPago.getMonth() !== parseInt(filtroMesPagoProv)) return false;
            }
            return true;
          });
          const totalFiltrado = pagosFiltrados.reduce((sum, p) => sum + p.monto, 0);

          // Función para actualizar conciliación (actualiza estado local para evitar re-render)
          const toggleConciliacion = async (pagoId, valorActual) => {
            // Actualizar estado local inmediatamente
            setPagos(prev => prev.map(p =>
              p.id === pagoId ? { ...p, conciliado: !valorActual } : p
            ));
            // Guardar en Supabase
            await supabase
              .from('pagos')
              .update({ conciliado: !valorActual })
              .eq('id', pagoId);
          };

          // Función para guardar nota de conciliación
          const guardarNotaConciliacion = async (pagoId, nota) => {
            // Actualizar estado local
            setPagos(prev => prev.map(p =>
              p.id === pagoId ? { ...p, conciliado_nota: nota } : p
            ));
            // Guardar en Supabase
            await supabase
              .from('pagos')
              .update({ conciliado_nota: nota })
              .eq('id', pagoId);
          };

          // Contadores y totales para conciliación
          const pagosConciliados = pagosFiltrados.filter(p => p.conciliado).length;
          const pagosPendientesConciliar = pagosFiltrados.filter(p => !p.conciliado).length;
          const totalConciliado = pagosFiltrados.filter(p => p.conciliado).reduce((sum, p) => sum + p.monto, 0);
          const totalPorConciliar = pagosFiltrados.filter(p => !p.conciliado).reduce((sum, p) => sum + p.monto, 0);

          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-lg font-bold">Pago a Proveedores</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filtroProveedorPagoProv}
                    onChange={(e) => setFiltroProveedorPagoProv(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                  >
                    <option value="todos">Todos los proveedores</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <select
                    value={filtroMesPagoProv}
                    onChange={(e) => { setFiltroMesPagoProv(e.target.value); setFiltroFechaPagoProv(''); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                  >
                    <option value="todos">Todos los meses</option>
                    <option value="ayer">Ayer</option>
                    <option value="ultimos7">Últimos 7 días</option>
                    {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select
                    value={filtroAnioPagoProv}
                    onChange={(e) => { setFiltroAnioPagoProv(e.target.value); setFiltroFechaPagoProv(''); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                  >
                    <option value="todos">Todos los años</option>
                    {[...new Set(pagos.filter(p => p.tipo === 'factura').map(p => new Date(p.fecha + 'T12:00:00').getFullYear()))].sort((a, b) => b - a).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={filtroFechaPagoProv}
                      onChange={(e) => { setFiltroFechaPagoProv(e.target.value); if (e.target.value) { setFiltroMesPagoProv('todos'); setFiltroAnioPagoProv('todos'); } }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50 text-sm"
                    />
                    {filtroFechaPagoProv && (
                      <button
                        onClick={() => setFiltroFechaPagoProv('')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                        title="Limpiar fecha"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Solapas Pagos / Conciliación */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => handleSubTabChange('pagos')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    subTabPagoProv === 'pagos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Pagos
                </button>
                <button
                  onClick={() => handleSubTabChange('conciliacion')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    subTabPagoProv === 'conciliacion'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Conciliación
                  {pagosPendientesConciliar > 0 && (
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                      {pagosPendientesConciliar}
                    </span>
                  )}
                </button>
              </div>

              {/* Contenido según solapa activa */}
              {subTabPagoProv === 'pagos' && (
                <>
                  {/* Resumen */}
                  <div className="glass rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500">Total pagado {filtroMesPagoProv !== 'todos' ? MESES[parseInt(filtroMesPagoProv)] : ''} {filtroAnioPagoProv !== 'todos' ? filtroAnioPagoProv : ''}</p>
                        <p className="text-xs text-slate-400">{pagosFiltrados.length} pagos</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-500 mono">{formatCurrency(totalFiltrado)}</p>
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
                          {pagosFiltrados.length === 0 ? (
                            <tr><td colSpan="5" className="px-3 py-8 text-center text-slate-400 text-xs">No hay pagos en el período seleccionado</td></tr>
                          ) : (
                            pagosFiltrados.map(p => (
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
                </>
              )}

              {subTabPagoProv === 'conciliacion' && (
                <>
                  {/* Pantalla de clave si no está autenticado */}
                  {!isConciliacionAuthValid() ? (
                    <div className="glass rounded-2xl p-8 max-w-sm mx-auto">
                      <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Acceso a Conciliación</h3>
                        <p className="text-sm text-slate-500 mt-1">Ingresá la clave para continuar</p>
                      </div>
                      <form onSubmit={validarClaveConciliacion}>
                        <input
                          type="password"
                          value={claveConciliacion}
                          onChange={(e) => { setClaveConciliacion(e.target.value); setErrorClaveConciliacion(false); }}
                          placeholder="Clave"
                          className={`w-full px-4 py-3 rounded-xl border ${errorClaveConciliacion ? 'border-red-400 bg-red-50' : 'border-slate-200'} focus:outline-none focus:border-emerald-500 text-center text-lg tracking-widest`}
                          autoFocus
                        />
                        {errorClaveConciliacion && (
                          <p className="text-red-500 text-xs text-center mt-2">Clave incorrecta</p>
                        )}
                        <button
                          type="submit"
                          className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all"
                        >
                          Ingresar
                        </button>
                      </form>
                    </div>
                  ) : (
                    <>
                      {/* Resumen Conciliación */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="glass rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                            <div>
                              <p className="text-xs text-slate-500">Conciliados ({pagosConciliados})</p>
                              <p className="text-xl font-bold text-emerald-500 mono">{formatCurrency(totalConciliado)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="glass rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6 text-amber-500" />
                            <div>
                              <p className="text-xs text-slate-500">Por conciliar ({pagosPendientesConciliar})</p>
                              <p className="text-xl font-bold text-amber-500 mono">{formatCurrency(totalPorConciliar)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-2xl glow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                            <th className="px-3 py-3 font-medium w-12 text-center">Conciliado</th>
                            <th className="px-3 py-3 font-medium">Observación</th>
                            <th className="px-3 py-3 font-medium">Fecha Pago</th>
                            <th className="px-3 py-3 font-medium">Proveedor / Factura</th>
                            <th className="px-3 py-3 font-medium">Método</th>
                            <th className="px-3 py-3 font-medium text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagosFiltrados.length === 0 ? (
                            <tr><td colSpan="6" className="px-3 py-8 text-center text-slate-400 text-xs">No hay pagos en el período seleccionado</td></tr>
                          ) : (
                            pagosFiltrados.map(p => (
                              <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${p.conciliado ? 'bg-emerald-50/50' : ''}`}>
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    onClick={() => toggleConciliacion(p.id, p.conciliado)}
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                      p.conciliado
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-slate-300 hover:border-emerald-400'
                                    }`}
                                    title={p.conciliado ? 'Marcar como no conciliado' : 'Marcar como conciliado'}
                                  >
                                    {p.conciliado && <CheckCircle className="w-4 h-4" />}
                                  </button>
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    defaultValue={p.conciliado_nota || ''}
                                    onBlur={(e) => {
                                      if (e.target.value !== (p.conciliado_nota || '')) {
                                        guardarNotaConciliacion(p.id, e.target.value);
                                      }
                                    }}
                                    placeholder="Ej: Banco OP 123"
                                    className="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:border-blue-400 bg-white"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-xs">{formatDate(p.fecha)}</td>
                                <td className="px-3 py-2.5 text-xs">{p.descripcion}</td>
                                <td className="px-3 py-2.5 text-xs text-slate-500">{p.metodo}</td>
                                <td className="px-3 py-2.5 text-right font-semibold mono text-emerald-500 text-xs">{formatCurrency(p.monto)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })()}

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
                  <option value="evento">Evento</option>
                  <option value="evento_parcial">Evento Parcial</option>
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
                  <option value="E-Cheq">E-Cheq</option>
                </select>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Proveedores</p>
                <p className="text-lg font-bold text-blue-500 mono">
                  {formatCurrency(pagos
                    .filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado')
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                    .reduce((sum, p) => sum + p.monto, 0), false)}
                </p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Empleados</p>
                <p className="text-lg font-bold text-cyan-500 mono">
                  {formatCurrency(pagos
                    .filter(p => p.tipo === 'sueldo' && p.estado_pago === 'confirmado')
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                    .reduce((sum, p) => sum + p.monto, 0), false)}
                </p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Eventos</p>
                <p className="text-lg font-bold text-purple-500 mono">
                  {formatCurrency(pagos
                    .filter(p => (p.tipo === 'evento' || p.tipo === 'evento_parcial') && p.estado_pago === 'confirmado')
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                    .reduce((sum, p) => sum + p.monto, 0), false)}
                </p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">Total General</p>
                <p className="text-lg font-bold text-emerald-500 mono">
                  {formatCurrency(pagos
                    .filter(p => p.estado_pago === 'confirmado')
                    .filter(p => filtroTipoPago === 'todos' || p.tipo === filtroTipoPago)
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .filter(p => filtroMetodoPago === 'todos' || p.metodo === filtroMetodoPago)
                    .reduce((sum, p) => sum + p.monto, 0), false)}
                </p>
              </div>
            </div>

            {/* Botón Nuevo Pago Evento */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal('pago-evento')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Nuevo Pago Evento
              </button>
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

        {/* ORDENES DE PAGO */}
        {activeTab === 'ordenes-pago' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-lg font-bold">Órdenes de Pago a Proveedores</h2>
            </div>

            {/* Órdenes pendientes */}
            {ordenesPago.filter(o => o.estado === 'pendiente').length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Órdenes Pendientes de Confirmación
                </h3>
                {ordenesPago.filter(o => o.estado === 'pendiente').map(orden => {
                  const pagosOrden = pagos.filter(p => p.orden_pago_id === orden.id && p.estado_pago === 'pendiente');
                  const totalOrden = pagosOrden.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

                  return (
                    <div key={orden.id} className="glass rounded-xl p-4 border-2 border-amber-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">Orden #{orden.id}</p>
                          <p className="text-xs text-slate-500">{formatDate(orden.fecha)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-600 mono">{formatCurrency(totalOrden)}</p>
                          <p className="text-xs text-slate-500">{pagosOrden.length} pago(s)</p>
                        </div>
                      </div>

                      {/* Lista de pagos en la orden */}
                      <div className="space-y-2 mb-4">
                        {pagosOrden.map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-white/50 rounded-lg p-2 text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-xs">{p.descripcion}</p>
                              <p className="text-xs text-slate-400">{p.metodo}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold mono text-sm">{formatCurrency(p.monto)}</span>
                              <button
                                onClick={() => {
                                  if (confirm('¿Quitar este pago de la orden?')) {
                                    anularPagoDeOrden(p.id);
                                  }
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Quitar de la orden"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (confirm('¿Confirmar esta orden de pago? Los pagos serán aplicados.')) {
                              confirmarOrdenPago(orden.id);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar Orden
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Anular toda la orden? Se eliminarán todos los pagos pendientes.')) {
                              anularOrdenPago(orden.id);
                            }
                          }}
                          className="px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all text-sm"
                        >
                          Anular
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mensaje si no hay órdenes pendientes */}
            {ordenesPago.filter(o => o.estado === 'pendiente').length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-500">No hay órdenes pendientes de confirmación</p>
                <p className="text-xs text-slate-400 mt-1">Los pagos a proveedores aparecerán aquí para su aprobación</p>
              </div>
            )}

            {/* Historial de órdenes confirmadas */}
            {ordenesPago.filter(o => o.estado === 'confirmada').length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Órdenes Confirmadas
                  <span className="text-xs text-slate-400 font-normal ml-2">(click para ver detalle)</span>
                </h3>
                <div className="space-y-2">
                  {ordenesPago.filter(o => o.estado === 'confirmada').slice(0, 20).map(orden => {
                    const pagosOrden = pagos.filter(p => p.orden_pago_id === orden.id);
                    const totalOrden = pagosOrden.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
                    const isExpanded = ordenSeleccionada === orden.id;
                    return (
                      <div key={orden.id} className="glass rounded-xl overflow-hidden">
                        <div
                          className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setOrdenSeleccionada(isExpanded ? null : orden.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            </span>
                            <span className="font-medium">Orden #{orden.id}</span>
                            <span className="text-xs text-slate-500">{formatDate(orden.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500">{pagosOrden.length} pago(s)</span>
                            <span className="font-semibold mono text-emerald-600">{formatCurrency(totalOrden)}</span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-slate-100 p-3 bg-slate-50/50">
                            <div className="space-y-2">
                              {pagosOrden.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-white rounded-lg p-2 text-sm">
                                  <div className="flex-1">
                                    <p className="font-medium text-xs">{p.descripcion}</p>
                                    <p className="text-xs text-slate-400">{p.metodo} - {formatDate(p.fecha)}</p>
                                  </div>
                                  <span className="font-semibold mono text-sm text-emerald-600">{formatCurrency(p.monto)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                              <span className="text-sm font-bold mono text-emerald-600">Total: {formatCurrency(totalOrden)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                { id: 'saldo-proveedor', label: 'Saldo por Proveedor', icon: Building2 },
                { id: 'anulaciones', label: 'Anulaciones', icon: AlertCircle },
                { id: 'modificaciones', label: 'Modificaciones', icon: Edit3 },
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

            {/* INFORME: Saldo por Proveedor */}
            {informeActivo === 'saldo-proveedor' && (
              <div className="space-y-4">
                {(() => {
                  // Calcular saldo por proveedor
                  const saldosPorProveedor = proveedores.map(prov => {
                    // Facturas pendientes del proveedor
                    const facturasProveedor = facturas.filter(f => f.proveedor_id === prov.id && f.estado !== 'pagada');
                    const totalFacturas = facturasProveedor.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);

                    // Pagos confirmados al proveedor
                    const pagosProveedor = pagos
                      .filter(p => p.tipo === 'factura' && p.estado_pago === 'confirmado' && p.descripcion)
                      .filter(p => facturasProveedor.some(f => p.descripcion.includes(f.numero)))
                      .reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

                    // NC del proveedor aplicadas a facturas pendientes
                    const ncProveedor = notasCredito
                      .filter(nc => nc.proveedor_id === prov.id && facturasProveedor.some(f => f.id === nc.factura_id))
                      .reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);

                    const saldo = totalFacturas - pagosProveedor - ncProveedor;

                    return {
                      ...prov,
                      totalFacturas,
                      pagado: pagosProveedor,
                      nc: ncProveedor,
                      saldo,
                      cantidadFacturas: facturasProveedor.length
                    };
                  }).filter(p => p.saldo > 0).sort((a, b) => b.saldo - a.saldo);

                  const totalGeneral = saldosPorProveedor.reduce((sum, p) => sum + p.saldo, 0);

                  return (
                    <>
                      {/* Resumen total */}
                      <div className="glass rounded-xl p-4 border-l-4 border-amber-400">
                        <p className="text-xs text-slate-500">Total Adeudado a Proveedores</p>
                        <p className="text-2xl font-bold text-amber-600 mono">{formatCurrency(totalGeneral)}</p>
                        <p className="text-xs text-slate-400 mt-1">{saldosPorProveedor.length} proveedores con saldo pendiente</p>
                      </div>

                      {/* Tabla de saldos */}
                      <div className="glass rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-slate-400 text-xs border-b border-slate-200">
                              <th className="px-4 py-3 font-medium">Proveedor</th>
                              <th className="px-4 py-3 font-medium text-center">Facturas</th>
                              <th className="px-4 py-3 font-medium text-right">Total Fact.</th>
                              <th className="px-4 py-3 font-medium text-right">Pagado</th>
                              <th className="px-4 py-3 font-medium text-right">NC</th>
                              <th className="px-4 py-3 font-medium text-right">Saldo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {saldosPorProveedor.length === 0 ? (
                              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 text-xs">No hay saldos pendientes</td></tr>
                            ) : (
                              saldosPorProveedor.map(p => (
                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                                  <td className="px-4 py-3 text-center text-slate-500">{p.cantidadFacturas}</td>
                                  <td className="px-4 py-3 text-right mono text-slate-600">{formatCurrency(p.totalFacturas)}</td>
                                  <td className="px-4 py-3 text-right mono text-emerald-600">{formatCurrency(p.pagado)}</td>
                                  <td className="px-4 py-3 text-right mono text-purple-600">{formatCurrency(p.nc)}</td>
                                  <td className="px-4 py-3 text-right font-bold mono text-amber-600">{formatCurrency(p.saldo)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {saldosPorProveedor.length > 0 && (
                            <tfoot>
                              <tr className="bg-slate-50 font-semibold">
                                <td className="px-4 py-3">TOTAL</td>
                                <td className="px-4 py-3 text-center">{saldosPorProveedor.reduce((sum, p) => sum + p.cantidadFacturas, 0)}</td>
                                <td className="px-4 py-3 text-right mono">{formatCurrency(saldosPorProveedor.reduce((sum, p) => sum + p.totalFacturas, 0))}</td>
                                <td className="px-4 py-3 text-right mono text-emerald-600">{formatCurrency(saldosPorProveedor.reduce((sum, p) => sum + p.pagado, 0))}</td>
                                <td className="px-4 py-3 text-right mono text-purple-600">{formatCurrency(saldosPorProveedor.reduce((sum, p) => sum + p.nc, 0))}</td>
                                <td className="px-4 py-3 text-right mono text-amber-600">{formatCurrency(totalGeneral)}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

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

            {/* INFORME: Modificaciones */}
            {informeActivo === 'modificaciones' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4 border-l-4 border-purple-400">
                    <p className="text-xs text-slate-500">Total Modificaciones</p>
                    <p className="text-2xl font-bold text-purple-500">
                      {modificaciones.filter(m => (filtroAnioInforme === 'todos' || new Date(m.fecha_modificacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(m.fecha_modificacion).getMonth() === parseInt(filtroMesInforme))).length}
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4 border-l-4 border-blue-400">
                    <p className="text-xs text-slate-500">Diferencia Neta</p>
                    <p className="text-2xl font-bold text-blue-500 mono">
                      {formatCurrency(modificaciones.filter(m => (filtroAnioInforme === 'todos' || new Date(m.fecha_modificacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(m.fecha_modificacion).getMonth() === parseInt(filtroMesInforme))).reduce((sum, m) => sum + ((parseFloat(m.valor_nuevo) || 0) - (parseFloat(m.valor_anterior) || 0)), 0))}
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
                          <th className="px-4 py-3 font-medium text-right">Anterior</th>
                          <th className="px-4 py-3 font-medium text-right">Nuevo</th>
                          <th className="px-4 py-3 font-medium">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modificaciones.filter(m => (filtroAnioInforme === 'todos' || new Date(m.fecha_modificacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(m.fecha_modificacion).getMonth() === parseInt(filtroMesInforme))).length === 0 ? (
                          <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 text-sm">No hay modificaciones</td></tr>
                        ) : (
                          modificaciones.filter(m => (filtroAnioInforme === 'todos' || new Date(m.fecha_modificacion).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(m.fecha_modificacion).getMonth() === parseInt(filtroMesInforme))).map(m => (
                            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 text-xs">{new Date(m.fecha_modificacion).toLocaleDateString('es-AR')}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.tipo === 'factura' ? 'bg-blue-500/15 text-blue-700' : 'bg-purple-500/15 text-purple-700'}`}>
                                  {m.tipo === 'pago' ? 'Pago' : m.tipo === 'factura' ? 'Factura' : m.tipo}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs">{m.tipo === 'factura' ? `${m.datos_originales?.proveedor || proveedores.find(p => p.id === m.datos_originales?.proveedor_id)?.nombre || ''} - Fact. ${m.datos_originales?.numero || ''}` : (m.datos_originales?.descripcion || '-')}</td>
                              <td className="px-4 py-3 text-right font-semibold mono text-slate-500">{formatCurrency(m.valor_anterior || 0)}</td>
                              <td className="px-4 py-3 text-right font-semibold mono text-purple-600">{formatCurrency(m.valor_nuevo || 0)}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">{m.motivo}</td>
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
              const pagosFiltrados = pagos.filter(p => p.estado_pago === 'confirmado' && (filtroAnioInforme === 'todos' || new Date(p.fecha).getFullYear() === parseInt(filtroAnioInforme)) && (filtroMesInforme === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesInforme)));
              const pagosProveedores = pagosFiltrados.filter(p => p.tipo === 'factura');
              const pagosEmpleados = pagosFiltrados.filter(p => p.tipo === 'sueldo');
              const totalProveedores = pagosProveedores.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
              const totalEmpleados = pagosEmpleados.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
              const totalGeneral = totalProveedores + totalEmpleados;

              // Agrupar por método de pago
              const pagosPorMetodo = ['Efectivo', 'Transferencia', 'Mercado Pago', 'E-Cheq'].map(metodo => {
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

      {/* Modal Informe Cliente */}
      {showModal === 'informe-cliente' && (
        <ModalInformeCliente
          onClose={() => setShowModal(null)}
          clientes={clientes}
          facturasVenta={facturasVenta}
          cobros={cobros}
        />
      )}

      {/* Modal Factura */}
      {showModal === 'factura' && (
        <ModalFactura
          factura={selectedItem}
          proveedores={proveedores}
          facturas={facturas}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data, modificacion) => updateFactura(selectedItem.id, data, modificacion) : createFactura}
          onDelete={deleteFactura}
          onRegistrarPago={(factura) => {
            setSelectedItem({ tipo: 'factura', facturaPreseleccionada: factura });
            setShowModal('pago');
          }}
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
          facturaPreseleccionada={selectedItem?.facturaPreseleccionada}
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

      {/* Modal Cliente */}
      {showModal === 'cliente' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">{selectedItem ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <button onClick={() => { setShowModal(null); setSelectedItem(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  nombre: formData.get('nombre'),
                  cuit: formData.get('cuit') || null,
                  telefono: formData.get('telefono') || null,
                  email: formData.get('email') || null,
                  direccion: formData.get('direccion') || null,
                  condicion_iva: formData.get('condicion_iva') || null
                };
                if (selectedItem) {
                  await updateCliente(selectedItem.id, data);
                } else {
                  await createCliente(data);
                }
              }} className="space-y-4" autoComplete="off">
                <div className={selectedItem ? "grid grid-cols-3 gap-3" : ""}>
                  <div className={selectedItem ? "col-span-2" : ""}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                    <input name="nombre" defaultValue={selectedItem?.nombre || ''} required autoComplete="off" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
                  </div>
                  {selectedItem && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                      <input value={selectedItem?.codigo || ''} readOnly className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                  <input name="cuit" defaultValue={selectedItem?.cuit || ''} autoComplete="off" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <input name="telefono" defaultValue={selectedItem?.telefono || ''} autoComplete="off" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input name="email" type="email" defaultValue={selectedItem?.email || ''} autoComplete="off" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                  <input name="direccion" defaultValue={selectedItem?.direccion || ''} autoComplete="off" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Condición IVA</label>
                  <select name="condicion_iva" defaultValue={selectedItem?.condicion_iva || ''} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500">
                    <option value="">Seleccionar...</option>
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributista">Monotributista</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                    <option value="Exento">Exento</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all">
                    {selectedItem ? 'Guardar' : 'Crear Cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Factura de Venta */}
      {showModal === 'factura-venta' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-slate-800">{selectedItem ? 'Editar Factura' : 'Nueva Factura de Venta'}</h2>
                <button onClick={() => { setShowModal(null); setSelectedItem(null); setModalClienteId(null); setModalSubtotal(''); setModalIva('21'); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Paso 1: Seleccionar Cliente */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Cliente *</label>
                <select
                  value={selectedItem?.cliente_id || modalClienteId || ''}
                  onChange={(e) => setModalClienteId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Paso 2: Resto del formulario (solo si hay cliente) */}
              {(modalClienteId || selectedItem?.cliente_id) && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const subtotal = parseFloat(parseInputMonto(modalSubtotal || (selectedItem?.subtotal || selectedItem?.monto || 0))) || 0;
                  const ivaPercent = parseFloat(modalIva || selectedItem?.iva_porcentaje || 21) || 0;
                  const ivaAmount = subtotal * (ivaPercent / 100);
                  const total = subtotal + ivaAmount;

                  const data = {
                    numero: formData.get('numero'),
                    cliente_id: selectedItem?.cliente_id || modalClienteId,
                    subtotal: subtotal,
                    iva_porcentaje: ivaPercent,
                    iva_monto: ivaAmount,
                    monto: total,
                    fecha: formData.get('fecha'),
                    vencimiento: formData.get('vencimiento'),
                    concepto: formData.get('concepto') || null,
                    estado: selectedItem?.estado || 'pendiente'
                  };
                  if (selectedItem) {
                    await updateFacturaVenta(selectedItem.id, data);
                  } else {
                    await createFacturaVenta(data);
                  }
                  setModalClienteId(null);
                  setModalSubtotal('');
                  setModalIva('21');
                }} className="space-y-3">
                  <input type="hidden" name="cliente_id" value={selectedItem?.cliente_id || modalClienteId} />

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Número de Factura *</label>
                    <input name="numero" defaultValue={selectedItem?.numero || ''} required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm" />
                  </div>

                  {/* Subtotal, IVA y Total */}
                  <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Subtotal *</label>
                        <input
                          value={modalSubtotal || (selectedItem ? formatInputMonto(selectedItem.subtotal || selectedItem.monto) : '')}
                          onChange={(e) => setModalSubtotal(formatInputMonto(e.target.value))}
                          required
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">IVA</label>
                        <select
                          value={modalIva || (selectedItem?.iva_porcentaje?.toString() || '21')}
                          onChange={(e) => setModalIva(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                        >
                          <option value="21">21%</option>
                          <option value="10.5">10,5%</option>
                          <option value="0">Exento</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-700">Total:</span>
                        <span className="text-base font-bold text-blue-600 mono">
                          {formatCurrency(
                            (parseFloat(parseInputMonto(modalSubtotal || (selectedItem?.subtotal || selectedItem?.monto || 0))) || 0) *
                            (1 + (parseFloat(modalIva || selectedItem?.iva_porcentaje || 21) / 100))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Fecha *</label>
                      <input name="fecha" type="date" defaultValue={selectedItem?.fecha || new Date().toISOString().split('T')[0]} required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Vencimiento *</label>
                      <input name="vencimiento" type="date" defaultValue={selectedItem?.vencimiento || ''} required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Concepto</label>
                    <input name="concepto" defaultValue={selectedItem?.concepto || ''} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all text-sm">
                      {selectedItem ? 'Guardar' : 'Crear Factura'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobro */}
      {showModal === 'cobro' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-slate-800">{selectedItem ? 'Editar Cobro' : 'Nuevo Cobro'}</h2>
                <button onClick={() => { setShowModal(null); setSelectedItem(null); setModalClienteId(null); setModalFacturaCobroId(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Paso 1: Seleccionar Cliente */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Cliente *</label>
                <select
                  value={selectedItem?.cliente_id || modalClienteId || ''}
                  onChange={(e) => { setModalClienteId(e.target.value ? parseInt(e.target.value) : null); setModalFacturaCobroId(null); }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Paso 2: Resto del formulario (solo si hay cliente) */}
              {(modalClienteId || selectedItem?.cliente_id) && (() => {
                const clienteSeleccionado = selectedItem?.cliente_id || modalClienteId;

                // Calcular NC por factura
                const ncPorFacturaVenta = {};
                notasCreditoVenta.forEach(nc => {
                  if (nc.factura_venta_id) {
                    const key = parseInt(nc.factura_venta_id);
                    ncPorFacturaVenta[key] = (ncPorFacturaVenta[key] || 0) + (parseFloat(nc.monto) || 0);
                  }
                });

                // Calcular cobros por factura
                const cobrosPorFactura = {};
                cobros.forEach(c => {
                  if (c.factura_venta_id) {
                    const key = parseInt(c.factura_venta_id);
                    cobrosPorFactura[key] = (cobrosPorFactura[key] || 0) + (parseFloat(c.monto) || 0);
                  }
                });

                const facturasPendientesCliente = facturasVenta
                  .filter(f => parseInt(f.cliente_id) === parseInt(clienteSeleccionado) && f.estado !== 'cobrada')
                  .map(f => {
                    const fid = parseInt(f.id);
                    const nc = ncPorFacturaVenta[fid] || 0;
                    const cobrado = cobrosPorFactura[fid] || 0;
                    const saldo = (parseFloat(f.monto) || 0) - nc - cobrado;
                    return { ...f, nc, cobrado, saldo };
                  });

                return (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const clienteId = clienteSeleccionado;
                    const facturaId = formData.get('factura_venta_id');
                    const cliente = clientes.find(c => c.id === parseInt(clienteId));
                    const factura = facturasVenta.find(f => f.id === parseInt(facturaId));
                    const fecha = formData.get('fecha');

                    if (selectedItem) {
                      // Editar cobro existente
                      const data = {
                        cliente_id: parseInt(clienteId) || null,
                        factura_venta_id: parseInt(facturaId) || null,
                        descripcion: `${cliente?.nombre || 'Cliente'} - ${factura ? 'Fact. ' + factura.numero : 'Cobro'}`,
                        monto: parseFloat(parseInputMonto(formData.get('monto1'))),
                        fecha: fecha,
                        metodo: formData.get('metodo1')
                      };
                      await updateCobro(selectedItem.id, data);
                    } else {
                      // Crear múltiples cobros si hay varios montos
                      const montos = [
                        { monto: formData.get('monto1'), metodo: formData.get('metodo1') },
                        { monto: formData.get('monto2'), metodo: formData.get('metodo2') },
                        { monto: formData.get('monto3'), metodo: formData.get('metodo3') }
                      ].filter(m => m.monto && parseInputMonto(m.monto));

                      for (const item of montos) {
                        const data = {
                          cliente_id: parseInt(clienteId) || null,
                          factura_venta_id: parseInt(facturaId) || null,
                          descripcion: `${cliente?.nombre || 'Cliente'} - ${factura ? 'Fact. ' + factura.numero : 'Cobro'} (${item.metodo})`,
                          monto: parseFloat(parseInputMonto(item.monto)),
                          fecha: fecha,
                          metodo: item.metodo
                        };
                        await createCobro(data);
                      }
                    }
                    setShowModal(null);
                    setSelectedItem(null);
                    setModalClienteId(null);
                    setModalFacturaCobroId(null);
                  }} className="space-y-2">

                    {/* Factura y Fecha en una fila */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Factura</label>
                        {facturasPendientesCliente.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">Sin facturas pendientes</p>
                        ) : (
                          <select
                            name="factura_venta_id"
                            value={modalFacturaCobroId || selectedItem?.factura_venta_id || ''}
                            onChange={(e) => setModalFacturaCobroId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                          >
                            <option value="">Sin factura</option>
                            {facturasPendientesCliente.map(f => (
                              <option key={f.id} value={f.id}>{f.numero}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Fecha *</label>
                        <input name="fecha" type="date" defaultValue={selectedItem?.fecha || new Date().toISOString().split('T')[0]} required className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
                      </div>
                    </div>

                    {/* Info de factura seleccionada con NC - compacto */}
                    {(() => {
                      const facturaIdSeleccionada = modalFacturaCobroId || selectedItem?.factura_venta_id;
                      const facturaInfo = facturasPendientesCliente.find(f => f.id === facturaIdSeleccionada);
                      if (!facturaInfo) return null;
                      return (
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span><span className="text-slate-600">Total:</span> <span className="font-semibold text-blue-600">{formatCurrency(facturaInfo.monto, false)}</span></span>
                            {facturaInfo.nc > 0 && <span><span className="text-slate-600">NC:</span> <span className="font-semibold text-red-500">-{formatCurrency(facturaInfo.nc, false)}</span></span>}
                            {facturaInfo.cobrado > 0 && <span><span className="text-slate-600">Cobrado:</span> <span className="font-semibold text-emerald-500">-{formatCurrency(facturaInfo.cobrado, false)}</span></span>}
                            <span className="font-medium"><span className="text-slate-700">Saldo:</span> <span className="font-bold text-amber-600">{formatCurrency(facturaInfo.saldo, false)}</span></span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Pagos compactos */}
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-slate-500 w-12">Pago 1</span>
                        <input name="monto1" defaultValue={selectedItem ? formatInputMonto(selectedItem.monto) : ''} placeholder="Monto" required className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" onChange={(e) => e.target.value = formatInputMonto(e.target.value)} />
                        <select name="metodo1" defaultValue={selectedItem?.metodo || 'Transferencia'} className="px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm">
                          <option value="Transferencia">Transferencia</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Mercado Pago">Mercado Pago</option>
                          <option value="Retención">Retención</option>
                          <option value="Tarjeta">Tarjeta</option>
                        </select>
                      </div>
                      {!selectedItem && (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 w-12">Pago 2</span>
                          <input name="monto2" placeholder="Monto" className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" onChange={(e) => e.target.value = formatInputMonto(e.target.value)} />
                          <select name="metodo2" defaultValue="Efectivo" className="px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm">
                            <option value="Transferencia">Transferencia</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Mercado Pago">Mercado Pago</option>
                            <option value="Retención">Retención</option>
                            <option value="Tarjeta">Tarjeta</option>
                          </select>
                        </div>
                      )}
                      {!selectedItem && (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 w-12">Pago 3</span>
                          <input name="monto3" placeholder="Monto" className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" onChange={(e) => e.target.value = formatInputMonto(e.target.value)} />
                          <select name="metodo3" defaultValue="Retención" className="px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm">
                            <option value="Transferencia">Transferencia</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Mercado Pago">Mercado Pago</option>
                            <option value="Retención">Retención</option>
                            <option value="Tarjeta">Tarjeta</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <button type="submit" className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm">
                      {selectedItem ? 'Guardar' : 'Registrar Cobro(s)'}
                    </button>
                  </form>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nota de Crédito de Venta */}
      {showModal === 'nc-venta' && (() => {
        // Usar estados del modal (se inicializan al abrir)
        const clienteNCId = modalClienteId || '';
        const facturaNCId = modalFacturaId || '';

        // Filtrar facturas del cliente seleccionado
        const facturasDelCliente = facturasVenta.filter(f => f.cliente_id === parseInt(clienteNCId));

        // Calcular cobros y NC por factura para determinar saldo
        const saldosPorFactura = {};
        facturasDelCliente.forEach(f => {
          const totalCobros = cobros.filter(c => parseInt(c.factura_venta_id) === f.id).reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
          const totalNC = notasCreditoVenta.filter(nc => parseInt(nc.factura_venta_id) === f.id && nc.id !== selectedItem?.id).reduce((sum, nc) => sum + (parseFloat(nc.monto) || 0), 0);
          const saldo = (parseFloat(f.monto) || 0) - totalCobros - totalNC;
          saldosPorFactura[f.id] = saldo;
        });

        // Calcular NC por factura (excluyendo la NC actual si se está editando)
        const ncPorFacturaVenta = {};
        notasCreditoVenta.forEach(nc => {
          if (nc.factura_venta_id && nc.id !== selectedItem?.id) {
            ncPorFacturaVenta[nc.factura_venta_id] = (ncPorFacturaVenta[nc.factura_venta_id] || 0) + nc.monto;
          }
        });

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">{selectedItem ? 'Editar NC' : 'Nueva Nota de Crédito'}</h2>
                  <button onClick={() => { setShowModal(null); setSelectedItem(null); setModalClienteId(null); setModalFacturaId(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = {
                    cliente_id: parseInt(clienteNCId) || null,
                    factura_venta_id: parseInt(facturaNCId) || null,
                    numero: formData.get('numero'),
                    monto: parseFloat(parseInputMonto(formData.get('monto'))),
                    fecha: formData.get('fecha'),
                    concepto: formData.get('concepto') || ''
                  };

                  if (selectedItem) {
                    await updateNotaCreditoVenta(selectedItem.id, data);
                  } else {
                    await createNotaCreditoVenta(data);
                  }
                  setModalClienteId(null);
                  setModalFacturaId(null);
                }} className="space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
                    <select
                      value={clienteNCId}
                      onChange={(e) => { setModalClienteId(e.target.value ? parseInt(e.target.value) : null); setModalFacturaId(null); }}
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>

                  {clienteNCId && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Factura asociada</label>
                      {facturasDelCliente.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-2">Este cliente no tiene facturas</p>
                      ) : (
                        <select
                          value={facturaNCId}
                          onChange={(e) => setModalFacturaId(e.target.value ? parseInt(e.target.value) : '')}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
                        >
                          <option value="">Sin factura asociada</option>
                          {facturasDelCliente.map(f => {
                            const saldo = saldosPorFactura[f.id] || 0;
                            const tieneNC = ncPorFacturaVenta[f.id] > 0;
                            // Solo mostrar facturas con saldo > $10 (ignorar centavos), o la factura actualmente asociada
                            const esFacturaActual = selectedItem && parseInt(selectedItem.factura_venta_id) === f.id;
                            if (saldo < 10 && !esFacturaActual) return null;
                            return (
                              <option key={f.id} value={f.id}>
                                {f.numero} - Saldo: {formatCurrency(saldo)} {tieneNC ? `[NC: ${formatCurrency(ncPorFacturaVenta[f.id])}]` : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      {facturasDelCliente.length > 0 && facturasDelCliente.every(f => (saldosPorFactura[f.id] || 0) < 10) && !selectedItem?.factura_venta_id && (
                        <p className="text-xs text-amber-600 mt-1">Todas las facturas de este cliente están cobradas</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Número NC *</label>
                      <input name="numero" defaultValue={selectedItem?.numero || ''} required placeholder="NC-0001" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                      <input name="fecha" type="date" defaultValue={selectedItem?.fecha || new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto *</label>
                    <input name="monto" defaultValue={selectedItem ? formatInputMonto(selectedItem.monto) : ''} required placeholder="0" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 text-right" onChange={(e) => e.target.value = formatInputMonto(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
                    <input name="concepto" defaultValue={selectedItem?.concepto || ''} placeholder="Descripción opcional" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500" />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setShowModal(null); setSelectedItem(null); setModalClienteId(null); setModalFacturaId(null); }} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all">
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 transition-all">
                      {selectedItem ? 'Guardar' : 'Crear NC'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Pago Evento */}
      {showModal === 'pago-evento' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Nuevo Pago Evento</h2>
                <button onClick={() => setShowModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  tipo: formData.get('tipo_evento'),
                  descripcion: formData.get('descripcion'),
                  monto: parseFloat(parseInputMonto(formData.get('monto'))),
                  fecha: formData.get('fecha'),
                  metodo: formData.get('metodo'),
                  estado: 'confirmado'
                };
                const { error } = await supabase.from('pagos').insert([data]);
                if (!error) {
                  await fetchPagos();
                  setShowModal(null);
                }
              }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tipo *</label>
                    <select name="tipo_evento" required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm">
                      <option value="evento">Evento Completo</option>
                      <option value="evento_parcial">Evento Parcial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Fecha *</label>
                    <input name="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Descripción *</label>
                  <input name="descripcion" required placeholder="Ej: DJ Fiesta 15/01, Técnica Evento Corporativo" className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Monto *</label>
                    <input name="monto" required placeholder="0" className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm text-right" onChange={(e) => e.target.value = formatInputMonto(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Método *</label>
                    <select name="metodo" required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm">
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Mercado Pago">Mercado Pago</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all text-sm">
                  Registrar Pago
                </button>
              </form>
            </div>
          </div>
        </div>
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
