'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Loader2, ArrowLeft, Filter, Users } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Participant {
  id: string
  name: string
  email: string
  protocol: string
  createdAt: string
  modalityName: string
  categoryName: string
  genderName: string
}

interface FilterOption {
  id: string
  name: string
}

interface FilterOptions {
  modalities: FilterOption[]
  categories: FilterOption[]
  genders: FilterOption[]
}

export default function AtletasInscritosPage() {
  const params = useParams()
  const eventId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    modalities: [],
    categories: [],
    genders: []
  })
  const [eventTitle, setEventTitle] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  // Estados para os filtros selecionados
  const [selectedModality, setSelectedModality] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedGender, setSelectedGender] = useState<string>("all")

  // Função para construir a URL com os filtros
  const buildFilterUrl = useCallback(() => {
    const url = new URL(`/api/events/${eventId}/participants`, window.location.origin)
    
    if (selectedModality && selectedModality !== "all") {
      url.searchParams.append('modalityId', selectedModality)
    }
    
    if (selectedCategory && selectedCategory !== "all") {
      url.searchParams.append('categoryId', selectedCategory)
    }
    
    if (selectedGender && selectedGender !== "all") {
      url.searchParams.append('genderId', selectedGender)
    }
    
    return url.toString()
  }, [eventId, selectedModality, selectedCategory, selectedGender])

  // Função para buscar os participantes com os filtros aplicados
  const fetchParticipants = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(buildFilterUrl())
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar participantes: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Formatar as datas recebidas
      const formattedParticipants = data.participants.map((p: {
        id: string;
        name: string;
        email: string;
        protocol: string;
        createdAt: string;
        modalityName: string;
        categoryName: string;
        genderName: string;
      }) => ({
        ...p,
        createdAt: new Date(p.createdAt).toISOString()
      }))
      
      setParticipants(formattedParticipants)
      setFilterOptions(data.filterOptions)
      setTotalCount(data.totalCount)
      setEventTitle(data.eventTitle)
      setError(null)
    } catch (err) {
      console.error('Erro ao buscar participantes:', err)
      setError('Não foi possível carregar a lista de participantes.')
    } finally {
      setIsLoading(false)
    }
  }, [buildFilterUrl])

  // Buscar participantes quando a página carrega ou os filtros mudam
  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  // Resetar todos os filtros
  const handleResetFilters = () => {
    setSelectedModality("all")
    setSelectedCategory("all")
    setSelectedGender("all")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-red-500">Erro</h1>
        <p>{error}</p>
        <Button asChild>
          <Link href={`/eventos/${eventId}`}>Voltar para o evento</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Cabeçalho */}
      <div className="bg-white border-b">
        <div className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link href={`/eventos/${eventId}`}>
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para o evento
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Atletas Inscritos</h1>
              <p className="text-gray-600">{eventTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">{totalCount} participante(s)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de Modalidade */}
              <div>
                <label className="text-sm font-medium mb-1 block">Modalidade</label>
                <Select value={selectedModality} onValueChange={setSelectedModality}>
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
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                <Select value={selectedGender} onValueChange={setSelectedGender}>
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
            </div>

            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
                disabled={selectedCategory === "all" && selectedGender === "all" && selectedModality === "all"}
              >
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Participantes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Atletas</CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Nenhum atleta encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>Data de Inscrição</TableHead>
                      <TableHead>Protocolo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{participant.name}</TableCell>
                        <TableCell>{participant.modalityName}</TableCell>
                        <TableCell>{participant.categoryName}</TableCell>
                        <TableCell>{participant.genderName}</TableCell>
                        <TableCell>
                          {format(new Date(participant.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{participant.protocol}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
