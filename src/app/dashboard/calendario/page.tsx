'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarTable, SearchBar, ActionButtons, Pagination } from './components'
import { useCalendarEvents } from '@/hooks/calendar/useCalendarEvents'
import { useDeleteCalendarEvent } from '@/hooks/calendar/useDeleteCalendarEvent'

export default function DashboardCalendarioPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const pageSize = 10
  
  const { events, isLoading, isError, mutate } = useCalendarEvents()
  
  // Sempre chame os hooks incondicionalmente na raiz do componente
  // Passamos uma string vazia como fallback quando não há ID para deletar
  const { deleteEvent, isDeleting, error: deleteError } = useDeleteCalendarEvent(eventToDelete || 'no-id-to-delete');
  
  // Envolva a execução em uma função que verifica se o ID é válido
  const handleDeleteEvent = useCallback(() => {
    if (eventToDelete) {
      deleteEvent();
    }
  }, [eventToDelete, deleteEvent]);
  
  // Filtragem de eventos baseada na pesquisa
  const filteredEvents = events ? events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.modality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []
  
  // Cálculo da paginação
  useEffect(() => {
    if (filteredEvents) {
      setTotalPages(Math.max(1, Math.ceil(filteredEvents.length / pageSize)))
      // Reset para a primeira página quando o filtro mudar
      if (currentPage > Math.ceil(filteredEvents.length / pageSize)) {
        setCurrentPage(1)
      }
    }
  }, [filteredEvents, pageSize, currentPage])
  
  // Eventos da página atual
  const paginatedEvents = filteredEvents
    ? filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : []
  
  // Efeito para executar a exclusão quando eventToDelete mudar
  useEffect(() => {
    const executeDelete = async () => {
      if (eventToDelete) {
        try {
          await handleDeleteEvent()
          mutate() // Atualiza a lista após a exclusão
        } catch (error) {
          console.error('Erro ao excluir evento:', error)
        } finally {
          setEventToDelete(null) // Limpa o ID após a exclusão
        }
      }
    }
    
    executeDelete()
  }, [eventToDelete, handleDeleteEvent, mutate])
  
  // Função para lidar com a mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  // Função para lidar com a pesquisa
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Voltar para a primeira página ao pesquisar
  }
  
  // Função para lidar com a exclusão
  const handleDelete = async (id: string) => {
    setEventToDelete(id)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Calendário de Eventos</h1>
        <ActionButtons />
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center space-x-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Tabela de eventos */}
      <CalendarTable 
        events={paginatedEvents} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
      />

      {/* Paginação */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={handlePageChange} 
      />
    </div>
  )
}
