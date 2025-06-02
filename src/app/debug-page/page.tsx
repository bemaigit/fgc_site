"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Função para buscar dados do perfil
  const fetchProfileData = async () => {
    if (status === 'loading') return
    
    try {
      setLoading(true)
      console.log('Buscando dados do perfil...')
      const response = await fetch(`/api/athletes/me`)
      
      console.log('Status da resposta:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(`Falha ao carregar dados: ${response.status} ${errorData.error || ''}`)
      }
      
      const data = await response.json()
      console.log('Dados recebidos:', data)
      setProfileData(data)
    } catch (error: any) {
      console.error('Erro:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchProfileData()
  }, [session, status])
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4">Carregando dados...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-500">Erro</h1>
        <p className="mt-2">{error}</p>
        <Button onClick={fetchProfileData} className="mt-4">Tentar novamente</Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico do Perfil</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Usuário Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">ID</h3>
              <p className="font-medium">{session?.user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status de Dirigente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">É Dirigente?</h3>
              <p className="font-medium">{profileData?.isManager ? 'SIM' : 'NÃO'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">ID do Clube Gerenciado</h3>
              <p className="font-medium">{profileData?.managedClub?.id || 'Nenhum'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nome do Clube Gerenciado</h3>
              <p className="font-medium">{profileData?.managedClub?.clubName || 'Nenhum'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Quantidade de Atletas no Clube</h3>
              <p className="font-medium">{profileData?.clubAthletes?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Dados Completos (JSON)</h2>
        <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
          <pre>{JSON.stringify(profileData, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mt-8">
        <Button onClick={fetchProfileData}>Atualizar Dados</Button>
      </div>
    </div>
  )
}
