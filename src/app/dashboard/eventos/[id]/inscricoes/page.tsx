'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, Filter, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { exportToCSV } from '@/utils/csv-export'
import { use } from 'react'

interface PageProps {
  params: {
    id: string
  }
}

interface FilterOptions {
  modalities: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  genders: { id: string; name: string }[]
}

interface Registration {
  id: string
  protocol: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
  modalityName: string
  categoryName: string
  genderName: string
  User: {
    id: string
    name: string
    email: string
    Athlete?: {
      id: string
      fullName: string
      cpf: string
      phone: string
    }
  }
}

const statusColors = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'destructive'
} as const

export default function EventRegistrationsPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Usando React.use() para desempacotar params corretamente
  const eventId = use(params).id
  
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalityFilter, setModalityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    modalities: [],
    categories: [],
    genders: []
  })
  const [filtersActive, setFiltersActive] = useState(false)

  // Fetch do evento
  const { data: eventData } = useSWR(
    `/api/events/${eventId}`,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erro ao carregar evento')
      return res.json()
    }
  )

  // Construir URL com filtros
  const buildFilterUrl = () => {
    const url = new URL(`/api/events/${eventId}/registrations`, window.location.origin)
    
    if (statusFilter !== 'all') {
      url.searchParams.append('status', statusFilter)
    }
    
    if (modalityFilter !== 'all') {
      url.searchParams.append('modalityId', modalityFilter)
    }
    
    if (categoryFilter !== 'all') {
      url.searchParams.append('categoryId', categoryFilter)
    }
    
    if (genderFilter !== 'all') {
      url.searchParams.append('genderId', genderFilter)
    }
    
    return url.toString()
  }

  // Verificar se há filtros ativos
  useEffect(() => {
    const activeFilters = statusFilter !== 'all' || 
                          modalityFilter !== 'all' || 
                          categoryFilter !== 'all' || 
                          genderFilter !== 'all'
    setFiltersActive(activeFilters)
  }, [statusFilter, modalityFilter, categoryFilter, genderFilter])

  // Fetch das inscrições
  const { data: registrationsData, mutate } = useSWR(
    buildFilterUrl(),
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erro ao carregar inscrições')
      return res.json()
    }
  )

  // Atualizar opções de filtro quando os dados são carregados
  useEffect(() => {
    if (registrationsData?.filterOptions) {
      setFilterOptions(registrationsData.filterOptions)
    }
  }, [registrationsData])

  // Handler para atualizar status
  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, status: newStatus })
      })

      if (!res.ok) throw new Error('Erro ao atualizar status')

      toast({
        title: 'Status atualizado',
        description: 'O status da inscrição foi atualizado com sucesso!',
      })

      mutate() // Recarrega a lista

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o status.',
      })
    }
  }

  // Resetar todos os filtros
  const handleResetFilters = () => {
    setStatusFilter('all')
    setModalityFilter('all')
    setCategoryFilter('all')
    setGenderFilter('all')
  }

  // Exportar dados para CSV
  const handleExportCSV = () => {
    if (!registrationsData?.data || registrationsData.data.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não há inscrições para exportar.'
      })
      return
    }

    try {
      // Preparar dados para exportação
      const csvData = registrationsData.data.map((registration: Registration) => {
        // Formatação da data
        const formattedDate = format(new Date(registration.createdAt), "dd/MM/yyyy HH:mm");
        
        // Tradução do status
        const statusTranslated = 
          registration.status === 'PENDING' ? 'Pendente' :
          registration.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado';
        
        return {
          protocol: registration.protocol,
          athleteName: registration.User.Athlete?.fullName || registration.User.name,
          email: registration.User.email,
          phone: registration.User.Athlete?.phone || '',
          modalityName: registration.modalityName || '',
          categoryName: registration.categoryName || '',
          genderName: registration.genderName || '',
          createdAt: formattedDate,
          status: statusTranslated
        };
      });

      // Cabeçalhos para o CSV
      const headers = {
        protocol: 'Protocolo',
        athleteName: 'Atleta',
        email: 'Email',
        phone: 'Telefone',
        modalityName: 'Modalidade',
        categoryName: 'Categoria',
        genderName: 'Gênero',
        createdAt: 'Data de Inscrição',
        status: 'Status'
      };

      // Nome do arquivo baseado no título do evento e data atual
      const eventTitle = eventData?.title || 'evento';
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const filename = `inscricoes-${eventTitle.toLowerCase().replace(/\s+/g, '-')}-${currentDate}`;

      // Exportar para CSV
      exportToCSV(csvData, headers, filename);

      toast({
        title: 'Sucesso',
        description: 'Arquivo CSV gerado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao gerar o arquivo CSV.'
      });
    }
  };

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Inscrições - {eventData?.title}
            </h1>
            <p className="text-muted-foreground">
              {eventData?.date && format(new Date(eventData.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Exportar CSV */}
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="flex items-center gap-2"
            disabled={!registrationsData?.data || registrationsData.data.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>

          {/* Painel de filtros lateral */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant={filtersActive ? "default" : "outline"} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
                {filtersActive && <Badge variant="secondary" className="ml-2">Filtros ativos</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                {/* Filtro de Status */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendentes</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmados</SelectItem>
                      <SelectItem value="CANCELLED">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Modalidade */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Modalidade</label>
                  <Select value={modalityFilter} onValueChange={setModalityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as modalidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as modalidades</SelectItem>
                      {filterOptions.modalities.map(modality => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Categoria */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Categoria</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {filterOptions.categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Gênero */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Gênero</label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os gêneros" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os gêneros</SelectItem>
                      {filterOptions.genders.map(gender => (
                        <SelectItem key={gender.id} value={gender.id}>
                          {gender.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleResetFilters}
                    disabled={!filtersActive}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tabela de Inscrições */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Atleta</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Gênero</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrationsData?.data.map((registration: Registration) => (
              <TableRow key={registration.id}>
                <TableCell className="font-mono">
                  {registration.protocol}
                </TableCell>
                <TableCell>
                  {registration.User.Athlete?.fullName || registration.User.name}
                </TableCell>
                <TableCell>
                  <div>{registration.User.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {registration.User.Athlete?.phone}
                  </div>
                </TableCell>
                <TableCell>{registration.modalityName}</TableCell>
                <TableCell>{registration.categoryName}</TableCell>
                <TableCell>{registration.genderName}</TableCell>
                <TableCell>
                  {format(new Date(registration.createdAt), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[registration.status as keyof typeof statusColors]}>
                    {registration.status === 'PENDING' && 'Pendente'}
                    {registration.status === 'CONFIRMED' && 'Confirmado'}
                    {registration.status === 'CANCELLED' && 'Cancelado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={registration.status}
                    onValueChange={(value) => handleStatusChange(registration.id, value)}
                    disabled={registration.status === 'CANCELLED'}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmar</SelectItem>
                      <SelectItem value="CANCELLED">Cancelar</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {(!registrationsData?.data || registrationsData.data.length === 0) && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Nenhuma inscrição encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
