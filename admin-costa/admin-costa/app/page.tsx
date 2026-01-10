import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Building2, CalendarDays, Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

const stats = [
  { name: 'Propiedades', value: '12', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Reservas activas', value: '8', icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-100' },
  { name: 'Inquilinos', value: '15', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Ingresos del mes', value: '$45,200', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
]

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general de tu gestión de propiedades"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas reservas */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">Casa Playa Norte</p>
                    <p className="text-sm text-gray-500">Juan Pérez • 15-20 Ene</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Confirmada
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gastos pendientes */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { concepto: 'Electricidad - Casa Centro', monto: '$12,500', vence: '15 Ene' },
                { concepto: 'Gas - Depto Mar', monto: '$8,200', vence: '18 Ene' },
                { concepto: 'Mantenimiento jardín', monto: '$15,000', vence: '20 Ene' },
              ].map((gasto, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{gasto.concepto}</p>
                    <p className="text-sm text-gray-500">Vence: {gasto.vence}</p>
                  </div>
                  <span className="font-semibold text-gray-900">{gasto.monto}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Contrato por vencer</p>
                  <p className="text-sm text-amber-700">El contrato de María González vence en 15 días</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Pago atrasado</p>
                  <p className="text-sm text-red-700">Carlos Ruiz tiene un pago pendiente de 5 días</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
