import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { Plus, Phone, Mail, MapPin, Clock, Wrench, Shield, Zap, Droplets, Flame, Wifi, ExternalLink } from 'lucide-react'

const categorias = [
  {
    titulo: 'Emergencias',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-100',
    contactos: [
      { nombre: 'Policía', telefono: '911', descripcion: 'Emergencias policiales' },
      { nombre: 'Bomberos', telefono: '100', descripcion: 'Incendios y rescates' },
      { nombre: 'Emergencias Médicas', telefono: '107', descripcion: 'SAME' },
    ]
  },
  {
    titulo: 'Servicios',
    icon: Zap,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    contactos: [
      { nombre: 'EDEA (Electricidad)', telefono: '0800-222-3332', descripcion: 'Cortes y emergencias eléctricas' },
      { nombre: 'Camuzzi Gas', telefono: '0800-888-2829', descripcion: 'Emergencias de gas' },
      { nombre: 'OSSE (Agua)', telefono: '0800-222-6773', descripcion: 'Cortes y reclamos' },
    ]
  },
  {
    titulo: 'Mantenimiento',
    icon: Wrench,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    contactos: [
      { nombre: 'Carlos Plomero', telefono: '+54 223 555-1234', descripcion: 'Plomería en general' },
      { nombre: 'Roberto Electricista', telefono: '+54 223 555-5678', descripcion: 'Instalaciones eléctricas' },
      { nombre: 'Jardines del Mar', telefono: '+54 223 555-9999', descripcion: 'Mantenimiento de jardines' },
      { nombre: 'Aire Pro', telefono: '+54 223 555-4444', descripcion: 'Aires acondicionados' },
    ]
  },
]

const linksUtiles = [
  { nombre: 'AFIP', url: 'https://www.afip.gob.ar', descripcion: 'Administración Federal de Ingresos Públicos' },
  { nombre: 'ARBA', url: 'https://www.arba.gov.ar', descripcion: 'Agencia de Recaudación Buenos Aires' },
  { nombre: 'Registro de la Propiedad', url: '#', descripcion: 'Consulta de titularidad' },
  { nombre: 'Municipalidad', url: '#', descripcion: 'Trámites municipales' },
]

export default function InfoUtilPage() {
  return (
    <div>
      <PageHeader
        title="Info Útil"
        description="Contactos y recursos importantes para la gestión de propiedades"
      >
        <Button>
          <Plus size={18} />
          Agregar Contacto
        </Button>
      </PageHeader>

      {/* Categorías de contactos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {categorias.map((categoria) => (
          <Card key={categoria.titulo}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${categoria.bg}`}>
                  <categoria.icon className={`w-5 h-5 ${categoria.color}`} />
                </div>
                {categoria.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoria.contactos.map((contacto, idx) => (
                  <div key={idx} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{contacto.nombre}</p>
                      <p className="text-sm text-gray-500">{contacto.descripcion}</p>
                    </div>
                    <a
                      href={`tel:${contacto.telefono}`}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Phone size={14} />
                      {contacto.telefono}
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Links útiles */}
      <Card>
        <CardHeader>
          <CardTitle>Enlaces Útiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {linksUtiles.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{link.nombre}</p>
                  <p className="text-sm text-gray-500">{link.descripcion}</p>
                </div>
                <ExternalLink size={18} className="text-gray-400" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notas Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-600">
            <ul className="space-y-2">
              <li>Recordar verificar vencimiento de matrículas de gas anualmente</li>
              <li>Inspección de matafuegos cada 6 meses</li>
              <li>Renovación de seguros de propiedades antes del vencimiento</li>
              <li>Mantener actualizada la documentación de cada propiedad</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
