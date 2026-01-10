import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { Plus, Calendar, User, Home } from 'lucide-react'

const reservas = [
  {
    id: 1,
    propiedad: 'Casa Playa Norte',
    huesped: 'Juan Pérez',
    checkIn: '2025-01-15',
    checkOut: '2025-01-20',
    estado: 'Confirmada',
    monto: '$85,000',
    noches: 5
  },
  {
    id: 2,
    propiedad: 'Depto Centro',
    huesped: 'María García',
    checkIn: '2025-01-18',
    checkOut: '2025-01-25',
    estado: 'Pendiente',
    monto: '$140,000',
    noches: 7
  },
  {
    id: 3,
    propiedad: 'Casa del Bosque',
    huesped: 'Carlos López',
    checkIn: '2025-01-22',
    checkOut: '2025-01-28',
    estado: 'Confirmada',
    monto: '$180,000',
    noches: 6
  },
  {
    id: 4,
    propiedad: 'Monoambiente Mar',
    huesped: 'Ana Martínez',
    checkIn: '2025-02-01',
    checkOut: '2025-02-05',
    estado: 'Cancelada',
    monto: '$60,000',
    noches: 4
  },
]

const estadoVariant = {
  'Confirmada': 'success',
  'Pendiente': 'warning',
  'Cancelada': 'danger',
} as const

export default function ReservasPage() {
  return (
    <div>
      <PageHeader
        title="Reservas"
        description="Administra las reservas de tus propiedades"
      >
        <Button>
          <Plus size={18} />
          Nueva Reserva
        </Button>
      </PageHeader>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Este mes</p>
            <p className="text-2xl font-bold text-gray-900">12 reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">3 reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Ingresos proyectados</p>
            <p className="text-2xl font-bold text-green-600">$465,000</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las reservas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Huésped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Home size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{reserva.propiedad}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-700">{reserva.huesped}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-gray-700">{reserva.checkIn} → {reserva.checkOut}</span>
                        <span className="text-xs text-gray-500">({reserva.noches} noches)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{reserva.monto}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={estadoVariant[reserva.estado as keyof typeof estadoVariant]}>
                        {reserva.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm">Ver</Button>
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
