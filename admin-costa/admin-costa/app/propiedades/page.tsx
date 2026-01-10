import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { Plus, MapPin, Bed, Bath, Car } from 'lucide-react'

const propiedades = [
  {
    id: 1,
    nombre: 'Casa Playa Norte',
    direccion: 'Av. Costanera 1234, Mar del Plata',
    tipo: 'Casa',
    habitaciones: 3,
    banos: 2,
    cochera: true,
    estado: 'Alquilada',
    precio: '$85,000/mes'
  },
  {
    id: 2,
    nombre: 'Depto Centro',
    direccion: 'San Martín 567, Piso 4',
    tipo: 'Departamento',
    habitaciones: 2,
    banos: 1,
    cochera: false,
    estado: 'Disponible',
    precio: '$65,000/mes'
  },
  {
    id: 3,
    nombre: 'Casa del Bosque',
    direccion: 'Los Pinos 890, Sierra de los Padres',
    tipo: 'Casa',
    habitaciones: 4,
    banos: 3,
    cochera: true,
    estado: 'Mantenimiento',
    precio: '$120,000/mes'
  },
  {
    id: 4,
    nombre: 'Monoambiente Mar',
    direccion: 'Güemes 234, Mar del Plata',
    tipo: 'Monoambiente',
    habitaciones: 1,
    banos: 1,
    cochera: false,
    estado: 'Alquilada',
    precio: '$45,000/mes'
  },
]

const estadoVariant = {
  'Alquilada': 'success',
  'Disponible': 'info',
  'Mantenimiento': 'warning',
} as const

export default function PropiedadesPage() {
  return (
    <div>
      <PageHeader
        title="Propiedades"
        description="Gestiona tu cartera de propiedades"
      >
        <Button>
          <Plus size={18} />
          Nueva Propiedad
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {propiedades.map((propiedad) => (
          <Card key={propiedad.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-0">
              {/* Imagen placeholder */}
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-xl flex items-center justify-center">
                <span className="text-blue-400 text-sm">Imagen</span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{propiedad.nombre}</h3>
                  <Badge variant={estadoVariant[propiedad.estado as keyof typeof estadoVariant]}>
                    {propiedad.estado}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MapPin size={14} />
                  <span className="truncate">{propiedad.direccion}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Bed size={16} />
                    <span>{propiedad.habitaciones}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath size={16} />
                    <span>{propiedad.banos}</span>
                  </div>
                  {propiedad.cochera && (
                    <div className="flex items-center gap-1">
                      <Car size={16} />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-lg font-bold text-blue-600">{propiedad.precio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
