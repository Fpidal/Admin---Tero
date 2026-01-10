import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { Plus, Filter, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react'

const gastos = [
  {
    id: 1,
    concepto: 'Electricidad',
    propiedad: 'Casa Playa Norte',
    categoria: 'Servicios',
    monto: 12500,
    fecha: '2025-01-10',
    estado: 'Pendiente',
    vencimiento: '2025-01-15'
  },
  {
    id: 2,
    concepto: 'Gas',
    propiedad: 'Depto Centro',
    categoria: 'Servicios',
    monto: 8200,
    fecha: '2025-01-08',
    estado: 'Pagado',
    vencimiento: null
  },
  {
    id: 3,
    concepto: 'Mantenimiento jardín',
    propiedad: 'Casa del Bosque',
    categoria: 'Mantenimiento',
    monto: 15000,
    fecha: '2025-01-05',
    estado: 'Pendiente',
    vencimiento: '2025-01-20'
  },
  {
    id: 4,
    concepto: 'Seguro propiedad',
    propiedad: 'Casa Playa Norte',
    categoria: 'Seguros',
    monto: 45000,
    fecha: '2025-01-01',
    estado: 'Pagado',
    vencimiento: null
  },
  {
    id: 5,
    concepto: 'Reparación aire acondicionado',
    propiedad: 'Monoambiente Mar',
    categoria: 'Reparaciones',
    monto: 28000,
    fecha: '2024-12-28',
    estado: 'Pagado',
    vencimiento: null
  },
]

const estadoVariant = {
  'Pendiente': 'warning',
  'Pagado': 'success',
  'Vencido': 'danger',
} as const

const formatMonto = (monto: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto)
}

export default function GastosPage() {
  const totalPendiente = gastos.filter(g => g.estado === 'Pendiente').reduce((acc, g) => acc + g.monto, 0)
  const totalMes = gastos.reduce((acc, g) => acc + g.monto, 0)

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Control de gastos y pagos de tus propiedades"
      >
        <Button variant="secondary">
          <Filter size={18} />
          Filtrar
        </Button>
        <Button>
          <Plus size={18} />
          Nuevo Gasto
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total pendiente</p>
              <p className="text-2xl font-bold text-red-600">{formatMonto(totalPendiente)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Gastos del mes</p>
              <p className="text-2xl font-bold text-gray-900">{formatMonto(totalMes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">vs. mes anterior</p>
              <p className="text-2xl font-bold text-green-600">-15%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de gastos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{gasto.concepto}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {gasto.propiedad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default">{gasto.categoria}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {gasto.fecha}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                      {formatMonto(gasto.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={estadoVariant[gasto.estado as keyof typeof estadoVariant]}>
                        {gasto.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {gasto.estado === 'Pendiente' ? (
                        <Button variant="primary" size="sm">Pagar</Button>
                      ) : (
                        <Button variant="ghost" size="sm">Ver</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
