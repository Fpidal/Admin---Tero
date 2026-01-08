import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, DollarSign, Users, FileText, AlertTriangle, 
  Calendar, Plus, X, Search, ChevronDown, ChevronUp,
  Building2, CreditCard, Clock, CheckCircle, AlertCircle,
  Truck, User, Edit3, Trash2, Filter, Download,
  TrendingUp, TrendingDown, Loader2, LogOut, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from './supabase';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Modal Proveedor
function ModalProveedor({ proveedor, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    cuit: proveedor?.cuit || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    banco: proveedor?.banco || '',
    cbu: proveedor?.cbu || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
            <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">CUIT</label>
            <input type="text" value={form.cuit} onChange={e => setForm({...form, cuit: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" placeholder="XX-XXXXXXXX-X" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
            <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Banco</label>
            <input type="text" value={form.banco} onChange={e => setForm({...form, banco: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">CBU</label>
            <input type="text" value={form.cbu} onChange={e => setForm({...form, cbu: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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
function ModalFactura({ factura, proveedores, onClose, onSave }) {
  const [form, setForm] = useState({
    proveedor_id: factura?.proveedor_id || '',
    numero: factura?.numero || '',
    monto: factura?.monto || '',
    fecha: factura?.fecha || new Date().toISOString().split('T')[0],
    vencimiento: factura?.vencimiento || '',
    estado: factura?.estado || 'pendiente',
    concepto: factura?.concepto || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, monto: parseFloat(form.monto) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{factura ? 'Editar Factura' : 'Nueva Factura'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Proveedor *</label>
            <select required value={form.proveedor_id} onChange={e => setForm({...form, proveedor_id: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
              <option value="">Seleccionar proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Número de Factura *</label>
            <input type="text" required value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" placeholder="A-0001-00000001" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Monto *</label>
            <input type="number" required min="0" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Fecha *</label>
              <input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Vencimiento *</label>
              <input type="date" required value={form.vencimiento} onChange={e => setForm({...form, vencimiento: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Concepto</label>
            <input type="text" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="flex gap-3 pt-4">
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
function ModalEmpleado({ empleado, onClose, onSave }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, sueldo: parseFloat(form.sueldo) });
    setSaving(false);
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
            <input type="number" required min="0" step="0.01" value={form.sueldo} onChange={e => setForm({...form, sueldo: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
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
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {empleado ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Pago
function ModalPago({ onClose, onSave, tipoDefault, proveedores = [], empleados = [] }) {
  const [form, setForm] = useState({
    tipo: tipoDefault || 'otro',
    referencia_id: '',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'Transferencia'
  });
  const [saving, setSaving] = useState(false);

  const getTitulo = () => {
    if (tipoDefault === 'factura') return 'Registrar Pago a Proveedor';
    if (tipoDefault === 'sueldo') return 'Registrar Pago a Empleado';
    return 'Registrar Pago';
  };

  const handleProveedorChange = (proveedorId) => {
    const proveedor = proveedores.find(p => p.id === parseInt(proveedorId));
    setForm({
      ...form,
      referencia_id: proveedorId,
      descripcion: proveedor ? `Pago a ${proveedor.nombre}` : ''
    });
  };

  const handleEmpleadoChange = (empleadoId) => {
    const empleado = empleados.find(e => e.id === parseInt(empleadoId));
    setForm({
      ...form,
      referencia_id: empleadoId,
      descripcion: empleado ? `Sueldo - ${empleado.nombre}` : '',
      monto: empleado ? empleado.sueldo : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, monto: parseFloat(form.monto) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{getTitulo()}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tipoDefault === 'factura' && (
            <div>
              <label className="block text-sm text-slate-500 mb-1">Proveedor *</label>
              <select required value={form.referencia_id} onChange={e => handleProveedorChange(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
                <option value="">Seleccionar proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
          {tipoDefault === 'sueldo' && (
            <div>
              <label className="block text-sm text-slate-500 mb-1">Empleado *</label>
              <select required value={form.referencia_id} onChange={e => handleEmpleadoChange(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
                <option value="">Seleccionar empleado</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} - {e.puesto || 'Sin puesto'}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-500 mb-1">Descripción *</label>
            <input type="text" required value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Monto *</label>
            <input type="number" required min="0" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha *</label>
            <input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Método</label>
            <select value={form.metodo} onChange={e => setForm({...form, metodo: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50">
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Cheque">Cheque</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar
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
  const [loading, setLoading] = useState(true);

  // Modales
  const [showModal, setShowModal] = useState(null); // 'proveedor', 'factura', 'empleado', 'pago'
  const [selectedItem, setSelectedItem] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroMesPago, setFiltroMesPago] = useState('todos');
  const [filtroTipoPago, setFiltroTipoPago] = useState('todos');

  // Cargar datos desde Supabase
  const fetchProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('nombre');
    if (!error) setProveedores(data || []);
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
    if (!error) setPagos(data || []);
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchProveedores(), fetchFacturas(), fetchEmpleados(), fetchPagos()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // CRUD Proveedores
  const createProveedor = async (proveedor) => {
    const { error } = await supabase.from('proveedores').insert([proveedor]);
    if (!error) {
      await fetchProveedores();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const updateProveedor = async (id, proveedor) => {
    const { error } = await supabase.from('proveedores').update(proveedor).eq('id', id);
    if (!error) {
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

  const deleteFactura = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;
    const { error } = await supabase.from('facturas').delete().eq('id', id);
    if (!error) await fetchFacturas();
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
    const { error } = await supabase.from('pagos').insert([pago]);
    if (!error) {
      await fetchPagos();
      setShowModal(null);
      setSelectedItem(null);
    }
    return { error };
  };

  const deletePago = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;
    const { error } = await supabase.from('pagos').delete().eq('id', id);
    if (!error) await fetchPagos();
  };

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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 overflow-x-auto">
        <div className="flex gap-2 p-1 glass rounded-2xl w-fit min-w-full sm:min-w-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'facturas', label: 'Facturas', icon: FileText },
            { id: 'proveedores', label: 'Proveedores', icon: Building2 },
            { id: 'pago-proveedores', label: 'Pago Proveedores', icon: DollarSign },
            { id: 'empleados', label: 'Empleados', icon: Users },
            { id: 'pago-empleados', label: 'Pago Empleados', icon: DollarSign },
            { id: 'pagos', label: 'Pagos', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'tab-active text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
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
                        <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
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
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 w-full sm:w-64"
                  />
                </div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="pagada">Pagadas</option>
                  <option value="vencida">Vencidas</option>
                </select>
              </div>
              <button
                onClick={() => { setSelectedItem(null); setShowModal('factura'); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all w-full sm:w-auto justify-center"
              >
                <Plus className="w-5 h-5" />
                Nueva Factura
              </button>
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
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasFiltradas.map(f => {
                      const dias = getDiasVencimiento(f.vencimiento);
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium badge-${f.estado}`}>
                              {f.estado.charAt(0).toUpperCase() + f.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold mono">{formatCurrency(f.monto)}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {f.estado !== 'pagada' && (
                                <button onClick={() => marcarFacturaPagada(f)} className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400" title="Marcar como pagada">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => { setSelectedItem(f); setShowModal('factura'); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteFactura(f.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Eliminar">
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
                onClick={() => { setSelectedItem(null); setShowModal('proveedor'); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nuevo Proveedor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proveedores.map(p => (
                <div key={p.id} className="glass rounded-2xl p-5 glow hover:border-blue-500/30 border border-transparent transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedItem(p); setShowModal('proveedor'); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProveedor(p.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{p.nombre}</h3>
                  <p className="text-sm text-slate-400 mb-3">CUIT: {p.cuit || '-'}</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">Tel: {p.telefono || '-'}</p>
                    <p className="text-slate-400">Email: {p.email || '-'}</p>
                    <p className="text-slate-400">Banco: {p.banco || '-'}</p>
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
                onClick={() => { setSelectedItem(null); setShowModal('empleado'); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nuevo Empleado
              </button>
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
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map(e => (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                              <span className="text-sm font-medium">{e.nombre.split(' ').map(n => n[0]).join('')}</span>
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
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => pagarSueldo(e)} className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400" title="Pagar sueldo">
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedItem(e); setShowModal('empleado'); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteEmpleado(e.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Eliminar">
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

        {/* Pago Proveedores */}
        {activeTab === 'pago-proveedores' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Pago a Proveedores</h2>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-slate-500">Total pagado</p>
                  <p className="text-xl font-bold text-emerald-500 mono">{formatCurrency(pagos.filter(p => p.tipo === 'factura').reduce((sum, p) => sum + p.monto, 0))}</p>
                </div>
                <button
                  onClick={() => { setSelectedItem({ tipo: 'factura' }); setShowModal('pago'); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Registrar Pago
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-200">
                      <th className="px-5 py-4 font-medium">Fecha</th>
                      <th className="px-5 py-4 font-medium">Proveedor / Factura</th>
                      <th className="px-5 py-4 font-medium">Método</th>
                      <th className="px-5 py-4 font-medium text-right">Monto</th>
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.filter(p => p.tipo === 'factura').length === 0 ? (
                      <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-400">No hay pagos a proveedores registrados</td></tr>
                    ) : (
                      pagos.filter(p => p.tipo === 'factura').map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 text-sm">{formatDate(p.fecha)}</td>
                          <td className="px-5 py-4 text-sm">{p.descripcion}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{p.metodo}</td>
                          <td className="px-5 py-4 text-right font-semibold mono text-emerald-500">{formatCurrency(p.monto)}</td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => deletePago(p.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Pago a Empleados</h2>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-slate-500">Total pagado</p>
                  <p className="text-xl font-bold text-emerald-500 mono">{formatCurrency(pagos.filter(p => p.tipo === 'sueldo').reduce((sum, p) => sum + p.monto, 0))}</p>
                </div>
                <button
                  onClick={() => { setSelectedItem({ tipo: 'sueldo' }); setShowModal('pago'); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Registrar Pago
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-200">
                      <th className="px-5 py-4 font-medium">Fecha</th>
                      <th className="px-5 py-4 font-medium">Empleado / Concepto</th>
                      <th className="px-5 py-4 font-medium">Método</th>
                      <th className="px-5 py-4 font-medium text-right">Monto</th>
                      <th className="px-5 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.filter(p => p.tipo === 'sueldo').length === 0 ? (
                      <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-400">No hay pagos a empleados registrados</td></tr>
                    ) : (
                      pagos.filter(p => p.tipo === 'sueldo').map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 text-sm">{formatDate(p.fecha)}</td>
                          <td className="px-5 py-4 text-sm">{p.descripcion}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{p.metodo}</td>
                          <td className="px-5 py-4 text-right font-semibold mono text-emerald-500">{formatCurrency(p.monto)}</td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => deletePago(p.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold">Consulta de Pagos</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <select
                  value={filtroMesPago}
                  onChange={(e) => setFiltroMesPago(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="todos">Todos los meses</option>
                  {MESES.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
                <select
                  value={filtroTipoPago}
                  onChange={(e) => setFiltroTipoPago(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="factura">Proveedores</option>
                  <option value="sueldo">Empleados</option>
                </select>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-slate-500">Total Proveedores</p>
                <p className="text-2xl font-bold text-blue-500 mono">
                  {formatCurrency(pagos
                    .filter(p => p.tipo === 'factura')
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-slate-500">Total Empleados</p>
                <p className="text-2xl font-bold text-cyan-500 mono">
                  {formatCurrency(pagos
                    .filter(p => p.tipo === 'sueldo')
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-slate-500">Total General</p>
                <p className="text-2xl font-bold text-emerald-500 mono">
                  {formatCurrency(pagos
                    .filter(p => filtroTipoPago === 'todos' || p.tipo === filtroTipoPago)
                    .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                    .reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl glow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-200">
                      <th className="px-5 py-4 font-medium">Fecha</th>
                      <th className="px-5 py-4 font-medium">Tipo</th>
                      <th className="px-5 py-4 font-medium">Descripción</th>
                      <th className="px-5 py-4 font-medium">Método</th>
                      <th className="px-5 py-4 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos
                      .filter(p => filtroTipoPago === 'todos' || p.tipo === filtroTipoPago)
                      .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                      .length === 0 ? (
                      <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-400">No hay pagos con los filtros seleccionados</td></tr>
                    ) : (
                      pagos
                        .filter(p => filtroTipoPago === 'todos' || p.tipo === filtroTipoPago)
                        .filter(p => filtroMesPago === 'todos' || new Date(p.fecha).getMonth() === parseInt(filtroMesPago))
                        .map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 text-sm">{formatDate(p.fecha)}</td>
                            <td className="px-5 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                p.tipo === 'factura' ? 'bg-blue-500/15 text-blue-700' : 'bg-cyan-500/15 text-cyan-700'
                              }`}>
                                {p.tipo === 'factura' ? 'Proveedor' : 'Empleado'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm">{p.descripcion}</td>
                            <td className="px-5 py-4 text-sm text-slate-500">{p.metodo}</td>
                            <td className="px-5 py-4 text-right font-semibold mono text-emerald-500">{formatCurrency(p.monto)}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Proveedor */}
      {showModal === 'proveedor' && (
        <ModalProveedor
          proveedor={selectedItem}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data) => updateProveedor(selectedItem.id, data) : createProveedor}
        />
      )}

      {/* Modal Factura */}
      {showModal === 'factura' && (
        <ModalFactura
          factura={selectedItem}
          proveedores={proveedores}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data) => updateFactura(selectedItem.id, data) : createFactura}
        />
      )}

      {/* Modal Empleado */}
      {showModal === 'empleado' && (
        <ModalEmpleado
          empleado={selectedItem}
          onClose={() => { setShowModal(null); setSelectedItem(null); }}
          onSave={selectedItem ? (data) => updateEmpleado(selectedItem.id, data) : createEmpleado}
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
