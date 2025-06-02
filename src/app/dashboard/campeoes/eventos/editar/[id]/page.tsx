// Server Component
import EditarEventoClient from './EditarEventoClient'

export default function EditarEventoPage({ params }: { params: { id: string } }) {
  return <EditarEventoClient id={params.id} />
}
