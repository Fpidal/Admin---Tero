import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { Plus, User, Phone, Mail, Home, Calendar } from 'lucide-react'

const inquilinos = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@email.com',
    telefono: '+54 223 456-7890',
    propiedad: 'Casa Playa Norte',
    desde: '2024-06-01',
    hasta: '2025-06-01',
    estado: 'Activo',
    deuda: null
  },
  {
    id: 2,
    nombre: 'María García',
    email: 'maria.garcia@email.com',
    telefono: '+54 223 555-1234',
    propiedad: 'Monoambiente Mar',
    desde: '2024-09-15',
    hasta: '2025-09-15',
    estado: 'Activo',
    deuda: '$45,000'
  },
  {
    id: 3,
    nombre: 'Carlos López',
    email: 'carlos.lopez@email.com',
    telefono: '+54 223 666-9999',
    propiedad: null,
    desde: null,
    hasta: null,
    estado: 'Inactivo',
    deuda: null
  },
  {
    id: 4,
    nombre: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    telefono: '+54 223 777-8888',
    propiedad: 'Depto Centro',
    desde: '2024-03-01',
    hasta: '2025-03-01',
    estado: 'Por vencer',
    deuda: null
  },
]

const estadoVariant = {
  'Activo': 'success',
  'Inactivo': 'default',
  'Por vencer': 'warning',
} as const

export default function InquilinosPage() {
  return (
    <div>
      <PageHeader
        title="Inquilinos"
        description="Gestiona tus inquilinos y contratos"
      >
        <Button>
          <Plus size={18} />
          Nuevo Inquilino
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {inquilinos.map((inquilino) => (
          <Card key={inquilino.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{inquilino.nombre}</h3>
                    <Badge variant={estadoVariant[inquilino.estado as keyof typeof estadoVariant]}>
                      {inquilino.estado}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{inquilino.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{inquilino.telefono}</span>
                </div>
                {inquilino.propiedad && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Home size={14} className="text-gray-400" />
                    <span>{inquilino.propiedad}</span>
                  </div>
                )}
                {inquilino.desde && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{inquilino.desde} → {inquilino.hasta}</span>
                  </div>
                )}
              </div>

              {inquilino.deuda && (
                <div className="mt-4 p-3 rounded-lg bg-red-50">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Deuda pendiente:</span> {inquilino.deuda}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  Ver perfil
                </Button>
                <Button variant="ghost" size="sm">
                  Contactar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
