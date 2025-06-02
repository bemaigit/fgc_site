'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { DashboardContainer } from '@/components/dashboard/DashboardContainer'
import { IndicatorTable } from '@/components/dashboard/indicators/IndicatorTable'
import { IndicatorForm } from '@/components/dashboard/indicators/IndicatorForm'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/Spinner'
import { Indicator, IndicatorFormData } from '@/types/indicator'

export default function IndicadoresPage() {
  const { status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null)

  // Verificação de autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Carregamento dos indicadores
  useEffect(() => {
    if (status === 'authenticated') {
      fetchIndicators()
    }
  }, [status])

  async function fetchIndicators() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/indicators')
      if (!response.ok) {
        throw new Error('Erro ao carregar indicadores')
      }
      const data = await response.json()
      setIndicators(data)
    } catch (error) {
      toast.error('Erro ao carregar indicadores')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este indicador?')) {
      try {
        const response = await fetch(`/api/indicators/${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          toast.success('Indicador excluído com sucesso')
          fetchIndicators()
        } else {
          toast.error('Erro ao excluir indicador')
        }
      } catch (error) {
        toast.error('Erro ao excluir indicador')
        console.error(error)
      }
    }
  }

  const handleSubmit = async (data: IndicatorFormData, isEditing = false) => {
    try {
      const url = isEditing && editingIndicator ? `/api/indicators/${editingIndicator.id}` : '/api/indicators'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        toast.success(isEditing ? 'Indicador atualizado com sucesso' : 'Indicador criado com sucesso')
        fetchIndicators()
        setIsAddModalOpen(false)
        setEditingIndicator(null)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao processar indicador')
      }
    } catch (error) {
      toast.error('Erro ao processar operação')
      console.error(error)
    }
  }

  return (
    <DashboardContainer
      title="Gerenciamento de Indicadores"
      description="Gerencie os indicadores exibidos na página inicial"
    >
      <div className="mb-6 flex justify-end">
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Novo Indicador
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : indicators.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">Nenhum indicador cadastrado. Clique em &quot;Novo Indicador&quot; para começar.</p>
        </div>
      ) : (
        <IndicatorTable 
          indicators={indicators} 
          onEdit={(indicator: Indicator) => setEditingIndicator(indicator)} 
          onDelete={handleDelete} 
        />
      )}

      {/* Modal de Adição */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4 text-[#08285d]">Novo Indicador</h2>
            <IndicatorForm 
              onSubmit={(data: IndicatorFormData) => handleSubmit(data, false)}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingIndicator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4 text-[#08285d]">Editar Indicador</h2>
            <IndicatorForm 
              initialData={editingIndicator}
              onSubmit={(data: IndicatorFormData) => handleSubmit(data, true)}
              onCancel={() => setEditingIndicator(null)}
            />
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}
