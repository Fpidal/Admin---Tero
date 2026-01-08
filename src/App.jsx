import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, DollarSign, Users, FileText, AlertTriangle, 
  Calendar, Plus, X, Search, ChevronDown, ChevronUp,
  Building2, CreditCard, Clock, CheckCircle, AlertCircle,
  Truck, User, Edit3, Trash2, Filter, Download,
  TrendingUp, TrendingDown, Loader2, LogOut, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// import { supabase } from './supabase';

// Datos de ejemplo (después se conectan a Supabase)
const datosEjemplo = {
  proveedores: [
    { id: 1, nombre: 'Distribuidora Norte', cuit: '30-12345678-9', telefono: '11-4567-8901', email: 'contacto@distnorte.com', banco: 'Galicia', cbu: '0070000000000000001' },
    { id: 2, nombre: 'Carnes Premium', cuit: '30-98765432-1', telefono: '11-5678-9012', email: 'ventas@carnespremium.com', banco: 'Santander', cbu: '0720000000000000002' },
    { id: 3, nombre: 'Bebidas del Sur', cuit: '30-11223344-5', telefono: '11-6789-0123', email: 'pedidos@bebidasdelsur.com', banco: 'BBVA', cbu: '0170000000000000003' },
  ],
  facturas: [
    { id: 1, proveedor_id: 1, proveedor: 'Distribuidora Norte', numero: 'A-0001-00001234', monto: 450000, fecha: '2026-01-05', vencimiento: '2026-01-20', estado: 'pendiente', concepto: 'Insumos varios' },
    { id: 2, proveedor_id: 2, proveedor: 'Carnes Premium', numero: 'A-0002-00005678', monto: 780000, fecha: '2026-01-03', vencimiento: '2026-01-10', estado: 'vencida', concepto: 'Carnes para eventos' },
    { id: 3, proveedor_id: 3, proveedor: 'Bebidas del Sur', numero: 'B-0001-00009999', monto: 320000, fecha: '2025-12-28', vencimiento: '2026-01-15', estado: 'pagada', concepto: 'Bebidas mes diciembre' },
    { id: 4, proveedor_id: 1, proveedor: 'Distribuidora Norte', numero: 'A-0001-00001235', monto: 180000, fecha: '2026-01-08', vencimiento: '2026-01-25', estado: 'pendiente', concepto: 'Descartables' },
  ],
  empleados: [
    { id: 1, nombre: 'Juan Pérez', documento: '25.678.901', puesto: 'Mozo', sueldo: 450000, fecha_ingreso: '2023-03-15', banco: 'Galicia', cbu: '0070000000000000101' },
    { id: 2, nombre: 'María García', documento: '28.901.234', puesto: 'Cocinera', sueldo: 520000, fecha_ingreso: '2022-08-01', banco: 'Nación', cbu: '0110000000000000102' },
    { id: 3, nombre: 'Carlos López', documento: '30.123.456', puesto: 'Encargado', sueldo: 680000, fecha_ingreso: '2021-01-10', banco: 'Macro', cbu: '0290000000000000103' },
    { id: 4, nombre: 'Ana Rodríguez', documento: '32.456.789', puesto: 'Moza', sueldo: 450000, fecha_ingreso: '2024-06-01', banco: 'Galicia', cbu: '0070000000000000104' },
  ],
  pagos: [
    { id: 1, tipo: 'factura', referencia_id: 3, descripcion: 'Pago Bebidas del Sur - Factura B-0001-00009999', monto: 320000, fecha: '2026-01-05', metodo: 'Transferencia' },
    { id: 2, tipo: 'sueldo', referencia_id: 1, descripcion: 'Sueldo Enero - Juan Pérez', monto: 450000, fecha: '2026-01-05', metodo: 'Transferencia' },
    { id: 3, tipo: 'sueldo', referencia_id: 2, descripcion: 'Sueldo Enero - María García', monto: 520000, fecha: '2026-01-05', metodo: 'Transferencia' },
  ]
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [proveedores, setProveedores] = useState(datosEjemplo.proveedores);
  const [facturas, setFacturas] = useState(datosEjemplo.facturas);
  const [empleados, setEmpleados] = useState(datosEjemplo.empleados);
  const [pagos, setPagos] = useState(datosEjemplo.pagos);
  const [loading, setLoading] = useState(false);
  
  // Modales
  const [showModal, setShowModal] = useState(null); // 'proveedor', 'factura', 'empleado', 'pago'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Stats calculados
  const stats = useMemo(() => {
    const facturasPendientes = facturas.filter(f => f.estado === 'pendiente');
    const facturasVencidas = facturas.filter(f => f.estado === 'vencida');
    const totalPendiente = facturasPendientes.reduce((sum, f) => sum + f.monto, 0);
    const totalVencido = facturasVencidas.reduce((sum, f) => sum + f.monto, 0);
    const totalSueldos = empleados.reduce((sum, e) => sum + e.sueldo, 0);
    const totalPagadoMes = pagos.reduce((sum, p) => sum + p.monto, 0);
    
    return {
      facturasPendientes: facturasPendientes.length,
      facturasVencidas: facturasVencidas.length,
      totalPendiente,
      totalVencido,
      totalSueldos,
      totalPagadoMes,
      totalProveedores: proveedores.length,
      totalEmpleados: empleados.length
    };
  }, [facturas, empleados, pagos, proveedores]);

  // Facturas próximas a vencer (7 días)
  const facturasProximas = useMemo(() => {
    const hoy = new Date();
    const en7dias = new Date();
    en7dias.setDate(hoy.getDate() + 7);
    
    return facturas
      .filter(f => f.estado === 'pendiente')
      .filter(f => {
        const venc = new Date(f.vencimiento + 'T12:00:00');
        return venc >= hoy && venc <= en7dias;
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

  // Facturas filtradas
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      const matchSearch = f.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.numero.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = filtroEstado === 'todos' || f.estado === filtroEstado;
      return matchSearch && matchEstado;
    });
  }, [facturas, searchTerm, filtroEstado]);

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
      <header className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center glow">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Administración Tero
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">Gestión Financiera</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 overflow-x-auto">
        <div className="flex gap-2 p-1 glass rounded-2xl w-fit min-w-full sm:min-w-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'facturas', label: 'Facturas', icon: FileText },
            { id: 'proveedores', label: 'Proveedores', icon: Building2 },
            { id: 'empleados', label: 'Empleados', icon: Users },
            { id: 'pagos', label: 'Pagos', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'tab-active text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
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
                    <p className="text-lg sm:text-2xl font-bold mono">{formatCurrency(stats.totalSueldos)}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.totalEmpleados} empleados</p>
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

            {/* Alertas y Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Próximos vencimientos */}
              <div className="glass rounded-2xl p-5 glow">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  Próximos Vencimientos
                </h3>
                {facturasProximas.length === 0 ? (
                  <p className="text-slate-400 text-sm">No hay facturas por vencer en los próximos 7 días</p>
                ) : (
                  <div className="space-y-3">
                    {facturasProximas.slice(0, 5).map(f => {
                      const dias = getDiasVencimiento(f.vencimiento);
                      return (
                        <div key={f.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">{f.proveedor}</p>
                            <p className="text-xs text-slate-400">{f.numero}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold mono text-sm">{formatCurrency(f.monto)}</p>
                            <p className={`text-xs ${dias.clase}`}>{dias.texto}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gráfico por proveedor */}
              <div className="glass rounded-2xl p-5 glow">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" />
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
                    <tr className="text-left text-slate-400 text-sm border-b border-white/10">
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Descripción</th>
                      <th className="pb-3 font-medium">Método</th>
                      <th className="pb-3 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.slice(0, 5).map(p => (
                      <tr key={p.id} className="border-b border-white/5">
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar factura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 w-full sm:w-64"
                  />
                </div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="pagada">Pagadas</option>
                  <option value="vencida">Vencidas</option>
                </select>
              </div>
              <button
                onClick={() => setShowModal('factura')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all w-full sm:w-auto justify-center"
              >
                <Plus className="w-5 h-5" />
                Nueva Factura
              </button>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-white/10">
                      <th className="px-5 py-4 font-medium">Proveedor</th>
                      <th className="px-5 py-4 font-medium">Número</th>
                      <th className="px-5 py-4 font-medium">Concepto</th>
                      <th className="px-5 py-4 font-medium">Vencimiento</th>
                      <th className="px-5 py-4 font-medium">Estado</th>
                      <th className="px-5 py-4 font-medium text-right">Monto</th>
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasFiltradas.map(f => {
                      const dias = getDiasVencimiento(f.vencimiento);
                      return (
                        <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium badge-${f.estado}`}>
                              {f.estado.charAt(0).toUpperCase() + f.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold mono">{formatCurrency(f.monto)}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {f.estado !== 'pagada' && (
                                <button className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400" title="Marcar como pagada">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Editar">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Proveedores</h2>
              <button
                onClick={() => setShowModal('proveedor')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nuevo Proveedor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proveedores.map(p => (
                <div key={p.id} className="glass rounded-2xl p-5 glow hover:border-purple-500/30 border border-transparent transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex gap-1">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{p.nombre}</h3>
                  <p className="text-sm text-slate-400 mb-3">CUIT: {p.cuit}</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">📞 {p.telefono}</p>
                    <p className="text-slate-400">✉️ {p.email}</p>
                    <p className="text-slate-400">🏦 {p.banco}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empleados */}
        {activeTab === 'empleados' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Empleados</h2>
              <button
                onClick={() => setShowModal('empleado')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nuevo Empleado
              </button>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-white/10">
                      <th className="px-5 py-4 font-medium">Nombre</th>
                      <th className="px-5 py-4 font-medium">Documento</th>
                      <th className="px-5 py-4 font-medium">Puesto</th>
                      <th className="px-5 py-4 font-medium">Ingreso</th>
                      <th className="px-5 py-4 font-medium">Banco</th>
                      <th className="px-5 py-4 font-medium text-right">Sueldo</th>
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map(e => (
                      <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                              <span className="text-sm font-medium">{e.nombre.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <span className="font-medium">{e.nombre}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400">{e.documento}</td>
                        <td className="px-5 py-4 text-sm">{e.puesto}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{formatDate(e.fecha_ingreso)}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{e.banco}</td>
                        <td className="px-5 py-4 text-right font-semibold mono">{formatCurrency(e.sueldo)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400" title="Pagar sueldo">
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Editar">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen de sueldos */}
            <div className="glass rounded-2xl p-5 glow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Total Sueldos Mensuales</h3>
                  <p className="text-slate-400 text-sm">{empleados.length} empleados</p>
                </div>
                <p className="text-3xl font-bold mono text-emerald-400">{formatCurrency(stats.totalSueldos)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pagos */}
        {activeTab === 'pagos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Historial de Pagos</h2>
              <button
                onClick={() => setShowModal('pago')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Registrar Pago
              </button>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-white/10">
                      <th className="px-5 py-4 font-medium">Fecha</th>
                      <th className="px-5 py-4 font-medium">Tipo</th>
                      <th className="px-5 py-4 font-medium">Descripción</th>
                      <th className="px-5 py-4 font-medium">Método</th>
                      <th className="px-5 py-4 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 text-sm">{formatDate(p.fecha)}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.tipo === 'factura' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {p.tipo === 'factura' ? 'Factura' : 'Sueldo'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm">{p.descripcion}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{p.metodo}</td>
                        <td className="px-5 py-4 text-right font-semibold mono text-emerald-400">
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
      </main>
    </div>
  );
}

export default App;
