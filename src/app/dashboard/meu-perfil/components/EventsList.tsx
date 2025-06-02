"use client"

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination-extended'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, ArrowUpDown, Info, ExternalLink, MapPin, User, FileText, Tag, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'

interface Event {
  id: string
  name: string
  date: string
  location: string
  status: string
  registrationStatus: string
  registrationId: string
}

interface RegistrationDetails {
  id: string
  protocol: string | null
  name: string
  email: string
  cpf: string | null
  phone: string | null
  birthdate: string | null
  status: string
  createdAt: string
  modality: string | null
  category: string | null
  gender: string | null
  tier: string | null
  eventName: string
  eventDate: string
  eventLocation: string
}

interface EventsListProps {
  athleteId?: string
}

const EventsList = ({ athleteId }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const eventsPerPage = 10

  const fetchRegistrationDetails = async (registrationId: string) => {
    try {
      setLoadingDetails(true)
      setSelectedRegistration(null)
      
      console.log('Buscando detalhes da inscrição:', registrationId)
      const response = await fetch(`/api/registrations/${registrationId}`)
      
      if (!response.ok) {
        console.error('Resposta não OK:', response.status, response.statusText)
        throw new Error(`Falha ao carregar detalhes da inscrição: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Detalhes da inscrição recebidos:', data)
      
      setSelectedRegistration({
        id: data.id,
        protocol: data.protocol,
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        phone: data.phone,
        birthdate: data.birthdate,
        status: data.status,
        createdAt: data.createdAt,
        modality: data.modalityName,
        category: data.categoryName,
        gender: data.genderName,
        tier: data.tierName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventLocation: data.eventLocation
      })
    } catch (error) {
      console.error('Erro ao carregar detalhes da inscrição:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    let isMounted = true;
    
    const fetchEvents = async () => {
      try {
        setLoading(true)
        console.log('Buscando eventos do usuário...')
        const response = await fetch(`/api/athletes/me/events?page=${currentPage}&limit=${eventsPerPage}`)
        
        if (!response.ok) {
          console.error('Resposta não OK:', response.status, response.statusText)
          throw new Error(`Falha ao carregar eventos: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Eventos recebidos:', data)
        
        if (isMounted) {
          setEvents(data.events || [])
          setTotalPages(Math.ceil(data.total / eventsPerPage))
        }
      } catch (error) {
        console.error('Erro ao carregar eventos:', error)
        if (isMounted) {
          setError('Não foi possível carregar seus eventos. Tente novamente mais tarde.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchEvents()
    
    return () => {
      isMounted = false;
    }
  }, [currentPage])

  // Função para traduzir o status da inscrição
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return <Badge variant="success">Confirmada</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pendente</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Função para traduzir o status do evento
  const getEventStatusBadge = (status: string) => {
    const today = new Date()
    const eventDate = new Date(status)
    
    if (isNaN(eventDate.getTime())) {
      // Se não for uma data válida, tratar como string de status
      switch (status.toUpperCase()) {
        case 'UPCOMING':
          return <Badge className="bg-blue-500">Próximo</Badge>
        case 'ONGOING':
          return <Badge className="bg-green-500">Em andamento</Badge>
        case 'PAST':
          return <Badge variant="secondary">Finalizado</Badge>
        case 'CANCELLED':
          return <Badge variant="destructive">Cancelado</Badge>
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    } else {
      // Se for uma data válida
      if (eventDate > today) {
        return <Badge className="bg-blue-500">Próximo</Badge>
      } else {
        return <Badge variant="secondary">Finalizado</Badge>
      }
    }
  }

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (error) {
      return dateString || 'Data não informada'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando seus eventos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
          <CardDescription>
            Ocorreu um erro ao carregar seus eventos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Eventos</CardTitle>
          <CardDescription>
            Eventos em que você está inscrito
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum evento encontrado</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Você ainda não está inscrito em nenhum evento. Confira os eventos disponíveis e faça sua inscrição!
          </p>
          <Button asChild>
            <Link href="/eventos">Ver Eventos Disponíveis</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Eventos</CardTitle>
        <CardDescription>
          Eventos em que você está inscrito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Evento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status do Evento</TableHead>
                <TableHead>Status da Inscrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={`event-${event.registrationId}`}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{formatDate(event.date)}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{getEventStatusBadge(event.status)}</TableCell>
                  <TableCell>{getStatusBadge(event.registrationStatus)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchRegistrationDetails(event.registrationId)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            <span className="sr-only md:not-sr-only md:inline-block">Detalhes</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Inscrição</DialogTitle>
                            <DialogDescription>
                              Informações detalhadas sobre sua inscrição no evento.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {loadingDetails ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : selectedRegistration ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-start gap-2">
                                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Evento</p>
                                    <p className="text-sm">{selectedRegistration.eventName}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Protocolo</p>
                                    <p className="text-sm">{selectedRegistration.protocol || 'Não disponível'}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Data do Evento</p>
                                    <p className="text-sm">{formatDate(selectedRegistration.eventDate)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Local</p>
                                    <p className="text-sm">{selectedRegistration.eventLocation}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <User className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Inscrito</p>
                                    <p className="text-sm">{selectedRegistration.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedRegistration.email}</p>
                                    {selectedRegistration.cpf && (
                                      <p className="text-xs text-muted-foreground">CPF: {selectedRegistration.cpf}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {(selectedRegistration.modality || selectedRegistration.category) && (
                                  <div className="flex items-start gap-2">
                                    <Tag className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                      <p className="font-medium text-sm">Categoria e Modalidade</p>
                                      {selectedRegistration.modality && (
                                        <p className="text-sm">Modalidade: {selectedRegistration.modality}</p>
                                      )}
                                      {selectedRegistration.category && (
                                        <p className="text-sm">Categoria: {selectedRegistration.category}</p>
                                      )}
                                      {selectedRegistration.gender && (
                                        <p className="text-sm">Gênero: {selectedRegistration.gender}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <p className="font-medium text-sm">Status:</p>
                                  {getStatusBadge(selectedRegistration.status)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center text-muted-foreground">
                              Não foi possível carregar os detalhes da inscrição.
                            </div>
                          )}
                          
                          <DialogFooter className="sm:justify-between">
                            <DialogClose asChild>
                              <Button variant="outline" type="button">
                                Fechar
                              </Button>
                            </DialogClose>
                            
                            <Button asChild>
                              <Link href={`/eventos/${event.id}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ver Evento
                              </Link>
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {event.registrationStatus === 'CONFIRMED' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/inscricao/${event.registrationId}/comprovante`} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span className="sr-only md:not-sr-only md:inline-block">Comprovante</span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(index + 1)
                    }}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  )
}

export default EventsList
